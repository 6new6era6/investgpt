// Простий скелет demo_sim.js
(function(){
  const start = document.getElementById('start-demo');
  const tradesEl = document.getElementById('trades');
  start && start.addEventListener('click', ()=>{
    start.textContent = 'Running...';
    fetch('/demo/data/crypto_btc_usd.json').then(r=>r.json()).then(data=>{
      // Рендрим простим списком угод (6 з переважно плюсовими)
      const trades = [
        {id:1, result:'+3%'} ,{id:2, result:'+5%'},{id:3, result:'-2%'},{id:4, result:'+4%'},{id:5, result:'+6%'},{id:6, result:'-1%'}
      ];
      tradesEl.innerHTML = trades.map(t=>`<div class="trade">Trade ${t.id}: ${t.result}</div>`).join('');
      // Після демо — прості питання
      setTimeout(()=>{
        const ans = confirm('Після демо: чи готові ви залишити контакт для обробки?');
        if(ans) location.href='/index.php'; else alert('Дякуємо — можна повторити демо або вийти.');
      },500);
    });
  });
})();