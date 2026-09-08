
const electron=require("electron")
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const { URL } = require('url');
const { Terminal } = require('./src/classes/terminal.class.js');
settings={
    "shell": "powershell.exe",
    "shellArgs": "",
    "cwd": "D:\\edex-ui-master\\edex-ui\\src",
    "keyboard": "en-US",
    "theme": "tron",
    "termFontSize": 15,
    "audio": true,
    "audioVolume": 1,
    "disableFeedbackAudio": false,
    "clockHours": 24,
    "pingAddr": "1.1.1.1",
    "port": 3000,
    "nointro": false,
    "nocursor": false,
    "forceFullscreen": true,
    "allowWindowed": false,
    "excludeThreadsFromToplist": true,
    "hideDotfiles": false,
    "fsListView": false,
    "experimentalGlobeFeatures": false,
    "experimentalFeatures": false
}
let cleanEnv =  require("../edex-ui/shellenv").shellEnvSync(settings.shell)
const AUTH_TOKEN = process.env.TERMINAL_WS_TOKEN || crypto.randomBytes(32).toString('hex');
opts={
    role: "server",
    shell: settings.shell,
    params: settings.shellArgs || '',
    cwd: settings.cwd,
    env: cleanEnv,
    port: settings.port || 3000,
    authToken: AUTH_TOKEN
}
let mainWindow;
let expressApp;
let wsServer;
let terminalServer;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'public/index.html'));
    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
        expressApp && expressApp.close();
        wsServer && wsServer.close();
    });
}

console.log(BrowserWindow)
// Créer la fenêtre lorsque l'application est prête
app.whenReady().then(() => {
    createWindow();

    // Créer un serveur Express
    expressApp = express();
    const port = 3000;

    // Servir les fichiers statiques depuis le dossier public
    expressApp.use(express.static(path.join(__dirname, 'public')));

    // Lancer le serveur Express
    const server = expressApp.listen(port, () => {
        console.log(`Serveur Express en cours d'exécution sur http://localhost:${port}`);
        console.log(`Terminal WebSocket token: ${AUTH_TOKEN}`);
    });

    // Créer un serveur WebSocket
    wsServer = new WebSocket.Server({ noServer: true });

    // Attacher le serveur WebSocket au serveur HTTP
    server.on('upgrade', (request, socket, head) => {
        const reqUrl = new URL(request.url, `http://${request.headers.host}`);
        const token = reqUrl.searchParams.get('token');
        if (token !== AUTH_TOKEN) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }
        wsServer.handleUpgrade(request, socket, head, (ws) => {
            wsServer.emit('connection', ws, request);
        });
    });

    // Créer une instance de la classe Terminal côté serveur
    terminalServer = new Terminal(opts);

    function sanitizeTerminalInput(input) {
        const text = Buffer.isBuffer(input) ? input.toString('utf8') : String(input);
        if (text.length === 0 || text.length > 4096) return null;
        const allowed = /^[\x09\x0A\x0D\x1B\x08\x20-\x7E]*$/;
        if (!allowed.test(text)) return null;
        return text;
    }

    // Gérer les événements IPC depuis la fenêtre de rendu
    ipcMain.on('express-port-request', (event) => {
        // Envoyer le numéro de port Express au client côté rendu
        event.sender.send('express-port-response', port);
    });

    // Gérer les connexions WebSocket du terminal
    wsServer.on('connection', (ws) => {
        ws.on('message', (message) => {
            const safeMessage = sanitizeTerminalInput(message);
            if (safeMessage === null) {
                return;
            }
            // Rediriger les messages du terminal depuis le front-end vers le back-end
            terminalServer.write(safeMessage);
        });

        // Envoyer les données du terminal depuis le back-end vers le front-end
        terminalServer.onData((data) => {
            ws.send(data);
        });
    });
});

// Quitter l'application lorsque toutes les fenêtres sont fermées (sauf sur macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Créer une nouvelle fenêtre lorsque l'icône de l'application est cliquée (uniquement sur macOS)
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
app.on('error', (error) => {
    console.log(error)
});