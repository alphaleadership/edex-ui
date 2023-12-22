
const electron=require("electron")
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const WebSocket = require('ws');
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
opts={
    role: "server",
    shell: settings.shell,
    params: settings.shellArgs || '',
    cwd: settings.cwd,
    env: cleanEnv,
    port: settings.port || 3000
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
    });

    // Créer un serveur WebSocket
    wsServer = new WebSocket.Server({ noServer: true });

    // Attacher le serveur WebSocket au serveur HTTP
    server.on('upgrade', (request, socket, head) => {
        wsServer.handleUpgrade(request, socket, head, (ws) => {
            wsServer.emit('connection', ws, request);
        });
    });

    // Créer une instance de la classe Terminal côté serveur
    terminalServer = new Terminal(opts);

    // Gérer les événements IPC depuis la fenêtre de rendu
    ipcMain.on('express-port-request', (event) => {
        // Envoyer le numéro de port Express au client côté rendu
        event.sender.send('express-port-response', port);
    });

    // Gérer les connexions WebSocket du terminal
    wsServer.on('connection', (ws) => {
        ws.on('message', (message) => {
            // Rediriger les messages du terminal depuis le front-end vers le back-end
            terminalServer.write(message);
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