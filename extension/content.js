/* ==========================================================================
   Content Script - WhatsApp Web Automation & Response Extractor
   ========================================================================== */

(function () {
  let isAutomationActive = false;
  let webAppUrl = '';

  // Inicializacao: verificar estado no chrome.storage.local
  chrome.storage.local.get(['automationActive', 'webAppUrl'], (data) => {
    isAutomationActive = data.automationActive === true;
    webAppUrl = data.webAppUrl || '';
    
    injectStationBadge();
  });

  // Ouvinte de mensagens enviadas pelo popup.js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'TOGGLE_AUTOMATION') {
      isAutomationActive = request.active === true;
      updateBadgeUI();
      showToast(isAutomationActive ? '🟢 Estação de Automação ATIVADA' : '🔴 Estação de Automação INATIVA');
      sendResponse({ success: true });
    } else if (request.action === 'UPDATE_WEB_APP_URL') {
      webAppUrl = request.url;
      sendResponse({ success: true });
    } else if (request.action === 'TRIGGER_SYNC') {
      if (!isAutomationActive) {
        sendResponse({ success: false, error: 'Estação de automação está DESLIGADA nesta máquina.' });
        return true;
      }

      scanAndSyncWhatsAppResponses()
        .then(result => sendResponse({ success: true, data: result }))
        .catch(err => sendResponse({ success: false, error: err.message || 'Falha ao sincronizar.' }));

      return true; // Mantem a porta de comunicacao assincrona aberta
    }
  });

  // Injetar Indicador Visual Discreto no DOM do WhatsApp Web
  function injectStationBadge() {
    if (document.getElementById('wa-automation-badge-container')) return;

    const badgeContainer = document.createElement('div');
    badgeContainer.id = 'wa-automation-badge-container';
    badgeContainer.innerHTML = `
      <div id="waStationBadge" class="wa-station-badge ${isAutomationActive ? 'active' : 'inactive'}">
        <span class="dot"></span>
        <span id="waStationBadgeText">${isAutomationActive ? 'Estação Ativa (Automação)' : 'Automação: Desligada'}</span>
      </div>
    `;

    document.body.appendChild(badgeContainer);
  }

  function updateBadgeUI() {
    const badge = document.getElementById('waStationBadge');
    const text = document.getElementById('waStationBadgeText');
    if (!badge || !text) return;

    if (isAutomationActive) {
      badge.className = 'wa-station-badge active';
      text.textContent = 'Estação Ativa (Automação)';
    } else {
      badge.className = 'wa-station-badge inactive';
      text.textContent = 'Automação: Desligada';
    }
  }

  // --- Função Principal de Varrer e Sincronizar Respostas ---
  async function scanAndSyncWhatsAppResponses() {
    if (!webAppUrl) {
      throw new Error('URL do Web App do Google Apps Script não foi configurada.');
    }

    const payloadBatch = extractUnreadWhatsAppResponses();

    if (payloadBatch.length === 0) {
      showToast('ℹ️ Nenhuma nova resposta "1" ou "2" encontrada nas conversas recentes.');
      return { atualizados: 0, ja_processados: 0, erros: 0, logs: ['Nenhuma nova mensagem com "1" ou "2" encontrada no WhatsApp Web.'] };
    }

    showToast(`⏳ Enviando ${payloadBatch.length} resposta(s) para o Google Sheets...`);

    // Disparar POST em lote para o Web App do Google Apps Script
    try {
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Usando text/plain para evitar pre-flight CORS no Apps Script
        body: JSON.stringify(payloadBatch)
      });

      const resText = await response.text();
      let resJson;
      try {
        resJson = JSON.parse(resText);
      } catch (e) {
        throw new Error('Resposta inválida do Google Apps Script. Verifique a URL do Web App.');
      }

      showToast(`✅ Sincronização: ${resJson.atualizados || 0} atualizados, ${resJson.ja_processados || 0} já processados, ${resJson.erros || 0} erros`);
      return resJson;

    } catch (err) {
      showToast(`❌ Erro na comunicação com o Google Sheets: ${err.message}`);
      throw err;
    }
  }

  // Extrator Resiliente de Respostas ("1" ou "2") no DOM do WhatsApp Web
  function extractUnreadWhatsAppResponses() {
    const responses = [];
    const seenPhones = new Set();

    // 1. Procurar nas linhas da lista de conversas (#pane-side / grid)
    const chatRows = document.querySelectorAll('#pane-side div[role="listitem"], #pane-side div[tabindex="-1"], div._ak8l');

    chatRows.forEach((row) => {
      try {
        const textContent = row.textContent || '';
        
        // Identificar se ha resposta "1" ou "2"
        const cleanMsg = cleanTextResponse(textContent);
        if (cleanMsg !== '1' && cleanMsg !== '2') return;

        // Extrair telefone ou identificador do contato
        const phone = extractPhoneFromElement(row, textContent);
        if (!phone || seenPhones.has(phone)) return;

        seenPhones.add(phone);
        responses.push({
          phone: phone,
          response: cleanMsg,
          rawText: textContent.substring(0, 100),
          timestamp: new Date().toISOString()
        });

      } catch (err) {
        console.warn('[WhatsApp Sync] Erro ao ler linha de conversa:', err);
      }
    });

    // 2. Procurar na conversa aberta atualmente se houver mensagens do paciente
    const activeMessages = document.querySelectorAll('div.message-in, div[data-id*="false_"]');
    activeMessages.forEach((msgEl) => {
      try {
        const textEl = msgEl.querySelector('span.selectable-text, span.dir-auto, div._akbu');
        if (!textEl) return;

        const textContent = textEl.textContent || '';
        const cleanMsg = cleanTextResponse(textContent);
        if (cleanMsg !== '1' && cleanMsg !== '2') return;

        // Tentar obter telefone do cabeçalho da conversa aberta
        const headerTitle = document.querySelector('header span[title], header div._amda');
        const headerText = headerTitle ? headerTitle.textContent || '' : '';
        const phone = extractCleanPhone(headerText) || extractCleanPhone(document.location.href);

        if (phone && !seenPhones.has(phone)) {
          seenPhones.add(phone);
          responses.push({
            phone: phone,
            response: cleanMsg,
            rawText: textContent.substring(0, 100),
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('[WhatsApp Sync] Erro ao ler mensagem ativa:', err);
      }
    });

    return responses;
  }

  // Funcao de limpeza e correspondencia estrita de resposta
  function cleanTextResponse(rawText) {
    if (!rawText) return '';
    
    // Procura por padroes isolados de 1 ou 2 no texto
    const lines = rawText.split('\n').map(l => l.trim());
    for (const line of lines) {
      const cleaned = line.replace(/[^0-9]/g, '');
      if (cleaned === '1' || cleaned === '2') {
        return cleaned;
      }
    }

    return '';
  }

  // Extrator de telefone limpo (somente dígitos)
  function extractPhoneFromElement(element, textContent) {
    // 1. Tentar pegar de atributos data-id ou data-jid (ex: 5519998765432@c.us)
    const dataId = element.getAttribute('data-id') || element.innerHTML || '';
    const jidMatch = dataId.match(/(\d{10,15})@c\.us/);
    if (jidMatch && jidMatch[1]) {
      return jidMatch[1];
    }

    // 2. Tentar extrair do texto do elemento (ex: "+55 19 99876-5432")
    return extractCleanPhone(textContent);
  }

  function extractCleanPhone(str) {
    if (!str) return '';
    const digits = str.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) {
      return digits;
    }
    return '';
  }

  // Toast de Notificação no DOM
  function showToast(message) {
    const existing = document.querySelector('.wa-auto-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'wa-auto-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }
})();
