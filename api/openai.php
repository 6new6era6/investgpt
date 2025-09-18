<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');

// Конфігурація
$OPENAI_API_KEY = getenv('OPENAI_API_KEY');
// Fallback: try reading from a local file (placed outside webroot or protected), e.g. ../.openai_key
if (!$OPENAI_API_KEY) {
    $keyFile = __DIR__ . '/../.openai_key';
    if (file_exists($keyFile)) {
        $OPENAI_API_KEY = trim(file_get_contents($keyFile));
    }
}
if (!$OPENAI_API_KEY) {
    echo "data: " . json_encode(['error' => 'OpenAI API key not configured. Set OPENAI_API_KEY env or place key in .openai_key']) . "\n\n";
    exit;
}

$OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
$MODEL = 'gpt-3.5-turbo';
$MAX_TOKENS = 150;
$TEMPERATURE = 0.7;

// Читаємо вхідні дані
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['messages'])) {
    echo "data: " . json_encode(['error' => 'Invalid input']) . "\n\n";
    exit;
}

// Системний промпт
array_unshift($input['messages'], [
    'role' => 'system',
    'content' => "Ви — AI-консультант з інвестицій. Ваша роль:\n" .
                "1. Зібрати інформацію про інвестиційні цілі, досвід, бюджет.\n" .
                "2. Задавати уточнюючі питання при розмитих відповідях.\n" .
                "3. Після збору даних, додати тег [TO_ANALYSIS] для переходу до аналізу.\n" .
                "Говоріть професійно, але дружньо. Уникайте довгих монологів."
]);

// Налаштування CURL
$ch = curl_init($OPENAI_URL);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $OPENAI_API_KEY
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'model' => $MODEL,
        'messages' => $input['messages'],
        'temperature' => $TEMPERATURE,
        'max_tokens' => $MAX_TOKENS,
        'stream' => true
    ])
]);

// Стрімінг відповіді
$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo "data: " . json_encode(['error' => 'OpenAI API error: ' . curl_error($ch)]) . "\n\n";
    exit;
}

echo $response;
flush();
