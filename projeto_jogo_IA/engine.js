let myProfile = null;
let gameState = null;

async function joinGame() {
    const response = await fetch('api.php?action=join');
    myProfile = await response.json();
    
    document.getElementById('game-setup').style.display = 'none';
    document.getElementById('game-board').style.display = 'block';
    
    updateLoop();
}

async function updateLoop() {
    const response = await fetch('api.php?action=get_state');
    gameState = await response.json();
    
    renderPlayers();
    
    if (gameState.round > 7) {
        showVoting();
    }
    
    // Simula o liar hint para o jogador atual
    if (gameState.liar_id === myProfile.id) {
        document.getElementById('liar-hint').innerText = "VOCÊ PODE MENTIR NESTA RODADA!";
    } else {
        document.getElementById('liar-hint').innerText = "FALE A VERDADE.";
    }

    setTimeout(updateLoop, 3000);
}

function renderPlayers() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    
    gameState.players.forEach(p => {
        const isMe = p.id === myProfile.id;
        list.innerHTML += `
            <div class="card-player">
                <img src="https://via.placeholder.com/150/000000/ff0000?text=${p.name}" class="character-img">
                <h3>${p.name} ${isMe ? '(VOCÊ)' : ''}</h3>
                ${isMe ? `<div class="secret-box">SEGREDO: ${p.secret}</div>` : '<div class="secret-box">SEGREDO OCULTO</div>'}
            </div>
        `;
    });
}

function showVoting() {
    document.getElementById('vote-section').style.display = 'block';
    const container = document.getElementById('vote-buttons');
    container.innerHTML = '';
    
    gameState.players.forEach(p => {
        if(p.id !== myProfile.id) {
            container.innerHTML += `<button class="btn-riverdale" style="margin:5px" onclick="castVote(${p.id})">${p.name}</button>`;
        }
    });
}

function castVote(targetId) {
    // Aqui enviaria o voto para o PHP. 
    // Para simplificar a demo, vamos processar o resultado localmente:
    const culprit = gameState.players.find(p => p.is_culprit);
    const correct = (targetId === culprit.id);
    
    showResult(correct, culprit);
}

function showResult(win, culprit) {
    document.getElementById('game-board').style.display = 'none';
    const screen = document.getElementById('final-screen');
    screen.style.display = 'block';
    
    const winnersCircle = document.getElementById('winners-circle');
    
    if (win) {
        document.getElementById('winner-announcement').innerText = "OS INOCENTES VENCERAM!";
        // Mostra inocentes com coroa
        gameState.players.filter(p => !p.is_culprit).forEach(p => {
            winnersCircle.innerHTML += `
                <div class="card-player">
                    <img src="https://img.icons8.com/emoji/96/000000/crown-emoji.png" class="crown">
                    <img src="https://via.placeholder.com/150" class="character-img">
                    <p>${p.name}</p>
                </div>`;
        });
    } else {
        document.getElementById('winner-announcement').innerText = "O CULPADO VENCEU!";
        winnersCircle.innerHTML = `
            <div class="card-player">
                <img src="https://img.icons8.com/emoji/96/000000/crown-emoji.png" class="crown">
                <img src="https://via.placeholder.com/150" class="character-img">
                <p>${culprit.name}</p>
            </div>`;
    }

    // Revela quem guardou o segredo
    const reveal = document.getElementById('secret-reveal');
    reveal.innerHTML = "<h3>MISSÕES DE SEGREDO:</h3>";
    gameState.players.forEach(p => {
        reveal.innerHTML += `<p>${p.name}: Guardou o segredo? <b>SIM</b> - Segredo: ${p.secret}</p>`;
    });
}