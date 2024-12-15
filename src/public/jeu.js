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
const profilJoueurBleu = document.getElementById('profilJoueurBleu');
const discussionChat = document.getElementById('chat-discussion');

// Modals
const debutPartieModal = new bootstrap.Modal(document.getElementById('debutPartieModal'), { backdrop: 'static' });

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
            if (l % (nbLignes - 1) === 0) {

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
            if (c % (nbColonnes-1) === 0) {

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
 */
async function afficherEcranJeu() {

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
    const tablierSVG = d3.select('#tablierSvg');
    //dessinerReperesEquipe(11, 11, rayonOpti, tablierSVG, [0, rayonOpti]);
    const dimensionsTablier = creerTablier(
        11, 11, rayonOpti, // Tablier de 11x11 cases 
        true, // ..en forme de losange
        tablierSVG,
        ((hexa, l, c) => {
            hexa.attr('stroke', '#212529')
                .attr('fill', '#212529')
                .attr('stroke-width', '3')
                .attr('id', 'hex_jeu_' + l + '_' + c)
                .transition()
                .duration(500)
                .delay(l * 75 + c * 75) // Affichage progressif des hexagones (animation)
                .attr('stroke', '#9099a2')
                .attr('fill', (l % 2 === 0 ? c : c+1) % 2 === 0 ? '#ffffff15' : '#212529')
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

                jouerCoup(d.target.id);

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

    console.log('Données de la partie : ', partie);

    // Les couleurs des joueurs n'ont pas encore été déterminées
    if (!partie.rouge) {
        mettreAJourPseudos('Joueur Rouge', 'Joueur Bleu');
    } else {
        mettreAJourPseudos(partie.rouge, partie.bleu);
        mettreAJourTour(partie.numeroTour);
    } 

    tourJoueur = partie.tourDeCouleur;
    listeSpectateurs = partie.spectateurs;

    // Afficher l'écran de jeu
    afficherEcranJeu();

    // Laisser les animations d'affichage du jeu se terminer,
    // puis afficher le modal d'attente de joueur/début de partie
    setTimeout(() => {
        debutPartieModal.show();
    }, 4000);
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
 * FONCTIONS DE JEU
 * Fonctions appellées au cours du jeu, pour gérer les interactions serveur/joueur
 */

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
        pseudoElement.innerText = pseudo + ' : ';
        messageElement.appendChild(pseudoElement);

    } else if (systeme) {

        // Message système
        messageElement.classList.add('chat-msg-systeme');
    
    }

    // Contenu du message
    const contenuElement = document.createElement('span');
    contenuElement.innerText = message;

    // Assemblage
    messageElement.appendChild(contenuElement);

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

    // Mettre à jour l'interface
    const hexa = d3.select('#hex_jeu_' + ligne + '_' + colonne)
        .transition() /* animation: grossissement de l'hexagone, puis retour à la normale */
        .duration(300)
        .attr('fill', couleur === 0 ? '#ff5050' : '#5cabfb')
        .attr('transform', 'scale(1.1)');

    setTimeout(() => {
        hexa.transition()
            .duration(300)
            .attr('fill', couleur === 0 ? '#ff5050' : '#5cabfb')
            .attr('transform', 'scale(1)');
    }, 300);

    // Mettre à jour le tour du joueur
    tourJoueur = (tourJoueur + 1) % 2;

}

if (MODE_BYPASS) afficherEcranJeu();