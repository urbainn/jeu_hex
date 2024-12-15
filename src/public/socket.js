const socket = io();

let idJoueur = null;
let usernameJoueur = null;
let nbServeurs = 0;

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
    console.log('[SOCKET] Envoi de message: ' + nomPacket);
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

// Un serveur a été supprimé
socket.on('serveurSupprime', (data) => {
    const carteServeur = document.getElementById('carteServeur_' + data.id);
    if (carteServeur) { 
        nbServeurs--;
        carteServeur.classList.add('fade-out');
        setTimeout(() => {
            carteServeur.remove();

            // Plus aucun serveur disponible?
            if (nbServeurs === 0) {
                aucunServeurDisponibleMsg.classList.add('fade-in');
                aucunServeurDisponibleMsg.style.display = 'block';
            }
        }, 400);
    }
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
    const card = document.getElementById('carteServeur_' + data.id);
    const cardText = document.getElementById('carteTexteServeur_' + data.id);
    modifierCarteServeur(data, card, cardText);
})

// Reçoit la liste des serveurs actifs
socket.on('serveurListe', (data) => {
    socketCallbacks.serveurListe(data);
});

// Le serveur envoit un message au joueur.
socket.on('notif', (data) => {
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

// La demande de rejoindre une partie a été acceptée
socket.on('partieAccepte', (data) => {
    rejoindrePartieAcceptee(data);
});

// La partie commence..
socket.on('debutPartie', (data) => {
    debutPartie(data);
});

// La partie est terminée
socket.on('finPartie', (data) => {
    finPartie(data);
});

// La partie est abandonnée
socket.on('abandonPartie', (data) => {
    abandonPartie(data);
});

// Un spectateur rejoint la partie
socket.on('spectateurRejoint', (data) => {
    spectateurRejoint(data);
});

// Un spectateur quitte la partie
socket.on('spectateurQuitte', (data) => {
    spectateurQuitte(data);
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