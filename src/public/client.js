
// Demander le nom d'utilisateur
const usernameModal = new bootstrap.Modal(document.getElementById('promptUsernameModal'), { backdrop: 'static' });
usernameModal.show();

const submitUsernameBtn = document.getElementById('submitUsername');
const usernameInput = document.getElementById('usernameInput');

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
