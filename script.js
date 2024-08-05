const grid = document.getElementById('checkbox-grid');
const totalConnectionsElement = document.getElementById('total-connections');
const activeUsersElement = document.getElementById('active-users');
const connectBtn = document.getElementById('connect-btn');
const usernameInput = document.getElementById('username-input');
const usernameDisplay = document.getElementById('username-display');
const timerElement = document.createElement('div'); // Timer display

let checkboxes = new Array(100000).fill(false);
let ws;
let countdownInterval;

const CHECKBOX_BATCH_SIZE = 500; // Number of checkboxes to load at a time
let loadedCheckboxes = 0; // Track how many checkboxes have been loaded

// Automatically connect to WebSocket to get initial stats and checkbox state
connectToWebSocket();

function connectToWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const wsUrl = `${protocol}://${host}/`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connection opened');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
            // Received checkbox state array
            checkboxes = data;
            renderCheckboxes();
        } else if (data.totalConnections !== undefined && data.activeUsers !== undefined) {
            // Received stats update
            totalConnectionsElement.textContent = data.totalConnections;
            activeUsersElement.textContent = data.activeUsers;
        } else if (data.index !== undefined && data.checked !== undefined) {
            // Received individual checkbox update
            checkboxes[data.index] = data.checked;
            updateCheckbox(data.index, data.checked);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed');
        connectBtn.style.display = 'inline-block';
        grid.style.display = 'none';
        timerElement.textContent = ''; // Clear the timer display
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

function startConnection() {
    grid.style.display = 'grid';
    connectBtn.style.display = 'none';
    usernameDisplay.appendChild(timerElement); // Add the timer to the username display
    startTimer();
}

function handleCheckboxChange(index) {
    const newCheckedState = !checkboxes[index];
    checkboxes[index] = newCheckedState;
    ws.send(JSON.stringify({ index, checked: newCheckedState }));
}

function renderCheckboxes() {
    const fragment = document.createDocumentFragment();
    for (let i = loadedCheckboxes; i < Math.min(checkboxes.length, loadedCheckboxes + CHECKBOX_BATCH_SIZE); i++) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `checkbox-${i}`;
        checkbox.className = 'checkbox';
        checkbox.checked = checkboxes[i];
        checkbox.onchange = () => handleCheckboxChange(i);
        fragment.appendChild(checkbox);
    }
    grid.appendChild(fragment);
    loadedCheckboxes += CHECKBOX_BATCH_SIZE;
}

function updateCheckbox(index, checked) {
    const checkbox = document.getElementById(`checkbox-${index}`);
    if (checkbox) {
        checkbox.checked = checked;
    }
}

function startTimer() {
    let timeLeft = 60;
    timerElement.textContent = `Time remaining: ${timeLeft}s`;
    countdownInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Time remaining: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            ws.close();
        }
    }, 1000);
}

// Lazy loading: load more checkboxes as the user scrolls
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        renderCheckboxes();
    }
});

usernameInput.addEventListener('input', () => {
    const username = usernameInput.value.trim();
    connectBtn.disabled = username === '';
    usernameDisplay.textContent = username ? `Welcome, ${username}` : '';
});

connectBtn.addEventListener('click', () => {
    startConnection();
});

// Initial rendering of checkboxes
renderCheckboxes();
