<?php
// tools.php — декларації function calling для OpenAI Responses API

return [
    ["type"=>"function","function"=>["name"=>"ask_clarifying","parameters"=>["field"=>"string","reason"=>"string"]]],
    ["type"=>"function","function"=>["name"=>"score_lead","parameters"=>["answers"=>"object","weights"=>"object"]]],
    ["type"=>"function","function"=>["name"=>"pick_asset_for_demo","parameters"=>["segment"=>"string","currency"=>"string"]]],
    ["type"=>"function","function"=>["name"=>"gate_to_form","parameters"=>["readiness_score"=>"number","ready_now"=>"boolean","start_amount"=>"number"]]],
    ["type"=>"function","function"=>["name"=>"persist_ctx","parameters"=>["leadCtx"=>"object"]]],
];
