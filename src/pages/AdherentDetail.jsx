import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, Save, Trash2, FileDown } from 'lucide-react'
import StatutBadge from '../components/StatutBadge'
import { exportFicheAdherentPDF } from '../lib/pdf'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const EMPTY = {
  nom: '', prenom: '', sexe: '', date_naissance: '', email: '', adresse: '',
  telephone: '', contact_nom: '', pathologie: '', droit_image: false, licence: false,
  actif: true, notes: ''
}

export default function AdherentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [stat, setStat] = useState(null)
  const [historique, setHistorique] = useState([])
  const [achats, setAchats] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const [{ data: a }, { data: s }, { data: res }, { data: ach }] = await Promise.all([
      supabase.from('adherents').select('*').eq('id', id).single(),
      supabase.from('v_adherents_stats').select('*').eq('adherent_id', id).single(),
      supabase.from('reservations').select('id, present, sessions_surf(date, heure)').eq('adherent_id', id),
      supabase.from('achats').select('*').eq('adherent_id', id).order('date_paiement', { ascending: false }),
    ])
    if (a) setForm(a)
    setStat(s || null)
    setHistorique(
      (res || [])
        .filter(r => r.sessions_surf)
        .sort((x, y) => (x.sessions_surf.date < y.sessions_surf.date ? 1 : -1))
    )
    setAchats(ach || [])
    setLoading(false)
  }

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const { id: _id, ...payload } = form
    const { error } = await supabase.from('adherents').update(payload).eq('id', id)
    setSaving(false)
    if (error) alert("Erreur lors de l'enregistrement : " + error.message)
  }

  async function handleDelete() {
    if (!confirm(`Supprimer définitivement ${form.prenom} ${form.nom} ? Cette action est irréversible.`)) return
    const { error } = await supabase.from('adherents').delete().eq('id', id)
    if (!error) navigate('/adherents')
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>

  return (
    <div style={{ maxWidth: 920 }}>
      <button className="btn btn-ghost" onClick={() => navigate('/adherents')} style={{ marginBottom: 12, paddingLeft: 0 }}>
        <ArrowLeft size={16} /> Retour aux adhérents
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem' }}>{form.prenom} {form.nom}</h1>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatutBadge seances={stat?.seances_restantes} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {stat?.seances_realisees ?? 0} séance(s) réalisée(s) au total
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => exportFicheAdherentPDF(form, stat, historique, achats)}>
            <FileDown size={16} /> Fiche PDF
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>Identité</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field"><label>Nom</label><input value={form.nom || ''} onChange={e => update('nom', e.target.value)} /></div>
            <div className="field"><label>Prénom</label><input value={form.prenom || ''} onChange={e => update('prenom', e.target.value)} /></div>
            <div className="field">
              <label>Sexe</label>
              <select value={form.sexe || ''} onChange={e => update('sexe', e.target.value)}>
                <option value="">—</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div className="field"><label>Date de naissance</label><input type="date" value={form.date_naissance || ''} onChange={e => update('date_naissance', e.target.value)} /></div>
          </div>
          <div className="field"><label>Pathologie / situation</label><textarea rows={2} value={form.pathologie || ''} onChange={e => update('pathologie', e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem' }}>
              <input type="checkbox" checked={!!form.licence} onChange={e => update('licence', e.target.checked)} /> Licence
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem' }}>
              <input type="checkbox" checked={!!form.droit_image} onChange={e => update('droit_image', e.target.checked)} /> Droit à l'image
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem' }}>
              <input type="checkbox" checked={!!form.actif} onChange={e => update('actif', e.target.checked)} /> Actif
            </label>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>Contact</h3>
          <div className="field"><label>Email</label><input type="email" value={form.email || ''} onChange={e => update('email', e.target.value)} /></div>
          <div className="field"><label>Téléphone</label><input value={form.telephone || ''} onChange={e => update('telephone', e.target.value)} /></div>
          <div className="field"><label>Contact (parent / aidant)</label><input value={form.contact_nom || ''} onChange={e => update('contact_nom', e.target.value)} /></div>
          <div className="field"><label>Adresse</label><textarea rows={2} value={form.adresse || ''} onChange={e => update('adresse', e.target.value)} /></div>
        </div>
      </div>

      <div className="field" style={{ marginTop: 20 }}>
        <label>Notes internes</label>
        <textarea rows={2} value={form.notes || ''} onChange={e => update('notes', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>Historique des séances</h3>
          {historique.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucune réservation enregistrée.</p>}
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {historique.map(h => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '0.86rem' }}>
                <span>{format(parseISO(h.sessions_surf.date), 'd MMM yyyy', { locale: fr })} · {h.sessions_surf.heure?.slice(0, 5)}</span>
                <span className={`badge ${h.present ? 'badge-vert' : 'badge-neutral'}`}>{h.present ? 'Présent' : 'Absent'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>Paiements</h3>
          {achats.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucun paiement enregistré.</p>}
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {achats.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '0.86rem' }}>
                <span>{a.type === 'licence' ? 'Licence' : a.type === 'carnet_10' ? 'Carnet 10 séances' : 'Séance unique'} · {a.montant} €</span>
                <span className={`badge ${a.statut === 'Payé' ? 'badge-vert' : 'badge-ambre'}`}>{a.statut}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="btn btn-danger" onClick={handleDelete} style={{ marginTop: 24 }}>
        <Trash2 size={16} /> Supprimer cet adhérent
      </button>
    </div>
  )
}
