class Joueur {

    /* Nom d'utilisateur */
    username;

    /* Identifiant unique */
    id;

    /* Socket associé à l'utilisateur */
    socket;

    /** Partie attachée à l'utilisateur. Null si aucune. */
    partie = null;

    /* Identifiant du prochain joueur */
    static _prochainJoueurId = 0;
    
    /**
     * Joueur
     */
    constructor(username, socket) {
        this.username = username;
        this.socket = socket;
        this.id = Joueur._assignerId();
    }

    /**
     * Assigner un id à un nouveau joueur. Retourne le nouvel id et incrémente le compteur.
     */
    static _assignerId() {
        return Joueur._prochainJoueurId++;
    }

    /**
     * Envoyer un message/notification visuelle au joueur.
     * @param {String} message Message à envoyer
     * @param {Number} typeAffichage Type d'affichage du message (0 = message volant, 1 = popup/alert)
     * @param {String} couleur Couleur du message
     */
    envoyerNotification(message, typeAffichage, couleur = '#fff') {
        this.socket.emit('message', { message, typeAffichage, couleur });
    }

}

module.exports = Joueur;