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

    // Запит до OpenAI
    async function askOpenAI(message) {
        const typing = showTyping();
        try {
            context.messages.push({ role: 'user', content: message });
            
            const response = await fetch('/api/openai.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(context)
            });

            if (!response.ok) throw new Error('API Error');
            
            const reader = response.body.getReader();
            let accumulated = '';
            
            typing.remove();
            const botMessage = await appendMessage('', 'bot', false);
            
            while (true) {
                const {value, done} = await reader.read();
                if (done) break;
                
                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (!line.trim() || !line.startsWith('data: ')) continue;
                    const data = JSON.parse(line.slice(5));
                    
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    
                    accumulated += data.content || '';
                    botMessage.textContent = accumulated;
                    chat.scrollTop = chat.scrollHeight;
                }
            }
            
            context.messages.push({ role: 'assistant', content: accumulated });
            
            // Перевірка на перехід до наступного етапу
            if (accumulated.includes('[TO_ANALYSIS]')) {
                setTimeout(() => { window.location.href = '/analysis/'; }, 2000);
            }
            
        } catch (e) {
            typing.remove();
            await appendMessage('Вибачте, сталася помилка. Спробуйте ще раз.', 'bot');
            console.error('OpenAI Error:', e);
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

    // Початкове повідомлення
    appendMessage('Вітаю! Я — ваш AI-консультант з інвестицій. Для початку, розкажіть про вашу головну інвестиційну мету.');
})();
