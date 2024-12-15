const socket = io();

let idJoueur = null;
let usernameJoueur = null;

const socketCallbacks = {
    serveurListe: () => {},
    rejoindrePartie: () => {},
    authentification: () => {},
    creerServeur: () => {}
}

/**
 * Envoyer un message au travers du socket
 * @param {String} nomPacket Nom du packet à envoyer
 * @param {Object} data Données à envoyer
 */
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
    aucunServeurDisponibleMsg.style.display = 'none';
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
    socketCallbacks.serveurListe(data);
});

// Le serveur envoit un message au joueur.
socket.on('message', (data) => {
    const typeAffichage = data.affichage; // 0 = message volant, 1 = popup/alert
    const message = data.message;
    const couleur = data.couleur || '#fff';

    if (typeAffichage === 0) {
        afficherMessageVolant(message, couleur);
    } else {
        alert(message);
    }
});

// Un joueur a joué un coup
socket.on('coupJoue', (data) => {
    joueurCoup(data);
});

// Un message de chat est reçu
socket.on('chat', (data) => {
    messageChatRecu(data);
});

socket.on('partieAccepte', (data) => {
    rejoindrePartieAcceptee(data);
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