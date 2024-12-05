// Ecrans (sections principales) qui composent l'interface
const ecranSelectionServeur = document.getElementById('selectServerScreen');
const ecranJeu = document.getElementById('jeuHexScreen');

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
 * Dessine un tablier/grille d'hexagones
 * @param {Number} nbLignes
 * @param {Number} nbColonnes 
 * @param {Number} rayon
 * @param {Boolean} estLosange Dessiner le tablier en forme de losange si vrai, sinon en forme rectangulaire
 * @param {*} corpsSvg Element SVG sur lequel dessiner le tablier (résultant d'un d3.select(...))
 * @param {*} hexCallback Callback appellé à la création d'un hexagone (paramètres: (élément 'path' d3.js, num. ligne, num. colonne))
 */
function creerTablier(nbLignes, nbColonnes, rayon, estLosange, corpsSvg, hexCallback) {
    const hexagone = creeHexagone(rayon);
    const distance = rayon - (Math.sin(1 * Math.PI / 3) * rayon);

    for (let l = 0; l < nbLignes; l++) {
        for (let c = 0; c < nbColonnes; c++) {

            let d = "";
            let decalageX = estLosange ? l * (rayon - distance)
                : (l % 2 === 1 ? rayon - distance : 0);

            if (estLosange) {
                decalageX += l * (rayon - distance);
            }

            for (h in hexagone) {
                x = hexagone[h][0] + (rayon-distance) * (2+2 * c) + decalageX;
                y = hexagone[h][1] + (rayon-distance * 2) * (1+2 * l);
                d += (d == "" ? "M" : "L") + x + "," + y;
            }

            d += "Z";

            hexCallback(corpsSvg.append("path")
                .attr("d", d), l, c);

        }
    }
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

    // Dessiner le tablier de jeu (en losange)
    creerTablier(
        11, 11, 40, // Tablier de 11x11 cases de 40px de rayon 
        true, // Tablier en forme de losange
        d3.select('#tablierSvg'),
        ((hexa, l, c) => {
            hexa.attr('stroke', '#0d6efd');
            hexa.attr('fill', 'none');
            hexa.attr('stroke-width', '3');
            hexa.attr('id', 'hex_jeu_' + l + '_' + c);
        }),
    );

}

if (MODE_BYPASS) afficherEcranJeu();