
//const pty=require("node-pty")
//const xterm=require("xterm")
/*
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
}/*
console.log(pty.spawn(opts.shell || "bash", (opts.params.length > 0 ? opts.params : (process.platform === "win32" ? [] : ["--login"])), {
    name: opts.env.TERM || "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: opts.cwd || process.env.PWD,
    env: opts.env || process.env
}))
console.log(new xterm.Terminal({
                cols: 80,
                rows: 24,
                cursorBlink:  true,
                cursorStyle: "block",
                allowTransparency: false,
                fontFamily:  "Fira Mono",
                fontSize:  15,
                fontWeight:  "normal",
                fontWeightBold: "bold",
                letterSpacing: 0,
                lineHeight: 1,
                scrollback: 1500,
                bellStyle: "none",
             
            }))*/
            // Importez les modules nécessaires// Importez les modules nécessaires
   
const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const pty = require('node-pty');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env,
});

wss.on('connection', (ws) => {
    // Gérez les données entrantes du client et écrivez-les dans le processus pty
    ws.on('message', (data) => {
        console.log(data)
        ptyProcess.write(data);
        ptyProcess.resume
    });

    // Gérez les données entrantes du processus pty et envoyez-les au client
    ptyProcess.on('data', (data) => {
        console.log(data)
        ws.send(data);
    });

    // Gérez la fermeture de la connexion WebSocket
    ws.on('close', () => {
        ptyProcess.kill(); // Assurez-vous de tuer le processus pty lorsque la connexion WebSocket est fermée
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
