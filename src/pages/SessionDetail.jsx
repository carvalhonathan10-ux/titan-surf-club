import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, Trash2, UserPlus, FileDown } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { exportListePresencePDF } from '../lib/pdf'

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [reservations, setReservations] = useState([])
  const [allAdherents, setAllAdherents] = useState([])
  const [selectedToAdd, setSelectedToAdd] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const [{ data: s }, { data: res }, { data: adh }] = await Promise.all([
      supabase.from('sessions_surf').select('*').eq('id', id).single(),
      supabase.from('reservations').select('id, present, adherent_id, adherents(nom, prenom)').eq('session_id', id),
      supabase.from('adherents').select('id, nom, prenom').eq('actif', true).order('nom'),
    ])
    setSession(s)
    setReservations((res || []).sort((a, b) => (a.adherents?.nom || '').localeCompare(b.adherents?.nom || '')))
    setAllAdherents(adh || [])
    setLoading(false)
  }

  async function updateSession(field, value) {
    setSession(s => ({ ...s, [field]: value }))
    await supabase.from('sessions_surf').update({ [field]: value }).eq('id', id)
  }

  async function togglePresent(resId, present) {
    setReservations(rs => rs.map(r => (r.id === resId ? { ...r, present } : r)))
    await supabase.from('reservations').update({ present }).eq('id', resId)
  }

  async function handleAddAdherent() {
    if (!selectedToAdd) return
    const { error } = await supabase.from('reservations').insert({ session_id: id, adherent_id: selectedToAdd })
    if (!error) { setSelectedToAdd(''); load() }
    else alert('Cet adhérent est déjà inscrit à cette séance.')
  }

  async function handleRemove(resId) {
    await supabase.from('reservations').delete().eq('id', resId)
    setReservations(rs => rs.filter(r => r.id !== resId))
  }

  async function handleDeleteSession() {
    if (!confirm('Supprimer cette séance et toutes ses réservations ?')) return
    await supabase.from('sessions_surf').delete().eq('id', id)
    navigate('/calendrier')
  }

  if (loading || !session) return <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>

  const availableToAdd = allAdherents.filter(a => !reservations.some(r => r.adherent_id === a.id))

  return (
    <div style={{ maxWidth: 760 }}>
      <button className="btn btn-ghost" onClick={() => navigate('/calendrier')} style={{ marginBottom: 12, paddingLeft: 0 }}>
        <ArrowLeft size={16} /> Retour au calendrier
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', textTransform: 'capitalize' }}>
            {format(parseISO(session.date), 'EEEE d MMMM yyyy', { locale: fr })}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{reservations.length} inscrit(s) · {reservations.filter(r => r.present).length} présent(s)</p>
        </div>
        <button className="btn btn-secondary" onClick={() => exportListePresencePDF(session, reservations)}>
          <FileDown size={16} /> Liste PDF
        </button>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <div className="field"><label>Date</label><input type="date" value={session.date} onChange={e => updateSession('date', e.target.value)} /></div>
        <div className="field"><label>Heure</label><input type="time" value={session.heure} onChange={e => updateSession('heure', e.target.value)} /></div>
        <div className="field"><label>Lieu</label><input value={session.lieu || ''} onChange={e => updateSession('lieu', e.target.value)} /></div>
        <div className="field" style={{ gridColumn: '1 / -1' }}><label>Encadrant(s)</label><input value={session.encadrants || ''} onChange={e => updateSession('encadrants', e.target.value)} placeholder="Noms des bénévoles encadrants" /></div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: 14 }}>Participants</h3>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <select value={selectedToAdd} onChange={e => setSelectedToAdd(e.target.value)} style={{ flex: 1, padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 8 }}>
            <option value="">Ajouter un adhérent...</option>
            {availableToAdd.map(a => <option key={a.id} value={a.id}>{a.nom} {a.prenom}</option>)}
          </select>
          <button className="btn btn-primary" onClick={handleAddAdherent}><UserPlus size={16} /> Inscrire</button>
        </div>

        {reservations.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucun inscrit pour cette séance.</p>}
        {reservations.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 4px', borderBottom: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
              <input type="checkbox" checked={!!r.present} onChange={e => togglePresent(r.id, e.target.checked)} />
              {r.adherents?.nom} {r.adherents?.prenom}
              <span className={`badge ${r.present ? 'badge-vert' : 'badge-neutral'}`}>{r.present ? 'Présent' : 'À pointer'}</span>
            </label>
            <button className="btn btn-ghost" onClick={() => handleRemove(r.id)}><Trash2 size={15} color="var(--rouge)" /></button>
          </div>
        ))}
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 12 }}>
          Seules les présences cochées décomptent une séance du carnet de l'adhérent. Une absence n'est jamais pénalisée.
        </p>
      </div>

      <button className="btn btn-danger" onClick={handleDeleteSession} style={{ marginTop: 20 }}>
        <Trash2 size={16} /> Supprimer cette séance
      </button>
    </div>
  )
}
