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

            logger.debug('Response Received', {
                id: requestId,
                ok: response.ok,
                status: response.status,
                headers: Object.fromEntries([...response.headers])
            });

            if (!response.ok) throw new Error('API Error: ' + response.status);
            if (!response.body) throw new Error('No response body from API');

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            logger.debug('Starting Stream', { id: requestId });
            const reader = response.body.getReader();
            let accumulated = '';
            let lastChunkTime = Date.now();

            typing.remove();
            const botMessage = await appendMessage('', 'bot', false);

            // Buffer for SSE style parsing
            let buffer = '';
            let chunkCount = 0;

            while (true) {
                const {value, done} = await reader.read();
                lastChunkTime = Date.now();

                if (done) {
                    logger.debug('Stream Complete', { id: requestId, totalChunks: chunkCount, totalLength: accumulated.length });
                    break;
                }

                const chunk = new TextDecoder().decode(value);
                chunkCount++;
                logger.debug('Chunk Received', { id: requestId, chunkNumber: chunkCount, chunkLength: chunk.length });

                buffer += chunk;

                // Process all complete SSE events (separated by \n\n)
                while (true) {
                    const idx = buffer.indexOf('\n\n');
                    if (idx === -1) break;

                    const raw = buffer.slice(0, idx);
                    buffer = buffer.slice(idx + 2);

                    // Parse SSE block
                    const lines = raw.split('\n');
                    let event = 'message';
                    let dataLines = [];
                    for (const ln of lines) {
                        if (ln.startsWith('event:')) {
                            event = ln.slice(6).trim();
                        } else if (ln.startsWith('data:')) {
                            dataLines.push(ln.slice(5).trim());
                        }
                    }
                    const dataStr = dataLines.join('\n');

                    if (event === 'php-debug') {
                        try {
                            const dbg = JSON.parse(dataStr);
                            console.debug(`[${dbg.time}] ${dbg.label}:`, dbg.data);
                        } catch (e) {
                            console.debug('php-debug (raw):', dataStr);
                        }
                        continue;
                    }

                    if (event === 'done') {
                        logger.debug('Stream Done Marker', { id: requestId });
                        continue;
                    }

                    // event === 'message'
                    let parsed;
                    try {
                        parsed = JSON.parse(dataStr);
                    } catch (err) {
                        logger.error('Parse Error', { id: requestId, error: err, payload: dataStr });
                        continue;
                    }

                    // Extract content: OpenAI chunk has choices[].delta.content or choices[].delta
                    let content = '';
                    try {
                        if (parsed.choices && Array.isArray(parsed.choices)) {
                            for (const c of parsed.choices) {
                                if (c.delta && typeof c.delta === 'object') {
                                    if (c.delta.content) content += c.delta.content;
                                } else if (c.text) {
                                    content += c.text;
                                }
                            }
                        } else if (parsed.content) {
                            content = parsed.content;
                        }
                    } catch (e) {
                        // ignore
                    }

                    accumulated += content;
                    botMessage.textContent = accumulated;
                    chat.scrollTop = chat.scrollHeight;

                    logger.debug('Content Update', { id: requestId, newContentLength: content.length, totalLength: accumulated.length });
                }

                // safety timeout
                const timeSinceLastChunk = Date.now() - lastChunkTime;
                if (timeSinceLastChunk > 30000) {
                    logger.debug('Stream Timeout', { id: requestId, timeSinceLastChunk, totalChunks: chunkCount });
                    throw new Error('Stream timeout - no data received for 30s');
                }
            }
            
            context.messages.push({ role: 'assistant', content: accumulated });
            logger.debug('Message Complete', {
                id: requestId,
                finalLength: accumulated.length,
                messageCount: context.messages.length
            });
            
            // Перевірка на перехід до наступного етапу
            if (accumulated.includes('[TO_ANALYSIS]')) {
                logger.debug('Analysis Redirect', { id: requestId });
                setTimeout(() => { window.location.href = '../analysis/'; }, 2000);
            }
            
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
