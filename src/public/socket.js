const socket = io();

let idJoueur = null;
let usernameJoueur = null;

const socketCallbacks = {
    serveurListe: () => {},
    rejoindrePartie: () => {},
    authentification: () => {},
    creerServeur: () => {}
}

// Envoyer un message au travers du socket
async function envoyerMessage(nomPacket, data) {
    await socket.emit(nomPacket, data);
}

/**
 * Reçu de messages par le socket
 */

// Le joueur courant s'est authentifié auprès du socket
socket.on('authentification', (data) => {
    idJoueur = data.id;
    socketCallbacks.authentification(data);
});

// Un nouveau serveur vient d'être créé
socket.on('nouveauServeur', (data) => {
    creerCarteServeur(data);
});

// Un joueur rejoint un serveur
socket.on('rejointServeur', (data) => {
    if (data.idJoueur === idJoueur) {
        socketCallbacks.rejoindrePartie(data);
        selfRejointPartie(data);
    }
})

// Un serveur est mis à jour (la partie commence/se termine)
socket.on('serveurUpdate', (data) => {
    // data.type = type de mise à jour
    modifierCarteServeur(data.partie);
})

// Reçoit la liste des serveurs actifs
socket.on('serveurListe', (data) => {
    console.log('liste recue', data);
    socketCallbacks.serveurListe(data);
});

/**
 * Envoi de messages par le socket
 */

/** S'authentifier auprès du serveur */
function authentifierSocket(callback) {
    socket.emit('authentifier', { username: usernameJoueur });
    socketCallbacks.authentification = callback;
}

/** Demander la liste des serveurs actifs */
function demanderListeServeurs(callback) {
    socket.emit('serveurListe');
    socketCallbacks.serveurListe = callback;
}

/** Rejoindre une partie en cours */
function rejoindrePartie(idPartie, callback) {
    socket.emit('rejoindrePartie', { id: idPartie });
    socketCallbacks.rejoindrePartie = callback;
}

/** Créer un nouveau serveur */
function creerServeur(callback) {
    socket.emit('creerServeur');
    socketCallbacks.creerServeur = callback;
}