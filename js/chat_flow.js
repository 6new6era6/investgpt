// Покращений chat_flow.js з анімаціями та OpenAI інтеграцією
(() => {
    const chat = document.getElementById('chat');
    const input = document.getElementById('chat-input');
    const send = document.getElementById('chat-send');
    const context = {
        messages: [],
        state: { phase: 'initial' }
    };

    // Анімований вивід тексту
    function typeMessage(text, element, speed = 30) {
        return new Promise(resolve => {
            let i = 0;
            element.textContent = '';
            const timer = setInterval(() => {
                element.textContent += text[i];
                i++;
                if (i >= text.length) {
                    clearInterval(timer);
                    resolve();
                }
                chat.scrollTop = chat.scrollHeight;
            }, speed);
        });
    }

    // Додавання повідомлення
    async function appendMessage(text, cls = 'bot', animate = true) {
        const el = document.createElement('div');
        el.className = `bubble ${cls}`;
        chat.appendChild(el);
        
        if (animate && cls === 'bot') {
            await typeMessage(text, el);
        } else {
            el.textContent = text;
        }
        
        chat.scrollTop = chat.scrollHeight;
        return el;
    }

    // Індикатор набору
    function showTyping() {
        const el = document.createElement('div');
        el.className = 'typing-indicator';
        el.innerHTML = '<span></span><span></span><span></span>';
        chat.appendChild(el);
        chat.scrollTop = chat.scrollHeight;
        return el;
    }

    // Логи для відстеження таймінгів та подій
const logger = {
    debug: (label, ...args) => {
        const time = new Date().toISOString();
        console.debug(`[${time}] ${label}:`, ...args);
    },
    error: (label, error) => {
        const time = new Date().toISOString();
        console.error(`[${time}] ${label}:`, error);
    }
};

// Запит до OpenAI
    async function askOpenAI(message) {
        const requestId = Math.random().toString(36).substring(7);
        logger.debug('Request Start', { id: requestId, message });
        
        const typing = showTyping();
        try {
            context.messages.push({ role: 'user', content: message });
            logger.debug('Context Updated', { 
                id: requestId, 
                messageCount: context.messages.length 
            });

            // Use AbortController to avoid hanging reads
            const ac = new AbortController();
            const timeoutMs = 30000; // 30s
            const timeoutId = setTimeout(() => {
                ac.abort();
                logger.debug('Request Timeout', { id: requestId, timeoutMs });
            }, timeoutMs);

            logger.debug('Sending Fetch', { id: requestId });
            const response = await fetch('../api/openai.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(context),
                signal: ac.signal
            });
            clearTimeout(timeoutId);

            logger.debug('Response Received', { id: requestId, ok: response.ok, status: response.status });
            if (!response.ok) throw new Error('API Error: ' + response.status);

            const json = await response.json();
            typing.remove();
            const botMessage = await appendMessage('', 'bot', false);

            // If server indicates demo mode or error
            if (json.error) {
                logger.error('API returned error', json.error);
                await appendMessage(json.error + (json.demo ? ' (demo mode)' : ''), 'bot');
                return;
            }

            // If server already returned structured JSON, handle accordingly
            if (json.reply) {
                botMessage.textContent = json.reply;
                context.messages.push({ role: 'assistant', content: json.reply });
                if (json.action === 'analysis' || (json.reply && json.reply.includes('[TO_ANALYSIS]'))) {
                    setTimeout(() => { window.location.href = '../analysis/'; }, 1200);
                }
            } else {
                // Merge any direct keys from server response into a pretty output
                botMessage.textContent = JSON.stringify(json, null, 2);
                context.messages.push({ role: 'assistant', content: botMessage.textContent });
            }

            logger.debug('Message Complete', { id: requestId, messageCount: context.messages.length });
            
        } catch (e) {
            logger.error('Request Failed', {
                id: requestId,
                error: e.message,
                stack: e.stack
            });
            
            typing.remove();
            await appendMessage('Вибачте, сталася помилка. Спробуйте ще раз.', 'bot');
        }
    }

    // Обробка подій
    send.addEventListener('click', async () => {
        const message = input.value.trim();
        if (!message) return;
        
        input.value = '';
        await appendMessage(message, 'user', false);
        await askOpenAI(message);
    });

    input.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send.click();
        }
    });

    // Початкове повідомлення (додаємо лише якщо немає вже бот-повідомлення в HTML)
    if (!document.querySelector('.bubble.bot')) {
        appendMessage('Вітаю! Я — ваш AI-консультант з інвестицій. Для початку, розкажіть про вашу головну інвестиційну мету.');
    }
})();
