// Fonctions partagées par toutes les pages

async function requireAuth() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    window.location.href = 'login.html';
    return null;
  }
  return data.session;
}

async function logout() {
  await sb.auth.signOut();
  window.location.href = 'login.html';
}

function statutSeances(n) {
  if (n === null || n === undefined) return { cls: 'badge-neutral', label: '—' };
  if (n <= 0) return { cls: 'badge-rouge', label: `${n} séance${n === 1 || n === -1 ? '' : 's'}` };
  if (n <= 3) return { cls: 'badge-ambre', label: `${n} séances` };
  return { cls: 'badge-vert', label: `${n} séances` };
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TYPE_LABEL = {
  seance_unique: 'Séance unique',
  carnet_10: 'Carnet 10 séances',
  licence: 'Licence annuelle (280€)',
  exception: 'Exception (tarif libre)',
};
const TYPE_DEFAULT_MONTANT = { seance_unique: 20, carnet_10: 120, licence: 280, exception: 0 };
const TYPE_DEFAULT_SEANCES = { seance_unique: 1, carnet_10: 10, licence: 0, exception: 1 };
const MODES_PAIEMENT = ['Espèces', 'Chèque', 'Virement', 'Carte bancaire', 'Passeport'];
const LICENCE_DUREE_JOURS = 365;

// La "licence annuelle" (280€) donne un accès illimité aux séances pendant
// 365 jours à partir de la date de paiement — elle ne décompte jamais de
// séances. On calcule ici si l'adhérent a une licence encore active, et
// jusqu'à quand.
function licenceAnnuelleActive(achatsAdherent) {
  const licences = (achatsAdherent || []).filter(
    a => a.type === 'licence' && a.statut === 'Payé' && a.date_paiement
  );
  if (licences.length === 0) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let latestExpiry = null;
  licences.forEach(a => {
    const start = new Date(a.date_paiement + 'T00:00:00');
    const expiry = new Date(start);
    expiry.setDate(expiry.getDate() + LICENCE_DUREE_JOURS);
    if (expiry >= today && (!latestExpiry || expiry > latestExpiry)) latestExpiry = expiry;
  });
  return latestExpiry; // Date si active, sinon null
}

function fmtDateObj(d) {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function initNav(active) {
  const bar = document.getElementById('navbar');
  if (!bar) return;
  bar.innerHTML = `
    <div class="nav-inner">
      <a href="index.html" class="nav-brand">
        <img src="logo.png" alt="Logo Titan Surf Club" class="nav-logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';">
        <span class="nav-logo" style="display:none;">T</span> TITAN SURF CLUB
      </a>
      <div class="nav-links">
        <a href="index.html" class="${active === 'accueil' ? 'active' : ''}">Adhérents</a>
        <a href="calendrier.html" class="${active === 'calendrier' ? 'active' : ''}">Réservations</a>
        <a href="benevoles.html" class="${active === 'benevoles' ? 'active' : ''}">Bénévoles</a>
        <button class="btn btn-ghost" id="logoutBtn">Déconnexion</button>
      </div>
    </div>`;
  document.getElementById('logoutBtn').addEventListener('click', logout);
}
