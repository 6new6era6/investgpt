# InvestGPT — воронка лідогенерації

Коротко: набір сторінок і скриптів для інтеррактивної воронки: чат → аналіз → демо → форма.

Файлова структура (коротко):

- `index.php` — контактна форма (PHP)
- `index.html` — статична HTML-версія
- `/chat/index.html` — чат-опитувальник
- `/analysis/index.html` — картка аналізу
- `/demo/index.html` — демо-симуляція
- `/demo/data/` — приклади даних для демо
- `/js/` — логіка фронту: `chat_flow.js`, `scoring.js`, `analysis_card.js`, `demo_sim.js`, `handoff.js`
- `/api/openai.php` — бекенд-проксі (заглушка або реальна імплементація)

Запуск локально:

```bash
php -S localhost:8000
```

Відкрити:
- http://localhost:8000/index.html — статичний перегляд
- http://localhost:8000/chat/index.html — чат

Деплой:
- Статичну частину можна розмістити на GitHub Pages.
- Для роботи PHP та OpenAI-проксі потрібен хостинг з PHP і безпечним збереженням API-ключа.

Далі: заповнити логіку OpenAI у `/api/openai.php` (використовуючи змінну оточення `OPENAI_API_KEY`) і дописати UI/UX за чеклістом у `instruction`.