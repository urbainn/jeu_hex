const Joueur = require("./struct/Joueur");
const Partie = require("./struct/Partie");

module.exports = function messagesSocketsIO(socket, app) {

    let joueur = null;
    let partie = null;

    /** L'utilisateur se déconnecte */
    socket.on('disconnect', () => {
        if (!joueur) return;

        // Supprimer le joueur du cache
        app.joueurs.delete(joueur.id);

        // Supprimer le joueur de la partie
        if (joueur.partie) joueur.partie.joueurQuitte(joueur);

        joueur = null;
    });

    /** L'utilisateur s'authentifie (à entré un nom d'utilisateur) */
    socket.on('authentifier', data => {
        if (!data.username || joueur !== null) return;

        // Créer une nouvelle instance
        joueur = new Joueur(data.username);
        joueur.socket = socket;
        app.joueurs.set(joueur.id, joueur);

        // Renvoyer les informations au client
        socket.emit('authentification', { id: joueur.id });
    });

    /** L'utilisateur créé un nouveau serveur */
    socket.on('creerServeur', () => {
        if (!joueur || joueur.partie !== null) return;

        console.log('Une nouvelle partie vient d\'être créée.')

        // Créer une nouvelle partie
        partie = new Partie(app, joueur);
        app.parties.set(partie.id, partie);
        joueur.partie = partie;

        socket.broadcast.emit('nouveauServeur', partie.serialiser());
        socket.emit('partieAccepte', { partie: partie.serialiser(), spectateur: false });

    });

    /** Renvoyer la liste des serveurs actifs */
    socket.on('serveurListe', () => {
        socket.emit('serveurListe', [...app.parties.values()].map(partie => partie.serialiser()));
    });

    /** Rejoindre une partie */
    socket.on('rejoindrePartie', data => {
        if (!joueur || joueur.partie !== null) return;

        // Récupérer la partie
        partie = app.parties.get(data.id);
        if (!partie) return joueur.envoyerNotification('La partie n\'existe pas.', 1);

        // Rejoindre la partie
        partie.joueurRejoint(joueur);
    });

    /** Un joueur joue un coup */
    socket.on('coupJoue', data => {
        if (!joueur || !partie) return;

        // Vérifier que le joueur soit bien un joueur actif de la partie
        if (partie.joueur1.id !== joueur.id && partie.joueur2.id !== joueur.id) {
            joueur.envoyerNotification('Vous ne pouvez pas jouer.', 0, '#ff5c5c');
            return
        }

        // Vérifier la validité du coup
        const ligne = data.ligne;
        const colonne = data.colonne;

        // Jouer le coup
        partie.jouerCoup(joueur, ligne, colonne);

    });

    /** Message dans le chat */
    socket.on('chat', data => {
        if (!joueur || !partie) return;

        // Broadcaster le message
        partie.broadcast('chat', {
            pseudo: joueur.username,
            message: data.message,
            systeme: false,
            couleur: joueur === partie.joueurRouge ? '#e65555' :
                joueur === partie.joueurBleu ? '#5f9ddb' : '#828282'
        });
    });

}