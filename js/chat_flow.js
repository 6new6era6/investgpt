// chat_flow.js — стрімінг, function calling, fail-safe

let toolsBuffer = '';
let failSafeActive = false;

async function talkToAI(messages, state) {
  try {
    const resp = await fetch('/api/openai.php', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ messages, state })
    });
    if (!resp.body) throw new Error('No response body');
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer.split('\n\n').forEach(chunk => {
        if (!chunk.startsWith('data:')) return;
        const data = JSON.parse(chunk.slice(5));
        if (data.error) {
          showFailSafeFlow();
          failSafeActive = true;
          return;
        }
        if (data.type === 'response.output_text.delta') {
          ui.appendChunk(data.delta); // стрім у чат
        }
        if (data.type === 'response.function_call_arguments.delta') {
          toolsBuffer += data.delta;
        }
        if (data.type === 'response.function_call_arguments.done') {
          const call = JSON.parse(toolsBuffer);
          handleToolCall(data.name, call);
          toolsBuffer = '';
        }
      });
    }
  } catch (e) {
    showFailSafeFlow();
    failSafeActive = true;
  }
}

function handleToolCall(name, args) {
  if (name === 'score_lead') {
    const result = scoreLead(args.answers, args.weights);
    ui.showAnalysis(result);
  }
  if (name === 'ask_clarifying') {
    ui.askClarifying(args.field, args.reason);
  }
  if (name === 'pick_asset_for_demo') {
    ui.showDemoAsset(args.asset_symbol, args.reason);
  }
  if (name === 'gate_to_form') {
    if (args.allow) ui.showForm(args.reason);
    else ui.askMore(args.reason);
  }
  if (name === 'persist_ctx') {
    sessionStorage.setItem('leadCtx', JSON.stringify(args.leadCtx));
  }
}

function showFailSafeFlow() {
  // Локальний чек-лист, якщо OpenAI недоступний
  ui.showMessage('AI недоступний. Вкажіть, будь ласка, ваші цілі, досвід, бюджет.');
  // ... можна розширити ...
}

// Приклад скорингу (локально)
function scoreLead(a, w) {
  const income = mapIncomeByLifestyle(a);
  const s = (
    w.income[income]     * 0.25 +
    w.liquidity[a.start_budget] * 0.25 +
    w.experience[a.experience]  * 0.15 +
    w.risk[a.risk]              * 0.15 +
    w.horizon[a.horizon]        * 0.10 +
    w.intent_postdemo           * 0.10
  );
  const tier = s >= 70 ? 'A' : s >= 45 ? 'B': 'C';
  const chance = tier=='A'?'70-95%':tier=='B'?'55-75%':'40-60%';
  const segment = pickSegment(a);
  return {score:Math.round(s), tier, chance, segment};
}

function mapIncomeByLifestyle(a) {
  // ...логіка мапінгу...
  return 'mid';
}
function pickSegment(a) {
  // ...логіка сегментації...
  return 'default';
}

// ui — обʼєкт для оновлення інтерфейсу (має бути реалізований)
const ui = {
  appendChunk: chunk => {/* ...додає chunk у чат... */},
  showAnalysis: result => {/* ...показує аналіз... */},
  askClarifying: (field, reason) => {/* ...питає уточнення... */},
  showDemoAsset: (asset, reason) => {/* ...показує демо... */},
  showForm: reason => {/* ...показує форму... */},
  askMore: reason => {/* ...ще питання... */},
  showMessage: msg => {/* ...показує повідомлення... */}
};

// Виклик: talkToAI(buildMessages(state), state).catch(showFailSafeFlow);