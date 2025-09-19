<?php
// api/openai.php — JSON proxy без стрімінгу (Keitaro friendly)

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

// 1) Ключ
$apiKey = getenv('OPENAI_API_KEY');
if (!$apiKey) {
    // опційно: підвантаження з файлів
    $phpKeyFile = __DIR__ . '/openai_key.php';
    if (file_exists($phpKeyFile)) {
        $val = include $phpKeyFile;
        if ($val && is_string($val)) $apiKey = trim($val);
    }
    $keyFile = __DIR__ . '/../.openai_key';
    if (!$apiKey && file_exists($keyFile)) {
        $apiKey = trim(file_get_contents($keyFile));
    }
}
if (!$apiKey) {
    http_response_code(200);
    echo json_encode(["error" => "NO_API_KEY", "message" => "OpenAI API key not configured"]);
    exit;
}

// 2) Вхід від фронта
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['messages']) || !is_array($input['messages'])) {
    http_response_code(400);
    echo json_encode(["error" => "INVALID_INPUT"]);
    exit;
}
$messages = $input['messages'];
$model    = $input['model'] ?? 'gpt-4o-mini';

// 3) Серверні сигнали (для скорингу/персоналізації)
$ip        = $_SERVER['REMOTE_ADDR'] ?? null;
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
$device    = (preg_match('/iphone|ipad|android|mobile/i', $userAgent ?? '')) ? 'mobile' : 'desktop';

// 4) Системний промпт і developer-повідомлення
$system = [
    "role" => "system",
    "content" => implode(" ", [
        "Ти — AI-аналітик інвест-профілю, який повністю керує воронкою.",
        "Будь ласка, ВІДПОВІДАЙ СТРОГО У JSON (без додаткового тексту) за схемою:",
        '{ "reply": "<текст укр>", "action": "ask|show_analysis|goto_demo|postdemo|goto_form",',
        '  "updates": { "answers": {...}, "readiness_score": <num>, "lead_tier": "A|B|C", "chance_range": "70–95%", "segment": "...", "currency": "UAH|PLN|USD|EUR|TRY" },',
        '  "demo": { "asset": "BTC/UAH" } }',
        "Де action описує наступний крок. Не давай фінансових гарантій; використовуй 'оцінний діапазон', 'симуляція', 'не гарантія'. Мова — українська."
    ])
];

$serverSignals = [
    "role" => "system",
    "content" => json_encode([
        "server_signals" => [
            "ip" => $ip,
            "user_agent" => $userAgent,
            "device" => $device
        ]
    ], JSON_UNESCAPED_UNICODE)
];

// 5) Виклик OpenAI Chat Completions (без stream)
$body = [
    "model" => $model,
    "messages" => array_merge([$system, $serverSignals], $messages),
    "temperature" => 0.6,
    "max_tokens" => 700
];

$ch = curl_init("https://api.openai.com/v1/chat/completions");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "Authorization: Bearer {$apiKey}"
    ],
    CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 35
]);

$response = curl_exec($ch);
$errno = curl_errno($ch);
$http  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($errno) {
    http_response_code(502);
    echo json_encode(["error" => "CURL_ERROR", "message" => $errno]);
    exit;
}
if ($http < 200 || $http >= 300) {
    http_response_code($http ?: 500);
    echo json_encode(["error" => "OPENAI_HTTP_$http", "raw" => json_decode($response, true)]);
    exit;
}

$data = json_decode($response, true);
$content = $data['choices'][0]['message']['content'] ?? "";

// 6) Очікуємо, що content — валідний JSON за протоколом
$parsed = json_decode($content, true);
if (is_array($parsed) && isset($parsed['reply'], $parsed['action'])) {
    echo json_encode($parsed, JSON_UNESCAPED_UNICODE);
} else {
    // Фолбек: загортаємо як ask
    echo json_encode([
        "reply" => trim($content) ?: "Дякую! Продовжимо. Розкажіть трохи детальніше.",
        "action" => "ask",
        "updates" => new stdClass(),
        "demo" => new stdClass()
    ], JSON_UNESCAPED_UNICODE);
}

