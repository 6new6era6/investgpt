<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');

// --- Конфіг ---
$OPENAI_API_KEY = getenv('OPENAI_API_KEY') ?: 'YOUR_OPENAI_KEY';
$OPENAI_URL = 'https://api.openai.com/v1/responses';
$MAX_RETRIES = 5;
$RETRY_DELAYS = [200, 400, 800, 1600, 3200]; // ms
$MAX_TOKENS = 1024;
$MAX_HISTORY_KB = 32;
$TIMEOUT = 30; // сек

// --- Вхід ---
$in = json_decode(file_get_contents('php://input'), true);
if (!$in) {
    http_response_code(400);
    echo "data: {\"error\":\"Invalid input\"}\n\n";
    exit;
}
$messages = $in['messages'] ?? [];
$state = $in['state'] ?? [];

// --- Додаємо системний промпт, developer, tools ---
$system = ["role"=>"system","content"=>"Ти — AI-аналітик інвест-профілю. Завдання: провести невимушене опитування, ..."];
$developer = ["role"=>"developer","content"=>json_encode($state)];
$tools = [
    ["type"=>"function","function"=>["name"=>"ask_clarifying","parameters"=>["field"=>"string","reason"=>"string"]]],
    ["type"=>"function","function"=>["name"=>"score_lead","parameters"=>["answers"=>"object","weights"=>"object"]]],
    ["type"=>"function","function"=>["name"=>"pick_asset_for_demo","parameters"=>["segment"=>"string","currency"=>"string"]]],
    ["type"=>"function","function"=>["name"=>"gate_to_form","parameters"=>["readiness_score"=>"number","ready_now"=>"boolean","start_amount"=>"number"]]],
    ["type"=>"function","function"=>["name"=>"persist_ctx","parameters"=>["leadCtx"=>"object"]]],
];

// --- Обрізаємо історію, якщо перевищено бюджет ---
function trimHistory($messages, $maxKb) {
    $total = 0; $out = [];
    foreach (array_reverse($messages) as $msg) {
        $len = strlen(json_encode($msg));
        if ($total + $len > $maxKb*1024) break;
        $out[] = $msg; $total += $len;
    }
    return array_reverse($out);
}
$messages = trimHistory($messages, $MAX_HISTORY_KB);

// --- Формуємо payload ---
$payload = [
    "model" => "gpt-3.5-turbo-mini", // можна перемикати
    "messages" => array_merge([$system, $developer], $messages),
    "tools" => $tools,
    "max_tokens" => $MAX_TOKENS,
    "stream" => true
];

// --- CURL запит з ретраями ---
$try = 0;
while ($try < $MAX_RETRIES) {
    $ch = curl_init($OPENAI_URL);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $OPENAI_API_KEY",
        "Content-Type: application/json"
    ]);
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $data) {
        // Проброс SSE chunk
        foreach (explode("\n", $data) as $line) {
            if (trim($line)) echo "data: $line\n\n";
            @ob_flush(); @flush();
        }
        return strlen($data);
    });
    curl_setopt($ch, CURLOPT_TIMEOUT, $TIMEOUT);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
    $ok = curl_exec($ch);
    $err = curl_errno($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($ok && !$err && $http < 400) break;
    // Ретраї
    usleep($RETRY_DELAYS[$try]*1000);
    $try++;
    if ($try >= $MAX_RETRIES) {
        echo "data: {\"error\":\"OpenAI unavailable\"}\n\n";
        exit;
    }
}

// --- Логування метаданих (без персональних даних) ---
// file_put_contents('/tmp/openai.log', json_encode([
//     'ts'=>time(),'ip'=>$_SERVER['REMOTE_ADDR'],'phase'=>$state['phase']??null
// ])."\n", FILE_APPEND);

?>
