class Partie {

    /* Référence vers l'Application */
    app;

    /* ID de la partie */
    id;

    /* Joueur 1 */
    joueur1;

    /* Joueur 2 (null si personne) */
    joueur2 = null;

    /* Tablier du joueur rouge.
     * Rempli de true si le joueur a joué sur la case, false sinon */
    tablierRouge = Array(11).fill(false).map(() => Array(11).fill(false));

    /* Tablier du joueur bleu.
    * Rempli de true si le joueur a joué sur la case, null sinon */
    tablierBleu = Array(11).fill(false).map(() => Array(11).fill(false));

    /* Numéro du tour */
    tour = 1;

    /* Instance du joueur rouge (joue le premier coup) */
    joueurRouge = null;

    /* Instance du joueur bleu */
    joueurBleu = null;

    /* Liste des spectateurs */
    spectateurs = [];

    /* Identifiant de la prochaine partie */
    static _prochainePartieId = 0;
    
    /**
     * Partie de hex
     */
    constructor(app, joueur1) {
        this.id = Partie._assignerId();
        this.joueur1 = joueur1;
        this.app = app;
    }

    /**
     * Assigner un id à une nouvelle partie. Retourne le nouvel id et incrémente le compteur.
     */
    static _assignerId() {
        return Partie._prochainePartieId++;
    }

    /**
     * Retourne le joueur pour lequel c'est le tour (joueur qui doit jouer)
     * @returns {Joueur}
     */
    get joueurActif() {
        // Se baser sur le joueur qui a commencé la partie (ROUGE)
        return this.tour % 2 === 1 ? this.joueurRouge : this.joueurBleu;
    }

    /**
     * La partie est-elle en cours ?
     * @returns {Boolean} true si la partie est en cours, false sinon
     */
    get enCours() {
        return this.joueurRouge !== null;
    }

    /**
     * Broadcaster un evenement à tous les joueurs (y compris les spectateurs) de la partie.
     * @param {String} event Nom de l'événement
     * @param {Object} data Données à envoyer
     */
    broadcast(event, data) {
        if (this.joueur1) this.joueur1.socket.emit(event, data);
        if (this.joueur2) this.joueur2.socket.emit(event, data);
        this.spectateurs.forEach(spectateur => spectateur.socket.emit(event, data));
    }

    /**
     * Un nouveau joueur souhaite rejoindre la partie.
     * @param {Joueur} joueur Joueur qui souhaite rejoindre la partie
     */
    joueurRejoint(joueur) {
        
        // S'assurer que le joueur n'est pas déjà dans la partie
        if (this.joueur1.id === joueur.id || (this.joueur2 && this.joueur2.id === joueur.id)) return;
        if (this.spectateurs.find(spectateur => spectateur.id === joueur.id)) return;

        if (this.joueur2 === null) {
            // Est le deuxième joueur
            this.joueur2 = joueur;
        } else {
            // Est un spectateur
            this.spectateurs.push(joueur);
            this.broadcast('spectateurRejoint', { pseudo: joueur.username });
        }

        // Mettre à jour les informations du joueur
        joueur.partie = this;
        joueur.socket.emit('partieAccepte', { partie: this.serialiser(), spectateur: this.joueur2 !== joueur }); // changé this.joueur2 === joueur à cause ligne 94

    }

    /**
     * Un joueur quitte la partie.
     * @param {Joueur} joueur Joueur qui quitte la partie
     */
    joueurQuitte(joueur) {

        console.log('Un joueur quitte la partie.');
        
        // Le joueur était un spectateur
        const indexSpectateur = this.spectateurs.findIndex(spectateur => spectateur.id === joueur.id);
        if (indexSpectateur !== -1) {
            this.spectateurs.splice(indexSpectateur, 1);
            this.broadcast('spectateurQuitte', { id: joueur.id });
            return;
        } else {
            // Le joueur était un joueur
            if (this.joueur1.id === joueur.id) {
                this.joueur1 = this.joueur2;
                this.joueur2 = null;
            } else {
                this.joueur2 = null;
            }
        }

        // Un des deux joueurs vient de quitter. Mettre fin à la partie.
        this.broadcast('partieAnnulee', { raison: 'Un joueur a quitté la partie.' });
        this.finPartie();

    }

    /**
     * Fin de la partie (nettoyage).
     */
    finPartie() {
        console.log('FIN DE LA PARTIE');
        this.app.parties.delete(this.id);
        if (this.joueur1) this.joueur1.partie = null;
        if (this.joueur2) this.joueur2.partie = null;
        this.spectateurs.forEach(spectateur => spectateur.partie = null);
    }

    /**
     * Démarrer la partie.
     */
    demarrerPartie() {
        if (this.enCours) return;

        // Déterminer aléatoirement le joueur qui commence (ROUGE)
        this.joueurRouge = Math.random() > 0.5 ? this.joueur1 : this.joueur2;
        // ce broadcast n'est pas récup donc les joueurs n'ont pas de couleurs
        this.broadcast('debutPartie', {
            rouge: this.joueurRouge.id,
            bleu: this.joueurRouge === this.joueur1 ? this.joueur2.id : this.joueur1.id
        });
    }

    /**
     * Jouer un coup.
     * @param {Joueur} joueur Joueur qui joue le coup
     * @param {Number} ligne Ligne du coup
     * @param {Number} colonne Colonne du coup
     * @returns {Boolean} true si le coup est valide, false sinon
     */
    jouerCoup(joueur, ligne, colonne) {
        
        if (!this.enCours) return false;

        // Vérifier que le joueur soit bien un joueur actif de la partie
        if (this.joueur1.id !== joueur.id && this.joueur2.id !== joueur.id) return false;

        // Vérifier la validité du coup
        if (ligne < 0 || ligne > 10 || colonne < 0 || colonne > 10)
            return joueur.envoyerNotification('Coup invalide.', 0, '#ff5c5c');

        // Vérifier que c'est au tour du joueur
        if (this.joueurActif.id !== joueur.id)
            return joueur.envoyerNotification('Ce n\'est pas votre tour.', 0, '#ff5c5c');

        // Vérifier que la case n'a pas déjà été jouée
        if (this.tablierBleu[ligne][colonne] !== null || this.tablierRouge[ligne][colonne] !== null)
            return joueur.envoyerNotification('Case déjà jouée.', 0, '#ff5c5c');

        // Jouer le coup
        if (this.tour % 2 === 1) {
            this.tablierRouge[ligne][colonne] = true;
        } else {
            this.tablierBleu[ligne][colonne] = true;
        }

        this.broadcast('coupJoue', { ligne, colonne, couleur: (this.tour - 1) % 2 });

        this.tour++;
        return true;

    }

    /**
     * Sérialiser la partie pour l'envoyer au client.   
     */
    serialiser() {
        return {
            id: this.id,
            createur: this.joueur1.username,
            nbJoueurs: this.joueur2 ? 2 : 1,
            nbSpectateurs: this.spectateurs.length,
            rouge: this.joueurRouge ? this.joueurRouge.username : null,
            bleu: this.joueurBleu ? this.joueurBleu.username : null,
            tabliers: {
                rouge: this.tablierRouge,
                bleu: this.tablierBleu
            },
            numeroTour: this.tour,
            tourDeCouleur: (this.tour - 1) % 2,
            spectateurs: this.spectateurs.map(spectateur => spectateur.username)
        }
    }

}

module.exports = Partie;