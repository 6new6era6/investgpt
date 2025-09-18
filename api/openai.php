<?php
// Debug helpers
function debug_log($msg, $data = null) {
    log_to_console('debug', $msg, $data);
}

function error_log_to_console($msg, $data = null) {
    log_to_console('error', $msg, $data);
}

function log_to_console($type, $msg, $data = null) {
    $time = gmdate('c'); // ISO 8601 format, matches JavaScript's toISOString()
    $log = [
        'time' => $time,
        'label' => $msg,
        'data' => $data
    ];
    error_log('[PHP] ' . json_encode($log));
    // Send to client for console output
    echo "data: " . json_encode(['console' => [
        'type' => $type,
        'time' => $time,
        'label' => '[PHP] ' . $msg,
        'data' => $data
    ]]) . "\n\n";
    if (ob_get_level()) ob_flush();
    flush();
}

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
debug_log('SSE connection started');

// Конфігурація
$OPENAI_API_KEY = getenv('OPENAI_API_KEY');
// Fallback: try reading from a local file (placed outside webroot or protected), e.g. ../.openai_key
if (!$OPENAI_API_KEY) {
    // Try a PHP file inside api/ that returns the key: api/openai_key.php
    $phpKeyFile = __DIR__ . '/openai_key.php';
    if (file_exists($phpKeyFile)) {
        $val = include $phpKeyFile;
        if ($val && is_string($val)) {
            $OPENAI_API_KEY = trim($val);
        }
    }
    $keyFile = __DIR__ . '/../.openai_key';
    if (file_exists($keyFile)) {
        $OPENAI_API_KEY = trim(file_get_contents($keyFile));
    }
}
if (!$OPENAI_API_KEY) {
    error_log_to_console('Configuration Error', 'OpenAI API key not configured');
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
debug_log('Initializing cURL request', ['url' => $OPENAI_URL]);
$ch = curl_init($OPENAI_URL);

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $OPENAI_API_KEY
]);

$requestData = [
    'model' => $MODEL,
    'messages' => $input['messages'],
    'temperature' => $TEMPERATURE,
    'max_tokens' => $MAX_TOKENS,
    'stream' => true
];
debug_log('Request payload prepared', ['messageCount' => count($input['messages'])]);

curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));

// Stream the response back to client as SSE
debug_log('Setting up response streaming');

// Буфер для накопичення даних між викликами
$streamBuffer = '';

curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $data) use (&$streamBuffer) {
    static $chunkCount = 0;
    $chunkCount++;
    
    // Додаємо нові дані до буфера
    $streamBuffer .= $data;
    
    // Шукаємо завершені події SSE (data: ... + порожній рядок)
    while (preg_match('/^data: (.+?)\n\n/s', $streamBuffer, $matches)) {
        $event = $matches[0];
        $payload = trim($matches[1]);
        
        // Видаляємо оброблену подію з буфера
        $streamBuffer = substr($streamBuffer, strlen($event));
        
        // Обробка події
        if ($payload === '[DONE]') {
            echo "data: [DONE]\n\n";
        } else if (strpos($payload, '"console"') !== false) {
            // Наш лог
            echo "data: __DEBUG__" . $payload . "\n\n";
        } else if (strpos($payload, '"choices"') !== false) {
            // OpenAI chunk
            echo "data: " . $payload . "\n\n";
        } else {
            // Інші дані (на всяк випадок)
            error_log("[Debug] Unknown payload type: " . substr($payload, 0, 100));
            echo "data: " . $payload . "\n\n";
        }
        
        // Відправляємо відразу
        if (ob_get_level()) ob_flush();
        flush();
    }
    
    error_log(sprintf(
        '[PHP Debug] Chunk #%d (in: %d bytes, buffer: %d bytes)', 
        $chunkCount, 
        strlen($data),
        strlen($streamBuffer)
    ));
    
    return strlen($data);
    
    return strlen($data);
});

debug_log('Starting cURL execution');
$res = curl_exec($ch);

if (curl_errno($ch)) {
    $error = curl_error($ch);
    debug_log('cURL error occurred', ['error' => $error]);
    echo "data: " . json_encode(['error' => 'OpenAI API error: ' . $error]) . "\n\n";
    flush();
    exit;
}

// Make sure any trailing data is flushed
if ($res !== false) {
    debug_log('Request completed successfully');
    if (ob_get_level()) ob_flush();
    flush();
} else {
    debug_log('Request failed', ['curlInfo' => curl_getinfo($ch)]);
}
