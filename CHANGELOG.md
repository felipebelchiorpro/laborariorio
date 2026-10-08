# Registro de Alterações (CHANGELOG)

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.5.0] - 2026-10-08

### 🚀 Adicionado
- **Extensão Chrome (Manifest V3)** na pasta `/extension` para automação no WhatsApp Web:
  - `manifest.json`: Configuração do Manifest V3 com permissões estritas (`storage`, `activeTab`, host permissions).
  - `popup.html` / `popup.js`: Interface com toggle switch Liga/Desliga, indicador visual de status da estação, campo de URL do Web App e botão de sincronização.
  - `styles.css`: Estilos visuais modernos para o popup e badge discreto de status injetado no DOM do WhatsApp Web.
  - `content.js`: Leitura resiliente do DOM do WhatsApp Web, identificação de respostas estritas "1" (Confirmar) e "2" (Remarcar), extração de número limpo e disparo de payload JSON em lote.
- **Google Apps Script Idempotente (`extension/google-apps-script.js`)**:
  - Script pronto para implantação como Web App no Google Apps Script.
  - **Isolamento Absoluto de Abas**: Atua estritamente na aba definida em `NOME_ABA_AGENDAMENTOS` (ex: `"Agendamentos"`). Sob nenhuma hipótese altera as abas operacionais "São Lucas", "São João", "FOSP" ou "Fichário".
  - **Concorrência Atômica**: Utiliza `LockService.getScriptLock()` para evitar condições de corrida em acessos simultâneos de múltiplas máquinas.
  - **Validação de Estado Prévio (Idempotência)**: Não sobrescreve agendamentos que já possuem status "Confirmado" ou "Vaga Liberada / Remarcar", contabilizando como `ja_processados`.
  - **Retorno JSON Estruturado**: Fornece contadores detalhados (`atualizados`, `ja_processados`, `erros`) e logs por paciente.
- **Segurança (Safe by Default)**: A extensão é instalada inativa por padrão. A chave Liga/Desliga é armazenada individualmente em `chrome.storage.local` para cada navegador.

---

### ⏪ Instruções de Rollback Imediato para v1.0.0

Se por qualquer motivo for necessário reverter a aplicação para a versão **v1.0.0** (versão estável anterior sem a extensão Chrome):

#### Opção A: Checkout Temporário para Inspeção/Uso da v1.0.0
```bash
git checkout v1.0.0
```

#### Opção B: Reversão Definitiva na Branch `main`
```bash
git reset --hard v1.0.0
git push origin main --force
```

#### Opção C: Desinstalação da Extensão Chrome
1. Acesse `chrome://extensions` no navegador Chrome/Edge.
2. Localize a extensão **"Agendamentos Posto de Saúde - WhatsApp Sync"**.
3. Clique em **"Remover"**.

---

## [1.0.0] - 2026-10-07

### 📌 Versão Inicial Estável
- Módulo de Agendamentos & WhatsApp no sistema Web Next.js.
- Visualização de próximos agendamentos, busca rápida, etiquetas de urgência e arquivamento de consultas antigas.
- Suporte a múltiplas planilhas integradas via Google Sheets API (São Lucas, São João, FOSP, Fichário, Recoletas, Agendamentos).
- Tag de versão `v1.0.0` fixada no repositório remoto.
