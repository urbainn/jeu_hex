// Demander le nom d'utilisateur
const usernameModal = new bootstrap.Modal(document.getElementById('promptUsernameModal'), { backdrop: 'static' });
const submitUsernameBtn = document.getElementById('submitUsername');
const usernameInput = document.getElementById('usernameInput');
if (!MODE_BYPASS) usernameModal.show();

// Dégriser le bouton d'authentification lorsque l'input du pseudo n'est pas vide
const verifBtn = () => submitUsernameBtn.disabled = !usernameInput.value;
usernameInput.addEventListener('keyup', verifBtn);
verifBtn();

// L'utilisateur à entré un pseudo et s'authentifie
submitUsernameBtn.addEventListener('click', () => {

    if (!usernameInput.value) return;
    usernameJoueur = usernameInput.value;

    // S'authentifier auprès du socket
    authentifierSocket(() => { usernameModal.hide(); });

});

// Afficher la liste des serveurs
const listeServeurs = document.getElementById('listeServeurs');
const aucunServeurDisponibleMsg = document.getElementById('aucunServeurDisponibleMsg');
function afficherListeServeurs(data) {

    if (data.length === 0) aucunServeurDisponibleMsg.style.display = 'block';
    else aucunServeurDisponibleMsg.style.display = 'none';

    for (const serv of data) {
        creerCarteServeur(serv);
    }

}

// Créer le tablier d'hexagone servant de fond pour l'écran d'accueil
const svgFondHexa = d3.select('#' + selectServerScreen.id)
    .append("svg")
    .attr("class", "fond-hexagone");

// Dimensions du viewport afin d'ajuster la taille de la grille
const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
const fondLignesNb = Math.ceil(vh / hauteurHexagone(40)) + 6;
const fondColonnesNb = Math.ceil(vw / largeurHexagone(40)) + 6;

creerTablier(fondLignesNb, fondColonnesNb, 40, false, svgFondHexa,
    ((hexa, l, c) => {
        hexa.attr('stroke', '#0d6efd');
        hexa.attr('fill', 'none');
        hexa.attr('stroke-width', '3');
        hexa.attr('id', 'hex_fond_' + l + '_' + c);
    })
);

function animationFondAccueil() {

    // Anime l'hexagone en position (c; l)
    function animerHexagone(l, c) {
        const hex = d3.select('#hex_fond_' + l + '_' + c);
        hex.transition()
            .duration(200)
            .attr("fill", "#4294ff")
            .on("end", () => {
                choisirSuivant(l, c);

                // "Réinitialiser" l'animation
                hex.transition()
                    .duration(1500)
                    .attr("fill", "#212529")
            })
    }

    // Choisir aléatoirement un hexagone en aval de la position (c; l)
    function choisirSuivant(l, c) {
        if (l >= fondLignesNb - 1) {
            // Dernière ligne atteinte; relancer l'animation
            animationFondAccueil();
            return;
        }

        // On choisit, aléatoirement, soit l'hexagone gauche ou droit
        // Quand la ligne est paire; l'hexagone droit a un x = c
        // Quand la ligne est impaire; l'hexagone droit a un x = c+1
        const prochaineCol = Math.random() > 0.5
            ? l % 2 === 0 ? c : c+1 // Aller à droite
            : l % 2 === 0 ? c-1 : c; // Aller à gauche

        // Animer l'hexagone suivant
        animerHexagone(l + 1, prochaineCol);
    }

    // Choisir une colonne aléatoire sur le tablier
    const debutColonneNb = Math.round(Math.random() * (fondColonnesNb - 6) + 3);
    animerHexagone(0, debutColonneNb);

}

animationFondAccueil();

// Créer une carte HTML pour un serveur
function creerCarteServeur(serv) {

    const card = document.createElement('div');
    card.id = 'carteServeur_' + serv.id;
    card.classList.add('card', 'server-card', 'actif');

    // Corps de la card
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    const cardTitle = document.createElement('h5');
    cardTitle.classList.add('cart-title');
    cardTitle.innerText = 'Partie par ' + serv.joueur1.username;
    const cardText = document.createElement('p');
    cardText.classList.add('card-text');
    cardText.id = 'carteTexteServeur_' + serv.id;

    // Embriquer les éléments
    cardBody.appendChild(cardTitle);
    cardBody.appendChild(cardText);
    card.appendChild(cardBody);

    // Remplir les informations
    modifierCarteServeur(serv, card, cardText);

    listeServeurs.appendChild(card);

}

// Modifier la carte HTML d'un serveur
function modifierCarteServeur(serv, card = null, cardText = null) {
    if (!card) card = document.getElementById('carteServeur_' + serv.id);
    if (!card) card = document.getElementById('carteTextServeur_' + serv.id);
    if(serv.joueur2 === null) {
        card.classList.add('border-primary', 'attente');
        cardText.innerText = '1/2 joueurs. Cliquez pour rejoindre.'
    } else {
        card.classList.remove('border-primary', 'attente');
        card.classList.add('complet');
        cardText.innerText = 'Partie en cours. ' + serv.spectateurs.length + ' spectateurs.';
    }
}

demanderListeServeurs(afficherListeServeurs);

// Créer un serveur
const createServerBtn = document.getElementById('createServerBtn');
createServerBtn.addEventListener('click', () => {
    creerServeur(() => {
        console.log('WAOUW!');
    })
});
