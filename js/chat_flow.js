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

    // js/chat_flow.js — JSON клієнт (без SSE), з typing, з кнопкою "Перейти до демо"

    (function() {
        const chat  = document.getElementById('chat');
        const input = document.getElementById('chat-input');
        const send  = document.getElementById('chat-send');

        const context = {
            // messages — те, що піде в OpenAI; ми самі додамо system/dev на бекенді
            messages: [],
            model: 'gpt-4o-mini'
        };

        // ---------- UI ----------
        function typeMessage(text, element, speed = 24) {
            return new Promise(resolve => {
                let i = 0;
                element.textContent = '';
                const timer = setInterval(() => {
                    element.textContent += text[i] ?? '';
                    i++;
                    if (i >= text.length) {
                        clearInterval(timer);
                        resolve();
                    }
                    chat.scrollTop = chat.scrollHeight;
                }, speed);
            });
        }

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

        function showTyping() {
            const el = document.createElement('div');
            el.className = 'typing-indicator';
            el.innerHTML = '<span></span><span></span><span></span>';
            chat.appendChild(el);
            chat.scrollTop = chat.scrollHeight;
            return el;
        }

        function showDemoButton(asset) {
            const btnWrap = document.createElement('div');
            btnWrap.style.marginTop = '8px';
            const btn = document.createElement('button');
            btn.textContent = 'Перейти до демо';
            btn.className = 'cta';
            btn.onclick = () => {
                const q = asset ? `?asset=${encodeURIComponent(asset)}` : '';
                // демо в підпапці
                window.location.href = `../demo/index.html${q}`;
            };
            btnWrap.appendChild(btn);
            chat.appendChild(btnWrap);
            chat.scrollTop = chat.scrollHeight;
        }

        // ---------- OpenAI (JSON, без стріму) ----------
        async function askOpenAI(userText) {
            // додаємо користувача в історію для моделі
            context.messages.push({ role: 'user', content: userText });

            const typing = showTyping();
            try {
                const ac = new AbortController();
                const tId = setTimeout(() => ac.abort(), 30000);

                const res = await fetch('../api/openai.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(context),
                    signal: ac.signal
                });

                clearTimeout(tId);
                typing.remove();

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                if (data.error === 'NO_API_KEY') {
                    // fallback: коротка логіка без GPT
                    return await fallbackFlow(userText);
                }

                const reply  = (data.reply ?? '').toString();
                const action = (data.action ?? 'ask').toString();
                const updates = data.updates || {};
                const demo = data.demo || {};

                // Рендеримо відповідь
                if (reply) {
                    await appendMessage(reply, 'bot', true);
                    context.messages.push({ role: 'assistant', content: reply });
                }

                // Застосовуємо оновлення стану (опційно — можеш записувати у sessionStorage)
                applyUpdates(updates);

                // Обробка дії
                switch (action) {
                    case 'ask':
                        // просто чекаємо наступної відповіді користувача
                        break;
                    case 'show_analysis':
                        // аналіз уже в reply; нічого не робимо додатково
                        break;
                    case 'goto_demo':
                        showDemoButton(demo.asset || pickDefaultAsset());
                        break;
                    case 'postdemo':
                        // якщо потрібно — можеш показати мікроформу на цій сторінці
                        break;
                    case 'goto_form':
                        window.location.href = '../index.php';
                        break;
                    default:
                        break;
                }

            } catch (err) {
                typing.remove();
                console.error('OpenAI error', err);
                await appendMessage('Вибачте, сталася помилка. Спробуйте ще раз.', 'bot');
            }
        }

        function applyUpdates(upd) {
            try {
                const state = JSON.parse(sessionStorage.leadCtx || '{"answers":{}}');
                const answers = { ...(state.answers || {}), ...((upd && upd.answers) || {}) };
                const merged = { ...state, ...upd, answers };
                sessionStorage.leadCtx = JSON.stringify(merged);
            } catch (_) {}
        }

        function pickDefaultAsset() {
            try {
                const st = JSON.parse(sessionStorage.leadCtx || '{}');
                const curr = st.currency || st.auto_signals?.currency || 'USD';
                return `BTC/${curr}`;
            } catch (_) {
                return 'BTC/USD';
            }
        }

        // ---------- Fallback (без OpenAI) ----------
        const fbQ = [
            'Яка ваша головна мета на 1–3 роки? (житло/пасивний дохід/швидкий ріст)',
            'На який горизонт плануєте? (6–12 міс / 1–3 роки / 3–5 років / 5+)',
            'Рівень ризику? (низький/середній/високий)',
            'Сума для старту? (250/500/1000)',
            'Що цікавить: крипта/акції/FX/індекси?'
        ];
        let fbIdx = 0;

        async function fallbackFlow(userText) {
            // дуже простий сценарій
            if (fbIdx >= fbQ.length) {
                const summary = 'Аналіз (спрощено): оцінний шанс 55–75%. Перейдемо до демо?';
                await appendMessage(summary, 'bot', true);
                showDemoButton(pickDefaultAsset());
                return;
            }
            await appendMessage(fbQ[fbIdx++], 'bot', true);
        }

        // ---------- Події ----------
        send.addEventListener('click', async () => {
            const message = input.value.trim();
            if (!message) return;
            input.value = '';
            await appendMessage(message, 'user', false);
            askOpenAI(message);
        });

        input.addEventListener('keypress', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send.click();
            }
        });

        // Початковий стан: якщо треба — одразу попросимо GPT поставити перше питання
        // (у тебе вже є первинна бульбашка в HTML, тому просто чекаємо на відповідь юзера)
    })();
