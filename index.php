<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>InvestGPT — AI-опитування</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div id="chat-container">
    <div id="chat-window"></div>
    <form id="chat-form">
      <input type="text" id="chat-input" autocomplete="off" placeholder="Ваша відповідь..." required>
      <button type="submit">Відправити</button>
    </form>
    <div id="spinner" style="display:none">Зачекайте, AI думає...</div>
  </div>
  <script src="/js/chat_flow.js"></script>
  <script src="/js/failsafe_questions.js"></script>
  <script>
    // UI-обʼєкт для chat_flow.js
    const chatWindow = document.getElementById('chat-window');
    const spinner = document.getElementById('spinner');
    window.ui = {
      appendChunk: chunk => {
        const el = document.createElement('div');
        el.className = 'ai-reply';
        el.textContent = chunk;
        chatWindow.appendChild(el);
        chatWindow.scrollTop = chatWindow.scrollHeight;
      },
      showAnalysis: result => {
        const el = document.createElement('div');
        el.className = 'ai-analysis';
        el.textContent = `Аналіз: ${JSON.stringify(result)}`;
        chatWindow.appendChild(el);
      },
      askClarifying: (field, reason) => {
        const el = document.createElement('div');
        el.className = 'ai-clarify';
        el.textContent = `Уточніть, будь ласка, ${field}: ${reason}`;
        chatWindow.appendChild(el);
      },
      showDemoAsset: (asset, reason) => {
        const el = document.createElement('div');
        el.className = 'ai-demo';
        el.textContent = `Демо-актив: ${asset}. Причина: ${reason}`;
        chatWindow.appendChild(el);
      },
      showForm: reason => {
        const el = document.createElement('div');
        el.className = 'ai-form';
        el.textContent = `Ви готові перейти до форми? ${reason}`;
        chatWindow.appendChild(el);
        // Тут можна показати реальну форму
      },
      askMore: reason => {
        const el = document.createElement('div');
        el.className = 'ai-more';
        el.textContent = `Ще питання: ${reason}`;
        chatWindow.appendChild(el);
      },
      showMessage: msg => {
        const el = document.createElement('div');
        el.className = 'ai-msg';
        el.textContent = msg;
        chatWindow.appendChild(el);
      }
    };

    // Стартова ініціалізація
    let state = {
      phase: 'chat',
      answers: {},
      auto_signals: { city: 'Kyiv', device: 'desktop', lang: 'uk', currency: 'UAH' }
    };
    let messages = [
      { role: 'system', content: 'Ти — AI-аналітик інвест-профілю. Завдання: провести невимушене опитування...' },
      { role: 'developer', content: JSON.stringify(state) },
      { role: 'user', content: 'Вітаю! Я хочу дізнатись про інвестування.' }
    ];

    // Відправка повідомлення
    document.getElementById('chat-form').onsubmit = async function(e) {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const text = input.value.trim();
      if (!text) return;
      messages.push({ role: 'user', content: text });
      ui.appendChunk('Ви: ' + text);
      input.value = '';
      spinner.style.display = 'block';
      await talkToAI(messages, state);
      spinner.style.display = 'none';
    };
  </script>
</body>
</html>
