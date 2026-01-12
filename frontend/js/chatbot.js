// Kuro Chatbot State
let kuroSessionId = null;

function toggleKuroChat() {
    console.log('Toggling Kuro Chat...'); // Debug log
    const chatWindow = document.getElementById('kuro-chat-window');
    
    if (!chatWindow) {
        console.error('Chat window element not found!');
        return;
    }

    chatWindow.classList.toggle('active');
    chatWindow.classList.remove('minimized');

    if (chatWindow.classList.contains('active')) {
        const input = document.getElementById('kuro-chat-input');
        if (input) input.focus();
    }
}

function closeKuroChat() {
    console.log('Closing Kuro Chat');
    const chatWindow = document.getElementById('kuro-chat-window');
    if (chatWindow) chatWindow.classList.remove('active');
}

function minimizeKuroChat() {
    document.getElementById('kuro-chat-window').classList.toggle('minimized');
}

function handleChatKeyPress(e) {
    if (e.key === 'Enter') {
        sendKuroMessage();
    }
}

async function sendKuroMessage() {
    const input = document.getElementById('kuro-chat-input');
    const message = input.value.trim();

    if (!message) return;

    addChatMessage(message, 'user');
    input.value = '';

    document.getElementById('kuro-typing').classList.add('active');
    document.getElementById('kuro-send-btn').disabled = true;

    try {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/chat/message`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ message, sessionId: kuroSessionId })
        });

        const data = await response.json();

        if (data.success) {
            kuroSessionId = data.data.sessionId;

            setTimeout(() => {
                document.getElementById('kuro-typing').classList.remove('active');
                addChatMessage(data.data.response, 'bot');
                updateQuickReplies(data.data.quickReplies);
                document.getElementById('kuro-send-btn').disabled = false;
            }, 500);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        document.getElementById('kuro-typing').classList.remove('active');
        addChatMessage('Sorry, I encountered an error. Please try again.', 'bot');
        document.getElementById('kuro-send-btn').disabled = false;
    }
}

function addChatMessage(text, sender) {
    const messagesContainer = document.getElementById('kuro-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.style.display = 'flex';
    messageDiv.style.justifyContent = sender === 'user' ? 'flex-end' : 'flex-start';

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender}`;
    bubble.textContent = text;

    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateQuickReplies(replies) {
    const container = document.getElementById('kuro-quick-replies');
    if (!container) return;

    if (!replies || replies.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = replies.map(reply => {
        const safeReply = reply.replace(/'/g, "\\'");
        return `<button class="quick-reply-btn" onclick="sendQuickReply('${safeReply}')">${reply}</button>`;
    }).join('');
}

function sendQuickReply(message) {
    document.getElementById('kuro-chat-input').value = message;
    sendKuroMessage();
}
