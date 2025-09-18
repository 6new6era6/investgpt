// Простий скелет chat_flow.js
(function(){
  const chat = document.getElementById('chat');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');

  // Простий локальний контекст
  const leadCtx = {answers:[], meta:{started:Date.now()}};

  function appendMessage(text, cls){
    const el = document.createElement('div');
    el.className = 'bubble ' + (cls||'bot');
    el.textContent = text;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
  }

  send.addEventListener('click', ()=>{
    const v = input.value.trim();
    if(!v) return;
    appendMessage(v,'user');
    leadCtx.answers.push(v);
    input.value = '';
    // ТУТ: виклик до /api/openai.php або локальна логіка
    appendMessage('Дякую — продовжуємо...', 'bot');
    sessionStorage.leadCtx = JSON.stringify(leadCtx);
  });

  // Початкове привітання
  appendMessage('Привіт! Розкажіть, яка у вас ціль інвестування?', 'bot');
})();