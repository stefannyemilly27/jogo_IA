let myProfile = null;
let gameState = null;
let lastChatCount = 0;

async function joinGame() {
    console.log("Tentando entrar no jogo...");
    try {
        const response = await fetch('api.php?action=join');
        myProfile = await response.json();

        if (myProfile.error) {
            alert("O jogo já está cheio!");
            return;
        }

        console.log("Entrou como: " + myProfile.name);
        
        // MOSTRA A TELA
        document.getElementById('setup-container').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';

        // Loop de atualização
        setInterval(updateGameState, 2000);
    } catch (error) {
        console.error("ERRO CRÍTICO:", error);
        alert("Erro ao conectar com api.php. Verifique se o XAMPP está ligado.");
    }
}

async function updateGameState() {
    const response = await fetch('api.php?action=get_state');
    gameState = await response.json();
    
    // 1. Atualiza Rodada
    document.getElementById('round-display').innerText = `Rodada ${gameState.round}/7`;
    
    // 2. Atualiza Personagens
    renderPlayers();
    
    // 3. Atualiza Chat
    renderChat();

    // 4. Aviso de mentira
    const alertBox = document.getElementById('liar-alert');
    if (gameState.liar_id === myProfile.id) {
        alertBox.innerText = "⚠️ VOCÊ PODE MENTIR!";
        alertBox.style.color = "yellow";
    } else {
        alertBox.innerText = "FALE A VERDADE.";
        alertBox.style.color = "white";
    }

    // 5. Verifica Final do Jogo
    if (gameState.round > 7) {
        showFinalVoting();
    }
}

function renderPlayers() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    
    // Caminhos das fotos - Verifique se a pasta img existe!
    const images = {
        'Archie': 'img/archie.jpg', 'Betty': 'img/betty.jpg',
        'Veronica': 'img/veronica.jpg', 'Jughead': 'img/jughead.jpg',
        'Cheryl': 'img/cheryl.jpg', 'Kevin': 'img/kevin.jpg', 'Toni': 'img/toni.jpg'
    };

    gameState.players.forEach(p => {
        const isMe = p.id === myProfile.id;
        list.innerHTML += `
            <div class="card-player ${isMe ? 'active' : ''}">
                <img src="${images[p.name]}" class="char-img" onerror="this.src='https://via.placeholder.com/80?text=${p.name[0]}'">
                <div style="font-weight:bold; margin-top:5px;">${p.name}</div>
                ${isMe ? `<div class="secret-box"><b>SEGREDO:</b><br>${p.secret}</div>` : ''}
            </div>
        `;
    });
}

function renderChat() {
    const chatBox = document.getElementById('chat-messages');
    
    // Mensagens novas
    if (gameState.chat.length > lastChatCount) {
        for (let i = lastChatCount; i < gameState.chat.length; i++) {
            const msg = gameState.chat[i];
            chatBox.innerHTML += `<div><strong>${msg.user}:</strong> ${msg.text}</div>`;
        }
        lastChatCount = gameState.chat.length;
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Lógica de quem falta falar
    const talked = gameState.talked_this_round || [];
    const missing = gameState.players
        .filter(p => !talked.includes(p.name))
        .map(p => p.name);
    
    const waitingSpan = document.getElementById('waiting-on');
    const nextBtn = document.getElementById('next-round-btn');

    if (missing.length === 0 && gameState.players.length >= 2) {
        waitingSpan.innerText = "Todos falaram!";
        nextBtn.style.display = 'inline-block';
    } else {
        waitingSpan.innerText = missing.length > 0 ? missing.join(', ') : "Aguardando jogadores...";
        nextBtn.style.display = 'none';
    }
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input.value.trim()) return;
    
    console.log("Enviando mensagem...");
    await fetch(`api.php?action=send_chat&user=${myProfile.name}&text=${encodeURIComponent(input.value)}`);
    input.value = "";
}

async function nextRound() {
    await fetch('api.php?action=next_round');
}

async function resetGame() {
    if(confirm("Deseja resetar o servidor? Todos serão desconectados.")) {
        await fetch('api.php?action=reset');
        location.reload();
    }
}

function showFinalVoting() {
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('final-screen').style.display = 'block';
    const btnZone = document.getElementById('vote-buttons');
    if (btnZone.innerHTML !== "") return;

    ['Archie', 'Betty', 'Veronica', 'Jughead', 'Cheryl', 'Kevin', 'Toni'].forEach(name => {
        btnZone.innerHTML += `<button class="btn-riverdale" onclick="castVote('${name}')">${name}</button>`;
    });
}

async function castVote(name) {
    const culprit = gameState.players.find(p => p.is_culprit);
    const win = (name === culprit.name);
    
    document.getElementById('vote-section').style.display = 'none';
    document.getElementById('results-area').style.display = 'block';
    const ann = document.getElementById('winner-announcement');
    ann.innerText = win ? "OS INOCENTES VENCERAM! 🔎" : "O CULPADO ESCAPOU! 🔪";
    ann.style.color = win ? "#00ff00" : "#ff0000";
    
    document.getElementById('winners-circle').innerHTML = `
        <h2 style="color:yellow">O ASSASSINO ERA: ${culprit.name}</h2>
        <p>Ele estava escondendo: ${culprit.secret}</p>
    `;
}