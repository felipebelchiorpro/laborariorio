/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: Sincronização de Respostas do WhatsApp Web com Google Sheets
 * ==============================================================================
 * 
 * INSTRUÇÕES DE IMPLANTAÇÃO:
 * 1. Abra a planilha de agendamentos do Google Sheets.
 * 2. Clique em "Extensões" > "Apps Script".
 * 3. Substitua todo o conteúdo pelo código abaixo.
 * 4. Ajuste a constante `NOME_ABA_AGENDAMENTOS` para o nome EXATO da sua aba (ex: "Agendamento" ou "Agendamentos").
 * 5. Clique em "Implantar" > "Nova implantação".
 * 6. Tipo: "App da Web".
 *    - Executar como: "Eu" (seu e-mail).
 *    - Quem tem acesso: "Qualquer pessoa" (Anyone).
 * 7. Copie a URL do Web App gerada e cole no popup da extensão Chrome.
 */

// REGRA ABSOLUTA DE ISOLAMENTO: O script altera APENAS esta aba.
const NOME_ABA_AGENDAMENTOS = "Agendamento"; // Altere se o nome da sua aba for "Agendamentos"

// Mapeamento das colunas (1-based index)
const COLUNA_ID = 1;         // Coluna A
const COLUNA_PACIENTE = 2;   // Coluna B
const COLUNA_DATA = 3;       // Coluna C
const COLUNA_TELEFONE = 4;   // Coluna D
const COLUNA_AVISADO = 5;    // Coluna E (Avisado / Notificado)
const COLUNA_STATUS = 6;     // Coluna F (Presença / Confirmação)
const COLUNA_OBS = 7;        // Coluna G (Observações)

/**
 * Função principal doPost chamada pelas requisições da extensão Chrome
 */
function doPost(e) {
  // Trava de Concorrência Multi-Máquina (Atomic Lock)
  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(10000); // Aguarda até 10 segundos pelo bloqueio atomicamente

  if (!hasLock) {
    return createJsonResponse({
      success: false,
      error: "O servidor está processando outra requisição simultânea. Tente novamente em alguns segundos.",
      atualizados: 0,
      ja_processados: 0,
      erros: 1,
      logs: ["Falha ao obter trava de concorrência LockService."]
    });
  }

  try {
    const rawData = e.postData ? e.postData.contents : "";
    if (!rawData) {
      return createJsonResponse({
        success: false,
        error: "Nenhum dado enviado no corpo da requisição.",
        atualizados: 0,
        ja_processados: 0,
        erros: 1
      });
    }

    const payloadBatch = JSON.parse(rawData);
    if (!Array.isArray(payloadBatch)) {
      return createJsonResponse({
        success: false,
        error: "Formato de payload inválido. Esperado um array de respostas.",
        atualizados: 0,
        ja_processados: 0,
        erros: 1
      });
    }

    // Acessar EXCLUSIVAMENTE a aba de agendamentos designada
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(NOME_ABA_AGENDAMENTOS);

    if (!sheet) {
      // Tentar busca flexível (singular/plural) apenas se a constante padrão não for encontrada
      const fallbackSheet = ss.getSheets().find(s => s.getName().toLowerCase().includes("agendamento"));
      if (!fallbackSheet) {
        throw new Error(`Aba '${NOME_ABA_AGENDAMENTOS}' não foi encontrada na planilha.`);
      }
      return processBatch(fallbackSheet, payloadBatch);
    }

    return processBatch(sheet, payloadBatch);

  } catch (err) {
    Logger.log("Erro no doPost: " + err.toString());
    return createJsonResponse({
      success: false,
      error: err.toString(),
      atualizados: 0,
      ja_processados: 0,
      erros: 1,
      logs: [err.toString()]
    });

  } finally {
    lock.releaseLock();
  }
}

/**
 * Processa o lote de respostas garantindo idempotência e isolamento
 */
function processBatch(sheet, payloadBatch) {
  const lastRow = sheet.getLastRow();
  let atualizadosCount = 0;
  let jaProcessadosCount = 0;
  let errosCount = 0;
  const logs = [];

  if (lastRow <= 1) {
    return createJsonResponse({
      success: true,
      atualizados: 0,
      ja_processados: 0,
      erros: 0,
      logs: ["Nenhum agendamento cadastrado na aba."]
    });
  }

  // Ler todos os dados da aba de agendamentos (linhas de dados a partir da linha 2)
  const dataRange = sheet.getRange(2, 1, lastRow - 1, Math.max(COLUNA_STATUS, COLUNA_OBS));
  const values = dataRange.getValues();

  payloadBatch.forEach((item) => {
    try {
      const cleanPhoneItem = cleanPhoneDigits(item.phone);
      const responseOption = String(item.response || "").trim();

      if (!cleanPhoneItem) {
        errosCount++;
        logs.push(`Item ignorado: Número de telefone ausente ou inválido (${item.phone}).`);
        return;
      }

      // Localizar a linha correspondente na planilha pelo número de telefone
      let targetRowIndex = -1; // Index 0-based relativo a matriz values (linha da planilha = targetRowIndex + 2)
      
      for (let i = 0; i < values.length; i++) {
        const rowPhone = cleanPhoneDigits(values[i][COLUNA_TELEFONE - 1]);
        if (rowPhone && (rowPhone === cleanPhoneItem || rowPhone.endsWith(cleanPhoneItem) || cleanPhoneItem.endsWith(rowPhone))) {
          targetRowIndex = i;
          break;
        }
      }

      if (targetRowIndex === -1) {
        errosCount++;
        logs.push(`Paciente com telefone ${cleanPhoneItem} não foi encontrado na aba de agendamentos.`);
        return;
      }

      const patientName = values[targetRowIndex][COLUNA_PACIENTE - 1] || `Linha ${targetRowIndex + 2}`;
      const currentStatus = String(values[targetRowIndex][COLUNA_STATUS - 1] || "").trim();

      // VALIDAÇÃO DE ESTADO PRÉVIO (IDEMPOTÊNCIA):
      // Se o status já estiver definido como Confirmado ou Remarcar, ignora e contabiliza como ja_processados
      if (currentStatus === "Confirmado" || currentStatus === "Vaga Liberada / Remarcar" || currentStatus === "vai" || currentStatus === "nao_vai") {
        jaProcessadosCount++;
        logs.push(`Paciente ${patientName} (${cleanPhoneItem}): Já estava como '${currentStatus}' (Ignorado).`);
        return;
      }

      // Determinar o novo status com base na resposta ("1" = Confirmado, "2" = Remarcar)
      let newStatus = "";
      if (responseOption === "1") {
        newStatus = "Confirmado";
      } else if (responseOption === "2") {
        newStatus = "Vaga Liberada / Remarcar";
      } else {
        errosCount++;
        logs.push(`Resposta '${responseOption}' inválida para o paciente ${patientName}.`);
        return;
      }

      // Gravação na Planilha
      const rowNumInSheet = targetRowIndex + 2;

      // Atualizar Coluna de Status (Coluna F)
      sheet.getRange(rowNumInSheet, COLUNA_STATUS).setValue(newStatus);
      
      // Atualizar Coluna de Avisado (Coluna E) para "SIM"
      sheet.getRange(rowNumInSheet, COLUNA_AVISADO).setValue("SIM");

      atualizadosCount++;
      logs.push(`Paciente ${patientName}: Atualizado para '${newStatus}' com sucesso.`);

    } catch (errItem) {
      errosCount++;
      logs.push(`Erro ao processar item (${item.phone}): ${errItem.message}`);
    }
  });

  return createJsonResponse({
    success: true,
    atualizados: atualizadosCount,
    ja_processados: jaProcessadosCount,
    erros: errosCount,
    logs: logs
  });
}

/**
 * Função Auxiliar: Limpa strings numéricas para dígitos puros
 */
function cleanPhoneDigits(val) {
  if (!val) return "";
  return String(val).replace(/\D/g, "");
}

/**
 * Função Auxiliar: Formata a resposta JSON para o cliente da extensão
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Suporte a requisições GET para teste rápido no navegador
 */
function doGet(e) {
  return createJsonResponse({
    status: "online",
    service: "Agendamentos Posto de Saude WhatsApp Web Sync",
    targetSheet: NOME_ABA_AGENDAMENTOS,
    timestamp: new Date().toISOString()
  });
}
