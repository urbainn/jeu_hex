const Joueur = require("./struct/Joueur");
const Partie = require("./struct/Partie");

module.exports = function messagesSocketsIO(socket, app) {

    let joueur = null;
    let partie = null;

    /** L'utilisateur s'authentifie (à entré un nom d'utilisateur) */
    socket.on('authentifier', data => {
        if (!data.username || joueur !== null) return;

        // Créer une nouvelle instance
        joueur = new Joueur(data.username);
        app.joueurs.set(joueur.id, joueur);

        // Renvoyer les informations au client
        socket.emit('authentification', { id: joueur.id });
    });

    /** L'utilisateur créé un nouveau serveur */
    socket.on('creerServeur', () => {
        if (!joueur || joueur.partie !== null) return;

        console.log('Une nouvelle partie vient d\'être créée.')

        // Créer une nouvelle partie
        partie = new Partie(joueur);
        app.parties.set(partie.id, partie);
        socket.broadcast.emit('nouveauServeur', partie);
    });

    /** Renvoyer la liste des serveurs actifs */
    socket.on('serveurListe', () => {
        console.log(app.parties.values());
        socket.emit('serveurListe', [...app.parties.values()]);
    });

}