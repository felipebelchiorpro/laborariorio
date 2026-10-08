document.addEventListener('DOMContentLoaded', () => {
  const automationToggle = document.getElementById('automationToggle');
  const statusBadge = document.getElementById('statusBadge');
  const webAppUrlInput = document.getElementById('webAppUrl');
  const syncBtn = document.getElementById('syncBtn');
  const feedbackBox = document.getElementById('feedbackBox');

  // Carregar configuracoes salvas no chrome.storage.local
  chrome.storage.local.get(['automationActive', 'webAppUrl', 'lastResult'], (data) => {
    const isActive = data.automationActive === true;
    automationToggle.checked = isActive;
    updateStatusUI(isActive);

    if (data.webAppUrl) {
      webAppUrlInput.value = data.webAppUrl;
    }

    if (data.lastResult) {
      renderFeedback(data.lastResult);
    }
  });

  // Evento do Toggle Switch (Modo Automação)
  automationToggle.addEventListener('change', (e) => {
    const isActive = e.target.checked;
    chrome.storage.local.set({ automationActive: isActive }, () => {
      updateStatusUI(isActive);
      notifyContentScript({ action: 'TOGGLE_AUTOMATION', active: isActive });
    });
  });

  // Salvar URL do Web App
  webAppUrlInput.addEventListener('change', (e) => {
    const url = e.target.value.trim();
    chrome.storage.local.set({ webAppUrl: url }, () => {
      notifyContentScript({ action: 'UPDATE_WEB_APP_URL', url });
    });
  });

  // Evento do Botao de Sincronizacao Manual
  syncBtn.addEventListener('click', async () => {
    const webAppUrl = webAppUrlInput.value.trim();
    if (!webAppUrl) {
      alert('Por favor, informe a URL do Web App do Google Apps Script antes de sincronizar.');
      webAppUrlInput.focus();
      return;
    }

    syncBtn.disabled = true;
    syncBtn.innerHTML = '<span>⏳ Sincronizando...</span>';

    // Obter aba ativa do WhatsApp Web
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.includes('web.whatsapp.com')) {
      alert('A sincronização precisa ser disparada com a aba do WhatsApp Web aberta!');
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<span>⚡ Sincronizar Respostas Agora</span>';
      return;
    }

    // Enviar mensagem para o content.js da aba
    chrome.tabs.sendMessage(tab.id, { action: 'TRIGGER_SYNC' }, (response) => {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<span>⚡ Sincronizar Respostas Agora</span>';

      if (chrome.runtime.lastError) {
        renderError('Não foi possível se comunicar com o WhatsApp Web. Recarregue a página do WhatsApp Web e tente novamente.');
        return;
      }

      if (response && response.success) {
        renderFeedback(response.data);
        chrome.storage.local.set({ lastResult: response.data });
      } else {
        renderError(response ? response.error : 'Erro desconhecido ao sincronizar.');
      }
    });
  });

  function updateStatusUI(isActive) {
    if (isActive) {
      statusBadge.textContent = 'Estação Ativa';
      statusBadge.className = 'status-badge active';
      syncBtn.disabled = false;
    } else {
      statusBadge.textContent = 'Estação Inativa';
      statusBadge.className = 'status-badge inactive';
      syncBtn.disabled = true;
    }
  }

  function renderFeedback(res) {
    if (!res) return;

    let html = `
      <div class="feedback-row success"><span>Confirmados/Remarcados:</span> <strong>${res.atualizados || 0}</strong></div>
      <div class="feedback-row ignored"><span>Já Processados:</span> <strong>${res.ja_processados || 0}</strong></div>
      <div class="feedback-row error"><span>Erros:</span> <strong>${res.erros || 0}</strong></div>
    `;

    if (res.logs && res.logs.length > 0) {
      html += `<div style="margin-top: 6px; font-weight: 600; color: #cbd5e1;">Logs do Processamento:</div>`;
      res.logs.forEach(log => {
        html += `<div class="feedback-log">• ${escapeHtml(log)}</div>`;
      });
    }

    feedbackBox.innerHTML = html;
  }

  function renderError(msg) {
    feedbackBox.innerHTML = `
      <div class="feedback-row error"><span>Falha na Sincronização:</span></div>
      <div class="feedback-log" style="color: #f87171;">${escapeHtml(msg)}</div>
    `;
  }

  function notifyContentScript(message) {
    chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
      tabs.forEach(t => {
        chrome.tabs.sendMessage(t.id, message, () => {
          // Ignorar erros caso o script ainda nao esteja injetado na aba
          if (chrome.runtime.lastError) {}
        });
      });
    });
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
});
