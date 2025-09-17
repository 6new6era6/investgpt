// failsafe_questions.js — локальний чек-лист для fail-safe

const failsafeQuestions = [
  { field: 'goal', text: 'Яка ваша головна фінансова ціль?' },
  { field: 'horizon', text: 'Який інвестиційний горизонт (термін)?' },
  { field: 'experience', text: 'Який у вас досвід інвестування?' },
  { field: 'risk', text: 'Який рівень ризику для вас прийнятний?' },
  { field: 'start_budget', text: 'Який стартовий бюджет ви розглядаєте?' }
];

function showFailsafeChecklist() {
  failsafeQuestions.forEach(q => ui.showMessage(q.text));
}

// Викликати showFailsafeChecklist() якщо OpenAI недоступний.