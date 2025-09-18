// Простий рендер аналіз-картки
(function(){
  const el = document.getElementById('analysis-card');
  if(!el) return;
  const ctx = sessionStorage.leadCtx? JSON.parse(sessionStorage.leadCtx): {answers:[]};
  const score = window.scoreLead? window.scoreLead(ctx.answers): {readiness_score:0, lead_tier:'C', chance_range:'40-60%'};
  el.innerHTML = `<div class="card"><h2>Результат</h2><p>Readiness: ${score.readiness_score}</p><p>Tier: ${score.lead_tier}</p><p>Chance: ${score.chance_range}</p></div>`;
  document.getElementById('to-demo').addEventListener('click', ()=>{ location.href='/demo/index.html'; });
})();