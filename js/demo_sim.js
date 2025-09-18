// Покращений demo_sim.js з графіком TradingView
(() => {
    // Налаштування графіка
    const chartProperties = {
        width: 800,
        height: 400,
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
        },
        layout: {
            background: { color: '#131722' },
            textColor: '#D9D9D9',
        },
        grid: {
            vertLines: { color: '#1a1d2d' },
            horzLines: { color: '#1a1d2d' },
        },
    };

    // Створення графіка
    const chart = LightweightCharts.createChart(
        document.getElementById('chart'),
        chartProperties
    );

    // Налаштування серії свічок
    const candleSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350'
    });

    // Додавання маркерів угод
    const markers = [];
    let currentPrice = 0;

    // Завантаження даних
    async function loadChartData() {
        try {
            const response = await fetch('/demo/data/crypto_btc_usd.json');
            const data = await response.json();
            
            candleSeries.setData(data.candles);
            currentPrice = data.candles[data.candles.length - 1].close;
            
            // Запуск демо після завантаження
            document.getElementById('start-demo').disabled = false;
        } catch (e) {
            console.error('Failed to load chart data:', e);
        }
    }

    // Анімація угоди
    async function animateTrade(type = 'buy', profit = true) {
        const tradeEl = document.createElement('div');
        tradeEl.className = `trade ${type} ${profit ? 'profit' : 'loss'}`;
        
        const time = new Date();
        const price = currentPrice * (1 + (Math.random() * 0.02 - 0.01));
        
        // Додаємо маркер на графік
        markers.push({
            time: time.getTime() / 1000,
            position: type === 'buy' ? 'belowBar' : 'aboveBar',
            color: type === 'buy' ? '#26a69a' : '#ef5350',
            shape: 'circle',
            text: type.toUpperCase()
        });
        
        candleSeries.setMarkers(markers);
        
        // Оновлюємо список угод
        const trades = document.getElementById('trades');
        const result = profit ? 
            `+${(Math.random() * 5 + 2).toFixed(2)}%` : 
            `-${(Math.random() * 2 + 0.5).toFixed(2)}%`;
            
        tradeEl.innerHTML = `
            <div class="trade-header">
                <span class="trade-type">${type.toUpperCase()}</span>
                <span class="trade-time">${time.toLocaleTimeString()}</span>
            </div>
            <div class="trade-details">
                <span class="trade-price">$${price.toFixed(2)}</span>
                <span class="trade-result ${profit ? 'profit' : 'loss'}">${result}</span>
            </div>
        `;
        
        trades.appendChild(tradeEl);
        tradeEl.scrollIntoView({ behavior: 'smooth' });
        
        // Оновлюємо поточну ціну
        currentPrice = price;
    }

    // Запуск демо
    document.getElementById('start-demo').addEventListener('click', async () => {
        const button = document.getElementById('start-demo');
        button.disabled = true;
        button.textContent = 'Демо запущено...';
        
        // Очищаємо попередні угоди
        document.getElementById('trades').innerHTML = '';
        markers.length = 0;
        candleSeries.setMarkers([]);
        
        // Симуляція серії угод
        const trades = [
            { type: 'buy', profit: true },
            { type: 'sell', profit: true },
            { type: 'buy', profit: false }, // Одна збиткова
            { type: 'buy', profit: true },
            { type: 'sell', profit: true },
            { type: 'buy', profit: true }
        ];
        
        for (const trade of trades) {
            await new Promise(r => setTimeout(r, 2000)); // Пауза між угодами
            await animateTrade(trade.type, trade.profit);
        }
        
        // Після демо - показуємо діалог
        await new Promise(r => setTimeout(r, 1500));
        const ready = confirm('Демо завершено! Бажаєте отримати доступ до повної версії?');
        if (ready) {
            window.location.href = '/form.php';
        } else {
            button.disabled = false;
            button.textContent = 'Запустити ще раз';
        }
    });

    // Завантажуємо дані при старті
    loadChartData();
})();
