<?php
// Simple debug helpers (log to server error log)
function debug_log($msg, $data = null) {
    $time = gmdate('c');
    error_log(sprintf('[%s] DEBUG: %s %s', $time, $msg, json_encode($data)));
}

function error_log_to_console($msg, $data = null) {
    $time = gmdate('c');
    error_log(sprintf('[%s] ERROR: %s %s', $time, $msg, json_encode($data)));
}

// Return JSON responses from this script
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Configuration
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
    // Provide a helpful JSON response so clients can switch to demo mode
    echo json_encode(['error' => 'OpenAI API key not configured. Running in demo mode.', 'demo' => true]);
    exit;
}

$OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
$MODEL = 'gpt-3.5-turbo';
$MAX_TOKENS = 600;
$TEMPERATURE = 0.7;

// Read input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['messages']) || !is_array($input['messages'])) {
    echo json_encode(['error' => 'Invalid input: expected { messages: [...] }']);
    exit;
}

// Insert system prompt to guide strict JSON replies where possible
array_unshift($input['messages'], [
    'role' => 'system',
    'content' => "You are an investment advisor assistant. Reply in JSON when appropriate.\n" .
                 "If you need more information ask follow-up questions.\n" .
                 "When ready to move to analysis, include an action field 'action':'analysis' or include the token [TO_ANALYSIS].\n" .
                 "If you cannot produce structured JSON, reply with plain text and the client will wrap it."
]);

debug_log('Preparing OpenAI request', ['messages' => count($input['messages'])]);

$ch = curl_init($OPENAI_URL);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $OPENAI_API_KEY
]);

$requestData = [
    'model' => $MODEL,
    'messages' => $input['messages'],
    'temperature' => $TEMPERATURE,
    'max_tokens' => $MAX_TOKENS,
    'stream' => false
];

curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));

$resp = curl_exec($ch);
if (curl_errno($ch)) {
    $err = curl_error($ch);
    error_log('cURL error: ' . $err);
    echo json_encode(['error' => 'OpenAI API error: ' . $err]);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode < 200 || $httpCode >= 300) {
    error_log('OpenAI returned HTTP ' . $httpCode . ' body: ' . substr($resp, 0, 2000));
    echo json_encode(['error' => 'OpenAI API returned HTTP ' . $httpCode]);
    exit;
}

$json = json_decode($resp, true);
if (!$json) {
    error_log('Failed to decode OpenAI response: ' . json_last_error_msg());
    echo json_encode(['error' => 'Invalid response from OpenAI']);
    exit;
}

// Extract assistant text
$assistant_text = '';
if (isset($json['choices'][0]['message']['content'])) {
    $assistant_text = $json['choices'][0]['message']['content'];
} elseif (isset($json['choices'][0]['text'])) {
    $assistant_text = $json['choices'][0]['text'];
}

// Attempt to parse assistant_text as JSON. If it's valid JSON, return it directly.
$decoded = json_decode($assistant_text, true);
if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
    echo json_encode($decoded);
    exit;
}

// Not JSON — return a safe wrapper
echo json_encode([
    'reply' => $assistant_text,
    'action' => (strpos($assistant_text, '[TO_ANALYSIS]') !== false) ? 'analysis' : 'ask'
]);

