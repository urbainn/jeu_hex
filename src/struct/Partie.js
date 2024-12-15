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

    /* Horodatage du début de la partie, null si la partie n'a pas encore commencé */
    debutPartieTimestamp = null;

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

            // Démarrer la partie
            this.demarrerPartie();

        } else {

            // Est un spectateur
            this.broadcast('spectateurRejoint', { pseudo: joueur.username });
            this.spectateurs.push(joueur);

        }

        // Mettre à jour les informations du joueur
        joueur.partie = this;
        joueur.socket.emit('partieAccepte', { partie: this.serialiser(), spectateur: this.joueur2 !== joueur });
        joueur.socket.broadcast.emit('serveurUpdate', this.serialiser());
        this.envoyerMessageSysteme(joueur.username + ' a rejoint la partie.');

    }

    /**
     * Un joueur quitte la partie.
     * @param {Joueur} joueur Joueur qui quitte la partie
     */
    joueurQuitte(joueur) {
        
        // Le joueur était un spectateur?
        const indexSpectateur = this.spectateurs.findIndex(spectateur => spectateur.id === joueur.id);
        if (indexSpectateur !== -1) {

            // Retirer le spectateur de la liste locale
            this.spectateurs.splice(indexSpectateur, 1);
            this.broadcast('spectateurQuitte', { pseudo: joueur.username });
            joueur.socket.broadcast.emit('serveurUpdate', this.serialiser());
            return;

        } else {

            // Le joueur était un joueur
            if (this.joueur1.id === joueur.id) {
                this.joueur1 = this.joueur2;
                this.joueur2 = null;
            } else {
                this.joueur2 = null;
            }

            // Un des deux joueurs vient de quitter. Mettre fin à la partie.
            this.broadcast('abandonPartie', { raison: 'Un joueur a quitté la partie.' });
            joueur.socket.broadcast.emit('serveurSupprime', { id: this.id });
            this.finPartie();

        }
    }

    /**
     * Fin de la partie (nettoyage).
     */
    finPartie() {
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
        this.joueurBleu = this.joueurRouge === this.joueur1 ? this.joueur2 : this.joueur1;

        // Envoyer un paquet allégé à chaque spectateur
        this.spectateurs.forEach(spectateur => spectateur.socket.emit('debutPartie', {
            rouge: this.joueurRouge.username,
            bleu: this.joueurBleu.username
        }));

        // Envoyer un paquet complet aux joueurs
        // Contient le role de chaque joueur (ROUGE ou BLEU)
        [this.joueur1, this.joueur2].forEach(joueur => joueur.socket.emit('debutPartie', {
            rouge: this.joueurRouge.username,
            bleu: this.joueurBleu.username,
            couleur: joueur === this.joueurRouge ? 0 : 1
        }));

        this.debutPartieTimestamp = Date.now() + 15000; // +15s pour compenser les animations coté client

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
        if (this.tablierBleu[ligne][colonne] || this.tablierRouge[ligne][colonne])
            return joueur.envoyerNotification('Case déjà jouée.', 0, '#ff5c5c');

        // Jouer le coup
        if (this.tour % 2 === 1) {
            this.tablierRouge[ligne][colonne] = true;
        } else {
            this.tablierBleu[ligne][colonne] = true;
        }

        this.broadcast('coupJoue', { ligne, colonne, couleur: (this.tour - 1) % 2, total: this.tour });

        // Vérifier si le joueur a gagné
        const victoire = this.verifierVictoire((this.tour - 1) % 2);
        if (victoire) {
            this.broadcast('finPartie', {
                gagnant: {
                    couleur: (this.tour - 1) % 2,
                    pseudo: joueur.username
                },
                coupsJoues: this.tour,
                dureePartie: Math.round((Date.now() - this.debutPartieTimestamp) / 1000),
                spectateurs: this.spectateurs.length
            });
            this.finPartie();
            return true;
        }

        this.tour++;
        return true;

    }

    /**
     * Vérifier si les conditions de victoire sont remplies por un joueur.
     * @param {Number} couleur Couleur du joueur (0 = ROUGE, 1 = BLEU)
     * @returns {Boolean} true si le joueur a gagné, false sinon
     */
    verifierVictoire(couleur){
        let tablier;
        let indicePos; // Axe à vérifier pour la victoire (0 = y, 1 = x)
        let aVisiter = [];
        let visite = new Set();
        let victoire = false;
        
        if (couleur === 1) {
            tablier = this.tablierBleu;
            indicePos = 1;
            for (let y = 0; y < tablier.length; y++) {
                if (tablier[y][0]) aVisiter.push([y, 0]);
            }
        } else {
            tablier = this.tablierRouge;
            indicePos = 0;
            for (let x = 0; x < tablier.length; x++) {
                if (tablier[0][x]) aVisiter.push([0, x]);
            }
        }
        
        // Algorithme de recherche en profondeur
        while (aVisiter.length != 0) {

            let point = aVisiter.shift();
            let pointString = point[0] + ',' + point[1];
            visite.add(pointString);

            if(point[indicePos] == tablier.length - 1) {

                // Victoire !
                victoire = true;
                break;
            }
    
            // Ajour des voisins à la liste des points à visiter
            [
                // Position relative des voisins
                /* nord */ [0, -1], /* sud */ [0, 1],
                /* ouest */ [-1, 0], /* ouest */ [1, 0],
                /* nord-ouest */ [-1, 1], /* sud-est */ [1, -1]
            ].forEach(([x,y]) => {

                const voisinX = point[1]+x;
                const voisinY = point[0]+y;

                // La case est valide, et non visitée
                if(voisinX >= 0 && voisinX < tablier.length
                    && voisinY >= 0 && voisinY < tablier.length
                    && tablier[voisinY][voisinX]
                    && !visite.has(voisinY + ',' + voisinX)) {
                    
                        // Ajouter le voisin à la liste des points à visiter
                        aVisiter.push([voisinY, voisinX]);
                    }
            });
        }

        return victoire;
    }

    /**
     * Envoyer un message "système" dans le chat de la partie.
     * @param {String} message Message à envoyer
     */
    envoyerMessageSysteme(message) {
        this.broadcast('chat', {
            message,
            systeme: true
        });
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
            spectateurs: this.spectateurs.map(spectateur => spectateur.username),
            debutDepuis: this.debutPartieTimestamp ? Math.round((Date.now() - this.debutPartieTimestamp) / 1000) : null
        }
    }

}

module.exports = Partie;