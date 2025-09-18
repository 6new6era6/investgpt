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

// Функція для пошуку повного JSON об'єкта в тексті
function findCompleteJson($text, &$start, &$end) {
    $len = strlen($text);
    $inString = false;
    $escape = false;
    $objectDepth = 0;
    $arrayDepth = 0;
    $start = -1;
    
    for ($i = 0; $i < $len; $i++) {
        $char = $text[$i];
        
        // Пропускаємо пробільні символи до початку об'єкта/масиву
        if ($start === -1 && preg_match('/\s/', $char)) {
            continue;
        }
        
        if ($escape) {
            $escape = false;
            continue;
        }
        
        if ($char === '\\' && !$escape) {
            $escape = true;
            continue;
        }
        
        if ($char === '"' && !$escape) {
            $inString = !$inString;
            continue;
        }
        
        if (!$inString) {
            switch ($char) {
                case '{':
                    if ($objectDepth === 0 && $arrayDepth === 0) {
                        $start = $i;
                    }
                    $objectDepth++;
                    break;
                    
                case '}':
                    $objectDepth--;
                    if ($objectDepth === 0 && $arrayDepth === 0 && $start !== -1) {
                        // Знайшли кінець об'єкта
                        $end = $i + 1;
                        // Перевіряємо що це валідний JSON
                        $json = substr($text, $start, $end - $start);
                        if (json_decode($json) !== null) {
                            return true;
                        }
                        // Якщо не валідний - продовжуємо пошук
                        $start = -1;
                    }
                    break;
                    
                case '[':
                    if ($objectDepth === 0 && $arrayDepth === 0) {
                        $start = $i;
                    }
                    $arrayDepth++;
                    break;
                    
                case ']':
                    $arrayDepth--;
                    if ($arrayDepth === 0 && $objectDepth === 0 && $start !== -1) {
                        // Знайшли кінець масиву
                        $end = $i + 1;
                        // Перевіряємо що це валідний JSON
                        $json = substr($text, $start, $end - $start);
                        if (json_decode($json) !== null) {
                            return true;
                        }
                        // Якщо не валідний - продовжуємо пошук
                        $start = -1;
                    }
                    break;
            }
        }
    }
    return false;
}

curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $data) use (&$streamBuffer) {
    static $chunkCount = 0;
    $chunkCount++;
    
    // Додаємо нові дані до буфера
    $streamBuffer .= $data;
    
    // Розділяємо буфер на рядки
    $lines = explode("\n", $streamBuffer);
    $newBuffer = '';
    $processedAny = false;
    
    // Обробляємо кожен рядок
    foreach ($lines as $i => $line) {
        $line = trim($line);
        if (empty($line)) continue;
        
        // Якщо це не останній рядок або він закінчується на \n
        $isComplete = ($i < count($lines) - 1) || (substr($streamBuffer, -1) === "\n");
        
        if (strpos($line, 'data: ') === 0) {
            $payload = substr($line, 6);
            
            if ($payload === '[DONE]') {
                echo "data: [DONE]\n\n";
                $processedAny = true;
                continue;
            }
            
            // Якщо рядок не закінчений, зберігаємо його
            if (!$isComplete) {
                $newBuffer = $line;
                break;
            }
            
            // Перевіряємо чи це повний JSON
            $start = $end = 0;
            if (findCompleteJson($payload, $start, $end)) {
                $json = substr($payload, $start, $end - $start);
                
                // Перевіряємо тип даних
                if (strpos($json, '"console"') !== false) {
                    echo "data: __DEBUG__" . $json . "\n\n";
                } else {
                    echo "data: " . $json . "\n\n";
                }
                $processedAny = true;
            } else {
                $newBuffer .= $line . "\n";
            }
        } else {
            $newBuffer .= $line . "\n";
        }
    }
    
    // Оновлюємо буфер
    $streamBuffer = $newBuffer;
    
    // Відправляємо дані якщо щось обробили
    if ($processedAny && ob_get_level()) {
        ob_flush();
        flush();
    }
    
    // Очищаємо старі дані з буфера (залишаємо тільки останні 1000 байт)
    if (strlen($streamBuffer) > 1000) {
        $streamBuffer = substr($streamBuffer, -1000);
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
