const express = require('express');
const http = require('http');
const routesServeurHTTP = require('./routesServeurHTTP');
const messagesSocketIO = require('./messagesSocketIO');

class App {

    /* PORT sur lequel le serveur écoute */
    static PORT_SERVEUR = 8888;

    abc = 'test';

    /* Application Express.js */
    app = express();

    /* Serveur */
    server = http.createServer(this.app);

    /* IO (websocket) */
    io = new require('socket.io')(this.server);

    /* Cache des utilisateurs actifs. Map(<id, instance Joueur>). */
    joueurs = new Map();

    /* Cache des parties actives. Map(<id, instance Partie>). */
    parties = new Map();

    /**
     * Lancer le serveur
     */
    start() {

        this.server.listen(App.PORT_SERVEUR, () => {
            console.log('Le serveur écoute sur le port ' + App.PORT_SERVEUR);
        });

        routesServeurHTTP(this.app);

        this.io.on('connection', (socket) => {
            messagesSocketIO(socket, this);
        });

    }

}

module.exports = new App();