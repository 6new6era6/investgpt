// handoff.js — читає sessionStorage.leadCtx і додає hidden-поля у форму
(function(){
  if(!document.querySelector) return;
  const form = document.querySelector('form');
  if(!form) return;
  try{
    const ctx = sessionStorage.leadCtx? JSON.parse(sessionStorage.leadCtx): null;
    if(!ctx) return;
    const addHidden = (name, value)=>{
      const inp = document.createElement('input'); inp.type='hidden'; inp.name=name; inp.value = typeof value==='object'? JSON.stringify(value): String(value||''); form.appendChild(inp);
    };
    addHidden('lead_ctx', ctx);
    addHidden('lead_answers', ctx.answers||[]);
    // приклади
    addHidden('readiness_score', ctx.readiness_score||'');
    addHidden('lead_tier', ctx.lead_tier||'');
  }catch(e){console.warn('handoff error', e);} 
})();