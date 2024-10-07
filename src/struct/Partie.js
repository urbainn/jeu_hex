class Partie {

    /* ID de la partie */
    id;

    /* Joueur 1 */
    joueur1;

    /* Joueur 2 (null si personne) */
    joueur2 = null;

    /** Liste des spectateurs */
    spectateurs = [];

    /* Identifiant de la prochaine partie */
    static _prochainePartieId = 0;
    
    /**
     * Partie de hex
     */
    constructor(joueur1) {
        this.id = Partie._assignerId();
        this.joueur1 = joueur1;
    }

    /**
     * Assigner un id à une nouvelle partie. Retourne le nouvel id et incrémente le compteur.
     */
    static _assignerId() {
        return Partie._prochainePartieId++;
    }

}

module.exports = Partie;