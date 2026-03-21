<?php
session_start();

$file = 'game_state.json';

// Inicializa o jogo se não existir
if (!file_exists($file)) {
    $initial_state = [
        "round" => 1,
        "liar_id" => rand(0, 6),
        "players" => [],
        "game_over" => false
    ];
    file_put_contents($file, json_encode($initial_state));
}

if (isset($_GET['action'])) {
    $data = json_decode(file_get_contents($file), true);

    if ($_GET['action'] == 'join') {
        $characters = ['Betty', 'Jughead', 'Veronica', 'Archie', 'Cheryl', 'Kevin', 'Toni'];
        $secrets = [
            "Você ajudou alguém a esconder provas.",
            "Você plantou uma pista falsa, e é o culpado.",
            "Você recebeu uma mensagem anônima com uma ameaça.",
            "Você precisa convencer alguém específico de algo.",
            "Você pode mentir sempre (sem penalidade).",
            "Você pode forçar alguém a responder uma pergunta.",
            "Você sabe quem é o cúmplice."
        ];
        
        shuffle($secrets);
        
        $count = count($data['players']);
        if ($count < 7) {
            $new_player = [
                "id" => $count,
                "name" => $characters[$count],
                "secret" => $secrets[$count],
                "is_culprit" => strpos($secrets[$count], 'culpado') !== false,
                "votes" => 0
            ];
            $data['players'][] = $new_player;
            file_put_contents($file, json_encode($data));
            echo json_encode($new_player);
        }
    }
    
    if ($_GET['action'] == 'get_state') {
        echo json_encode($data);
    }
}
?>