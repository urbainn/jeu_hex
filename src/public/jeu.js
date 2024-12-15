// Ecrans (sections principales) qui composent l'interface
const ecranSelectionServeur = document.getElementById('selectServerScreen');
const ecranJeu = document.getElementById('jeuHexScreen');

// Variables de jeu
let estSpectateur = false;
let joueurCouleur = null; // null = spectateur/indéterminé, 0 = rouge, 1 = bleu
let tourJoueur = 0; // 0 = rouge, 1 = bleu
let listeSpectateurs = [];

// Tabliers
let tablierRouge = new Array(11).fill(false).map(() => new Array(11).fill(false));
let tablierBleu = new Array(11).fill(false).map(() => new Array(11).fill(false));

// Elements du jeu
const profilJoueurRouge = document.getElementById('profilJoueurRouge');
const fondProfilRouge = document.getElementById('fondProfilRouge');
const timerJoueurRouge = document.getElementById('timerJoueurRouge');

const profilJoueurBleu = document.getElementById('profilJoueurBleu');
const fondProfilBleu = document.getElementById('fondProfilBleu');
const timerJoueurBleu = document.getElementById('timerJoueurBleu');

const discussionChat = document.getElementById('discussionContainer');
const timerPartie = document.getElementById('timerPartie');
const joueursContainer = document.getElementById('joueursContainer');
const spectateursListe = document.getElementById('spectateursListe');
const spectateursNbr = document.getElementById('spectateursNbr');

// Modals
const debutPartieModal = new bootstrap.Modal(document.getElementById('debutPartieModal'), { backdrop: 'static' });
const finPartieModal = new bootstrap.Modal(document.getElementById('finPartieModal'), { backdrop: 'static' });
const abandonPartieModal = new bootstrap.Modal(document.getElementById('abandonPartieModal'), { backdrop: 'static' });

// Timers
let intervalleTimerRouge = null;
let intervalleTimerBleu = null;
let intervalleTimerPartie = null;

// Répertorier la position de la souris sur la page
let [mouseX, mouseY] = [0, 0];
document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

/**
 * Retourne les coordonnées d'un hexagone de rayon donné
 * @param {Number} rayon 
 * @returns 
 */
function creeHexagone(rayon) {
    let points = new Array();
    for (let i = 0; i < 6; ++i) {
        let angle = i * Math.PI / 3;
        let x = Math.sin(angle) * rayon;
        let y = -Math.cos(angle) * rayon;
        points.push([
            Math.round(x*100)/100,
            Math.round(y*100)/100
        ])
    }
    return points;
}

/**
 * Retourne la largeur d'un hexagone en fonction de son rayon
 * @param {Number} rayon
 */
function largeurHexagone(rayon) {
    return 2 * rayon;
}

/**
 * Retourne la hauteur d'un hexagone en fonction de son rayon
 * @param {Number} rayon
 */
function hauteurHexagone(rayon) {
    return Math.sqrt(3) * rayon;
}

/**
 * Retourne la valeur de distance pour un rayon R donné
 * @param {Number} rayon
 */
function distanceHexagone(rayon) {
    return rayon - (Math.sin(1 * Math.PI / 3) * rayon);
}

/**
 * Dessine un tablier/grille d'hexagones
 * @param {Number} nbLignes
 * @param {Number} nbColonnes 
 * @param {Number} rayon
 * @param {Boolean} estLosange Dessiner le tablier en forme de losange si vrai, sinon en forme rectangulaire
 * @param {*} corpsSvg Element SVG sur lequel dessiner le tablier (résultant d'un d3.select(...))
 * @param {*} hexCallback Callback appellé à la création d'un hexagone (paramètres: (élément 'path' d3.js, num. ligne, num. colonne))
 * @param {Array} coordsDepart Coordonnées auxquelles dessiner le tablier sur le SVG
 * @returns {Array} Renvoit les dimensions du tablier dans un tuple (largeur; hauteur)
 */
function creerTablier(nbLignes, nbColonnes, rayon, estLosange, corpsSvg, hexCallback, coordsDepart = [0, 0]) {
    const hexagone = creeHexagone(rayon);
    const distance = distanceHexagone(rayon);

    // Calculer les coordonnées d'un hexagone donné
    const coordsHexaX = (c, l=0, h=5) => hexagone[h][0] + l * (rayon-distance) + (rayon-distance) * (2+2 * c) + coordsDepart[0];
    const coordsHexaY = (l, h=5) => hexagone[h][1] + (rayon-distance * 2) * (1+2 * l) + coordsDepart[1];        
    const coordsHexa = (c, l, h) => [coordsHexaX(c, l, h), coordsHexaY(l, h)];

    for (let l = 0; l < nbLignes; l++) {
        for (let c = 0; c < nbColonnes; c++) {

            let d = "";
            let decalageX;

            if (estLosange) {
                // Tablier en forme de losange
                decalageX = l * (rayon-distance); 
            } else {
                // Tablier rectangulaire :
                // On décale les lignes impaires d'un demi hexagone afin de créer un
                // affichage en "nid d'abeille" où les hexagones s'emboitent
                decalageX = (l % 2 === 1 ? rayon - distance : 0);
            }

            for (h in hexagone) {
                x = hexagone[h][0] + (rayon-distance) * (2+2 * c) + decalageX + coordsDepart[0];
                y = hexagone[h][1] + (rayon-distance * 2) * (1+2 * l) + coordsDepart[1];
                d += (d == "" ? "M" : "L") + x + "," + y;
            }

            d += "Z";

            // Si en extrêmité de tablier; dessiner un repère de position
            if (estLosange && l % (nbLignes - 1) === 0) {

                // Dessiner les repères au dessus et en dessous du tablier
                let repereD;

                // Le repère est-il dessiné au dessus de l'hexagone (true) ou en dessous (false) ?
                const enAmont = l === 0;

                // Faire alterner deux bordures de couleurs différentes
                for (coteI = 0; coteI < 2; coteI++) {
                    
                    // Index du sommet de départ et de fin de l'hexagone
                    const hexaH = [
                        coteI === 0 ? enAmont ? 0 : 2 : enAmont ? 0 : 3,
                        coteI === 0 ? enAmont ? 5 : 3 : enAmont ? 1 : 4
                    ]

                    // Coordonnées ((x1,x2),(x2, y2)) du repère à tracer
                    const [x1, y1] = coordsHexa(c, l, hexaH[0]);
                    const [x2, y2] = coordsHexa(c, l, hexaH[1]);

                    if (enAmont) repereD = `M${x1},${y1}L${x2},${y2}L${x2},${y2-20}L${x1},${y1-20}Z`;
                    else repereD = `M${x1},${y1}L${x2},${y2}L${x2},${y2+20}L${x1},${y1+20}Z`;

                    corpsSvg.append("path").attr("d", repereD).attr("fill", "#212529")
                        .transition().duration(400).delay(500 + l * 70 + c * 70).attr("fill", coteI === 0 ? "#ff5050" : "#c64a4a");
                }
            }
            if (estLosange && c % (nbColonnes-1) === 0) {

                // Dessiner le repère sur les bords latéraux du tablier
                let repereD;

                // Le repère est-il dessiné à gauche de l'hexagone (true) ou à droite (false) ?
                const aGauche = c === 0;

                // Faire alterner deux bordures de couleurs différentes
                for (coteI = 0; coteI < 2; coteI++) {

                    if (c === 0 && l + 1 === nbLignes && coteI === 1) continue;
                    if (c + 1 === nbColonnes && l === 0 && coteI === 0) continue;
                    
                    // Index du sommet de départ et de fin de l'hexagone
                    const hexaH = [
                        coteI === 0 ? aGauche ? 4 : 0 : aGauche ? 3 : 1,
                        coteI === 0 ? aGauche ? 5 : 1 : aGauche ? 4 : 2
                    ]

                    // Coordonnées ((x1,x2),(x2, y2)) du repère à tracer
                    const [x1, y1] = coordsHexa(c, l, hexaH[0]);
                    const [x2, y2] = coordsHexa(c, l, hexaH[1]);

                    if (aGauche) repereD = `M${x1},${y1}L${x2},${y2}L${x2-20},${y2}L${x1-20},${y1}Z`;
                    else repereD = `M${x1},${y1}L${x2},${y2}L${x2+20},${y2}L${x1+20},${y1}Z`;

                    corpsSvg.append("path").attr("d", repereD).attr("fill", "#212529")
                        .transition().duration(500).delay(500 + l * 70 + c * 70).attr("fill", coteI === 0 ? "#5cabfb" : "#508ac4")
                }

            }

            hexCallback(corpsSvg.append("path")
                .attr("d", d), l, c);

        }
    }

    // Renvoyer les dimensions du tablier
    // (renvoit les coordonnées du 'dernier' hexagone sur le tablier)
    return [
        // Largeur, prend en compte le décalage, et ajoute 2 pixels pour compenser les bordures
        hexagone[1][0] + (rayon-distance) * (2+2 * (nbColonnes - 1)) - coordsDepart[0] +
            + (estLosange ? (nbLignes - 1) * (rayon - distance) : rayon - distance) + 2,
        
        // Hauteur, idem, 2 pixels pour compenser les bordures
        hexagone[1][1] + (rayon-distance * 2) * (1+2 * nbLignes) + 2 - coordsDepart[1]
    ]
}

/**
 * Basculer en 'mode jeu'. Cache l'écran de sélection de serveur, et affiche l'écran de jeu.
 * @param {Array} tablierRouge Tableau de jeu du joueur rouge (true = hexagone occupé, false = case libre)
 * @param {Array} tablierBleu Tableau de jeu du joueur bleu (true = hexagone occupé, false = case libre)
 */
async function afficherEcranJeu(tablierRouge = [], tablierBleu = []) {
    // Cacher l'écran de sélection de serveur (transition fade-out)
    ecranSelectionServeur.classList.add('fade-out');
    await new Promise(r => setTimeout(r, 490));
    ecranSelectionServeur.style.display = 'none';

    // Afficher l'écran de jeu (transition fade-in)
    ecranJeu.style.display = 'flex';
    ecranJeu.classList.add('fade-in');

    // Calculer le rayon optimal des hexagones pour l'écran du joueur
    // Pour le rayon opti sur l'axe X; revient à résoudre :
    // r/4 = (vw - decalage_max) / 11 (où r est le rayon opti)
    // decalage_max = r - distance (avec l = 11)
    // decalage_max = 11 * (r - (r - (sin(PI/3) * r)))
    // après simplification, on peut isoler r et obtenir :
    const rayonOptiX = -((vw * 0.6) * (1 - Math.sqrt(3))) / (11 * 2);

    // Calculer le rayon optimal sur l'axe Y; revient à résoudre :
    // hauteur_hexa(r) = vh / 10
    // <=> sqrt(3) * r = vh / 10
    // <=> r = vh / (10 * sqrt(3))
    const rayonOptiY = (vh * 0.8) / (10 * Math.sqrt(3));

    // NOTE: on base les calculs sur 80% de vw et vh, afin de laisser
    // des marges minimales de 10% de chaque côté.
    
    // Puis on prend uniquement le rayon le plus petit,
    // garantissant ainsi d'être compatible sur l'axe X et Y
    const rayonOpti = Math.min(rayonOptiX, rayonOptiY);

    // Dessiner le tablier de jeu (en losange)
    const contientDonnesTablier = tablierRouge.length > 0 && tablierBleu.length > 0;
    const tablierSVG = d3.select('#tablierSvg');
    const dimensionsTablier = creerTablier(
        11, 11, rayonOpti, // Tablier de 11x11 cases 
        true, // ..en forme de losange
        tablierSVG,
        ((hexa, l, c) => {

            // Couleur de remplissage de l'hexagone. Null = laisser vide
            const fill = !contientDonnesTablier ? null :
                tablierRouge[l][c] ? '#e65555' : tablierBleu[l][c] ? '#5f9ddb' : null;

            hexa.attr('stroke', '#212529')
                .attr('fill', '#212529')
                .attr('stroke-width', '3')
                .attr('id', 'hex_jeu_' + l + '_' + c)
                .transition()
                .duration(500)
                .delay(l * 75 + c * 75) // Affichage progressif des hexagones (animation)
                .attr('stroke', '#9099a2')
                .attr('fill', fill === null ? (l % 2 === 0 ? c : c+1) % 2 === 0 ? '#ffffff15' : '#212529' : fill);
        }), [0, rayonOpti]
    );

    // Ajuster la taille de l'élément SVG
    tablierSVG.attr('width', dimensionsTablier[0] + 0.5 * rayonOpti + 10)
        .attr('height', dimensionsTablier[1] +  2.5 * rayonOpti + 10);

    // Animer l'entrée profils des joueurs
    setTimeout(() => {
        profilJoueurBleu.style.transform = 'translateX(0)';
        profilJoueurRouge.style.transform = 'translateX(0)';
        profilJoueurRouge.style.opacity = '1';
        profilJoueurBleu.style.opacity = '1';
    }, 2000);

    // Si le joueur n'est pas en mode spectateur,
    // ajouter des écouteurs d'événements au tablier
    if (!estSpectateur) {
        tablierSVG.on('click', function(d) {
            // ..est un hexagone
            if (d.target.id.startsWith('hex_jeu_')) {

                // est-ce le tour du joueur ?
                if (tourJoueur !== joueurCouleur) {
                    afficherMessageVolant('Ce n\'est pas votre tour !', '#fff');
                    return;
                }

                const coords = d.target.id.split('_').slice(2).map(Number);
                jouerCoup(coords[1], coords[0]);

            }
        });
    }

}

/**
 * Affiche un message 'volant' à la position de la souris du joueur
 * @param {String} message Message à afficher
 * @param {String} couleur Couleur du message
 */
function afficherMessageVolant(message, couleur) {
    
    // Créer un élément de message
    const messageElement = document.createElement('div');
    messageElement.classList.add('message-volant');
    messageElement.style.color = couleur;
    messageElement.style.left = mouseX + 'px';
    messageElement.style.top = (mouseY - 25) + 'px';
    messageElement.innerText = message;

    // Ajouter l'élément au body
    document.body.appendChild(messageElement);

    // Supprimer l'élément après 3 secondes
    setTimeout(() => {
        messageElement.remove();
    }, 3000);

}


/**
 * FONCTIONS D'AFFICHAGE
 * Fonctions appellées pour afficher des éléments sur l'interface
 */

/**
 * La demande de rejoindre une partie a été acceptée.
 * Met à jour l'interface pour afficher les informations de la partie.
 * @param {Object} data Données de la partie
 */
function rejoindrePartieAcceptee(data) {
    const partie = data.partie;
    estSpectateur = data.spectateur;

    // Les couleurs des joueurs n'ont pas encore été déterminées
    if (!partie.rouge || !estSpectateur) {
        mettreAJourPseudos('Joueur Rouge', 'Joueur Bleu');
    } else {
        mettreAJourPseudos(partie.rouge, partie.bleu);
        mettreAJourTour(partie.numeroTour);
    } 

    tourJoueur = partie.tourDeCouleur;

    // Afficher l'écran de jeu
    if (estSpectateur) afficherEcranJeu(partie.tabliers.rouge, partie.tabliers.bleu);
    else afficherEcranJeu();

    // Laisser les animations d'affichage du jeu se terminer,
    // puis afficher le modal d'attente de joueur/début de partie
    if (!estSpectateur) {
        setTimeout(() => {
            debutPartieModal.show();
            document.getElementById('modalEcranAttenteAdversaire').classList.remove('d-none');
        }, 4000);
    } else {

        // Est spectateur. Mettre à jour l'interface pour afficher le mode spectateur
        intervalleTimerPartie = afficherTimer(timerPartie, partie.debutDepuis);

        for (let spectateur of partie.spectateurs) {
            spectateurRejoint({ pseudo: spectateur });
        }
    }
}

/**
 * Mettre à jour le pseudo des joueurs
 * @param {String} pseudoRouge Pseudo du joueur rouge
 * @param {String} pseudoBleu Pseudo du joueur bleu
 */
function mettreAJourPseudos(pseudoRouge, pseudoBleu) {
    document.getElementById('pseudoJoueurRouge').innerText = pseudoRouge;
    document.getElementById('pseudoJoueurBleu').innerText = pseudoBleu;
}

/**
 * Mettre à jour les informations du tour courant
 * @param {Number} numeroTour Numéro du tour (depuis le début de la partie, 1 = premier tour)
 */
function mettreAJourTour(numeroTour) {
    document.getElementById('toursJoues').innerText = numeroTour;
}

/**
 * Mettre à jour l'affichage pour indiquer que c'est le tour d'un joueur
 * @param {Number} couleur Couleur du joueur (0 = rouge, 1 = bleu) dont c'est le tour
 */
function afficherTourDe(couleur) {
    if (couleur === 0) {
        // C'est le tour du joueur rouge
        fondProfilRouge.style.opacity = '1';
        fondProfilBleu.style.opacity = '0.5';
        fondProfilRouge.style.left = '-10rem';
        fondProfilBleu.style.right = '-15rem';
    } else {
        // C'est le tour du joueur bleu
        fondProfilRouge.style.opacity = '0.5';
        fondProfilBleu.style.opacity = '1';
        fondProfilRouge.style.left = '-15rem';
        fondProfilBleu.style.right = '-10rem';
    }
}

/**
 * Afficher un timer dans l'élément spécifié (de type 'span')
 * @param {HTMLElement} timerElement Element dans lequel afficher le timer
 * @param {Number} debut Nombre de secondes à ajouter au timer de départ
 */
function afficherTimer(timerElement, debut = 1) {
    let temps = debut;

    // piste d'amélioration : utiliser un intervalle global qui met à jour tous les timers
    return setInterval(() => {
        timerElement.innerText = formatTemps(temps);
        temps++;
    }, 1000);
}

/**
 * Renvoit un temps en secondes sous forme de chaîne lisible (mm:ss)
 * @param {Number} temps Temps en secondes
 * @returns {String} Temps formaté
 */
function formatTemps(temps) {
    return Math.floor(temps / 60).toString().padStart(2, '0') + ':' + (temps % 60).toString().padStart(2, '0');
}

/**
 * Un nouveau spectateur rejoint la partie
 * @param {String} data Données du spectateur (pseudo)
 */
function spectateurRejoint(data) {
    const pseudo = data.pseudo;
    listeSpectateurs.push(pseudo);

    // Afficher la liste des spectateurs
    if (listeSpectateurs.length === 1) {
        joueursContainer.classList.remove('d-none');
    }

    // Ajouter le spectateur à la liste
    const spectateurElm = document.createElement('div');
    spectateurElm.classList.add('spectateur-pseudo');
    spectateurElm.innerText = pseudo;
    spectateursListe.appendChild(spectateurElm);

    // Mettre à jour le nombre de spectateurs
    spectateursNbr.innerText = listeSpectateurs.length;
}

/**
 * Un spectateur quitte la partie
 * @param {String} data Données du spectateur (pseudo)
 */
function spectateurQuitte(data) {
    const pseudo = data.pseudo;
    const index = listeSpectateurs.indexOf(pseudo);

    // Retirer le spectateur de la liste
    if (index !== -1) {
        listeSpectateurs.splice(index, 1);
        spectateursListe.children[index].remove();
    }

    // Mettre à jour le nombre de spectateurs
    spectateursNbr.innerText = listeSpectateurs.length;

    // Cacher la liste des spectateurs si aucun spectateur n'est présent
    if (listeSpectateurs.length === 0) {
        joueursContainer.classList.add('d-none');
    }

    // Supprimer le noeud DOM du spectateur dans la liste
    for (let i = 0; i < spectateursListe.children.length; i++) {
        if (spectateursListe.children[i].innerText === pseudo) {
            spectateursListe.children[i].remove();
            break;
        }
    }

}


/**
 * FONCTIONS DE JEU
 * Fonctions appellées au cours du jeu, pour gérer les interactions serveur/joueur
 */

/**
 * La partie commence.
 * @param {Object} data Données sur les couleurs des joueurs
 */
async function debutPartie(data) {
    const pseudoRouge = data.rouge;
    const pseudoBleu = data.bleu;
    const selfCouleur = data.couleur; // 0 = rouge, 1 = bleu

    // Element de contenu du modal
    const modalContentElm = document.getElementById('modalContentDebutPartie');
    modalContentElm.style.backgroundColor = '';

    // Attendre 4 secondes pour se synchroniser avec l'animation de début de partie
    // de l'utilisateur adverse (attendre que les deux soient sur le même écran)
    await new Promise(r => setTimeout(r, 4100));

    // Afficher l'écran 'adversaire trouvé !'
    const attAdversaireEcran = document.getElementById('modalEcranAttenteAdversaire');
    const advTrouvEcran = document.getElementById('modalEcranAdversaireTrouve');
    document.getElementById('adversaireNom').innerText = selfCouleur === 0 ? pseudoBleu : pseudoRouge;
    attAdversaireEcran.classList.add('d-none');
    advTrouvEcran.classList.remove('d-none');

    // Au bout de 3 secondes, afficher l'écran 'vous jouez en tant que...'
    await new Promise(r => setTimeout(r, 3000));

    const joueurCouleurEcran = document.getElementById('modalEcranVousJouezCouleur');
    advTrouvEcran.classList.add('d-none');
    joueurCouleurEcran.classList.remove('d-none');

    const txtCouleurJoueur = document.getElementById('ecranTxtCouleurJoueur');
    const txtRoleJoueur = document.getElementById('ecranTxtRoleJoueur');
    txtCouleurJoueur.innerText = selfCouleur === 0 ? 'ROUGE' : 'BLEU';
    txtRoleJoueur.innerText = selfCouleur === 0 ? 'Vous jouez le premier coup !' : 'Votre adversaire joue le premier coup.';

    // Cacher les textes
    txtCouleurJoueur.style.opacity = '0';
    txtRoleJoueur.style.opacity = '0';

    // Révéler la couleur du joueur après 2 secondes
    await new Promise(r => setTimeout(r, 2000));

    modalContentElm.style.backgroundColor = selfCouleur === 0 ? '#d14d4d' : 'rgb(72, 133, 196)';
    txtCouleurJoueur.style.opacity = '1';
    txtRoleJoueur.style.opacity = '0.7';

    joueurCouleur = selfCouleur;

    // Fermer le modal au bout de 5 secondes
    setTimeout(() => {
        debutPartieModal.hide();
        joueurCouleurEcran.classList.add('d-none');

        // Mettre à jour l'interface
        intervalleTimerRouge = afficherTimer(timerJoueurRouge);
        intervalleTimerPartie = afficherTimer(timerPartie);
        mettreAJourPseudos(pseudoRouge, pseudoBleu);
        afficherTourDe(0);

    }, 5000);

}

/**
 * La partie est terminée. (un joueur a gagné; voir 'abandonPartie' pour un abandon)
 * @param {Object} data Données sur la fin de la partie
 */
function finPartie(data) {
    const gagnant = data.gagnant;

    // Arrêter les timers
    clearInterval(intervalleTimerRouge);
    clearInterval(intervalleTimerBleu);
    clearInterval(intervalleTimerPartie);

    // Afficher le modal de fin de partie
    finPartieModal.show();

    // Mettre à jour le contenu du modal
    const coupsJouesElm = document.getElementById('statCoupsJoues');
    const dureePartieElm = document.getElementById('statTempsJeu');
    const spectateursElm = document.getElementById('statSpectateurs');

    coupsJouesElm.innerText = data.coupsJoues;
    dureePartieElm.innerText = formatTemps(data.dureePartie);
    spectateursElm.innerText = data.spectateurs;

    // Header du modal
    const finPartieModalHeaderTxt = document.getElementById('finPartieModalHeaderTxt');
    finPartieModalHeaderTxt.innerText = 
        estSpectateur ? gagnant.pseudo + ' a gagné la partie !' :
        gagnant.couleur === joueurCouleur ? 'Vous avez gagné !' : 'Vous avez perdu...';

}

/**
 * Un joueur a abandonné la partie.
 */
function abandonPartie() {
    // Arrêter les timers
    clearInterval(intervalleTimerRouge);
    clearInterval(intervalleTimerBleu);
    clearInterval(intervalleTimerPartie);

    // Afficher le modal d'abandon de partie
    abandonPartieModal.show();
}

/**
 * Un message de chat est reçu.
 * @param {Object} data Données du message
 */
function messageChatRecu(data) {
    const message = data.message;
    const couleur = data.couleur || '#fff'; // Couleur du nom du joueur
    const systeme = !!data.systeme; // Le message est-il une notification système ?
    const pseudo = data.pseudo;

    if (message === '' || message === null || message === undefined) return;

    // Créer l'élément contenant le message
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-msg');
    
    if (pseudo && !systeme) {

        // Pseudo
        const pseudoElement = document.createElement('span');
        pseudoElement.style.color = couleur;
        pseudoElement.className = 'pseudo';
        pseudoElement.innerText = pseudo + ' : ';
        messageElement.appendChild(pseudoElement);

    } else if (systeme) {

        // Message système
        messageElement.classList.add('systeme');
    
    }

    // Contenu du message
    const contenuElement = document.createElement('span');
    contenuElement.innerText = message;

    // Assemblage
    messageElement.appendChild(contenuElement);
    discussionChat.appendChild(messageElement);

    // Scroller en bas de la discussion
    discussionChat.scrollTop = discussionChat.scrollHeight;

}

/**
 * Envoyer un message de chat
 * @param {String} message Message à envoyer
 */
async function envoyerMessageChat(message) {
    await envoyerMessage('chat', { message: message });
}

/**
 * Le joueur joue un coup
 * @param {Number} colonne (x)
 * @param {Number} ligne (y)
 * @returns {Boolean} Renvoit vrai si le coup est valide, faux sinon
 */
async function jouerCoup(colonne, ligne) {

    // S'assurer que le coup est valide
    if (colonne < 0 || colonne >= 11 || ligne < 0 || ligne >= 11) {
        afficherMessageVolant('Coup invalide', '#ff5c5c');
        return false;
    }

    // Envoyer le coup au serveur
    await envoyerMessage('coupJoue', {
        colonne: colonne,
        ligne: ligne
    });

    // Le reste (affichage, etc.) est executé lors de la réception de la réponse du serveur.

}

/**
 * Un joueur vient de jouer un coup.
 * Executé lors de la réception de l'événement 'joueurCoup' du serveur.
 */
function joueurCoup(data) {
    const colonne = data.colonne;
    const ligne = data.ligne;
    const couleur = data.couleur; // 0 = rouge, 1 = bleu
    const total = data.total; // Nombre total de coups joués

    // Mettre à jour l'interface
    d3.select('#hex_jeu_' + ligne + '_' + colonne)
        .transition() /* animation: grossissement de l'hexagone, puis retour à la normale */
        .duration(300)
        .attr('fill', couleur === 0 ? '#e65555' : '#5f9ddb');

    // Mettre à jour le tour du joueur
    tourJoueur = (tourJoueur + 1) % 2;
    afficherTourDe(tourJoueur);
    mettreAJourTour(total);

    // Mettre à jour les timers
    if (tourJoueur === 0) {
        intervalleTimerRouge = afficherTimer(timerJoueurRouge);
        clearInterval(intervalleTimerBleu);
        timerJoueurBleu.innerText = '00:00';
    } else {
        intervalleTimerBleu = afficherTimer(timerJoueurBleu);
        clearInterval(intervalleTimerRouge);
        timerJoueurRouge.innerText = '00:00';
    }

}

// Envoi de messages de chat
const chatBouton = document.getElementById('messageBtn');
const chatInput = document.getElementById('messageInput');

const envoyerMsg = () => {
    if (chatInput.value.trim() === '') return;
    envoyerMessageChat(chatInput.value);
    chatInput.value = '';
}

// Envoyer un message de chat en appuyant sur 'Entrée' ou en cliquant sur le bouton
chatBouton.addEventListener('click', envoyerMsg);
chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        envoyerMsg();
    }
});

// Boutons de retour vers le menu de sélection de serveur
[document.getElementById('btnRetourMenu'), document.getElementById('btnRetourMenuAbandon')].forEach(
    (btn) => btn.addEventListener('click', () => {
        location.reload(); // todo plus tard: revenir à l'écran de sélection de serveur directement -> cleanup tablier + variables
    })
);

if (MODE_BYPASS) afficherEcranJeu();