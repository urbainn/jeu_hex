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

}

module.exports = Joueur;