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
};
const TYPE_DEFAULT_MONTANT = { seance_unique: 20, carnet_10: 120, licence: 280 };
const TYPE_DEFAULT_SEANCES = { seance_unique: 1, carnet_10: 10, licence: 0 };

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c === null || c === undefined) return;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}

function initNav(active) {
  const bar = document.getElementById('navbar');
  if (!bar) return;
  bar.innerHTML = `
    <div class="nav-inner">
      <a href="index.html" class="nav-brand">
        <span class="nav-logo">T</span> TITAN SURF CLUB
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
