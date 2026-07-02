import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Trash2, FileDown } from 'lucide-react'
import { exportBilanFinancierPDF } from '../lib/pdf'

const TYPE_LABEL = { seance_unique: 'Séance unique', carnet_10: 'Carnet 10 séances', licence: 'Licence' }
const TYPE_DEFAULTS = { seance_unique: { montant: 20, nb_seances: 1 }, carnet_10: { montant: 120, nb_seances: 10 }, licence: { montant: 280, nb_seances: 0 } }

export default function Reglements() {
  const [achats, setAchats] = useState([])
  const [adherents, setAdherents] = useState([])
  const [filtre, setFiltre] = useState('Tous')
  const [loading, setLoading] = useState(true)
  const [newAdherent, setNewAdherent] = useState('')
  const [newType, setNewType] = useState('carnet_10')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: a }, { data: adh }] = await Promise.all([
      supabase.from('achats').select('*, adherents(nom, prenom)').order('created_at', { ascending: false }),
      supabase.from('adherents').select('id, nom, prenom').eq('actif', true).order('nom'),
    ])
    setAchats(a || [])
    setAdherents(adh || [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!newAdherent) return
    const defaults = TYPE_DEFAULTS[newType]
    const { error } = await supabase.from('achats').insert({
      adherent_id: newAdherent, type: newType, montant: defaults.montant,
      nb_seances: defaults.nb_seances, statut: 'En attente',
    })
    if (!error) { setNewAdherent(''); load() }
  }

  async function updateField(id, field, value) {
    setAchats(as => as.map(a => (a.id === id ? { ...a, [field]: value } : a)))
    await supabase.from('achats').update({ [field]: value }).eq('id', id)
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce règlement ?')) return
    await supabase.from('achats').delete().eq('id', id)
    setAchats(as => as.filter(a => a.id !== id))
  }

  const filtered = useMemo(() => {
    if (filtre === 'Tous') return achats
    return achats.filter(a => a.statut === filtre)
  }, [achats, filtre])

  const totals = useMemo(() => {
    const paye = achats.filter(a => a.statut === 'Payé')
    return {
      ca: paye.reduce((s, a) => s + Number(a.montant || 0), 0),
      enAttente: achats.filter(a => a.statut === 'En attente').length,
    }
  }, [achats])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem' }}>Règlements</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>
            {totals.ca.toFixed(0)} € encaissés · {totals.enAttente} en attente
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => exportBilanFinancierPDF(achats)}>
          <FileDown size={16} /> Bilan PDF
        </button>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field" style={{ marginBottom: 0, minWidth: 200 }}>
          <label>Adhérent</label>
          <select value={newAdherent} onChange={e => setNewAdherent(e.target.value)}>
            <option value="">Sélectionner...</option>
            {adherents.map(a => <option key={a.id} value={a.id}>{a.nom} {a.prenom}</option>)}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Type</label>
          <select value={newType} onChange={e => setNewType(e.target.value)}>
            <option value="seance_unique">Séance unique — 20 €</option>
            <option value="carnet_10">Carnet 10 séances — 120 €</option>
            <option value="licence">Licence — 280 €</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}><Plus size={16} /> Ajouter un règlement</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['Tous', 'Payé', 'En attente'].map(f => (
          <button key={f} onClick={() => setFiltre(f)} className={f === filtre ? 'btn btn-primary' : 'btn btn-secondary'}>{f}</button>
        ))}
      </div>

      <div className="card scroll-x">
        <table>
          <thead>
            <tr>
              <th>Adhérent</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Mode</th>
              <th>Date</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ color: 'var(--text-muted)' }}>Chargement...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={7} style={{ color: 'var(--text-muted)' }}>Aucun règlement.</td></tr>}
            {filtered.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>{a.adherents?.nom} {a.adherents?.prenom}</td>
                <td>{TYPE_LABEL[a.type]}</td>
                <td>
                  <input type="number" defaultValue={a.montant} onBlur={e => updateField(a.id, 'montant', parseFloat(e.target.value) || 0)}
                    style={{ width: 70, border: 'none', background: 'transparent' }} /> €
                </td>
                <td>
                  <select defaultValue={a.mode_paiement || ''} onChange={e => updateField(a.id, 'mode_paiement', e.target.value)} style={{ border: 'none', background: 'transparent' }}>
                    <option value="">—</option>
                    <option>Espèces</option>
                    <option>Chèque</option>
                    <option>Virement</option>
                    <option>Carte bancaire</option>
                  </select>
                </td>
                <td>
                  <input type="date" defaultValue={a.date_paiement || ''} onBlur={e => updateField(a.id, 'date_paiement', e.target.value)}
                    style={{ border: 'none', background: 'transparent' }} />
                </td>
                <td>
                  <select
                    value={a.statut}
                    onChange={e => updateField(a.id, 'statut', e.target.value)}
                    className={`badge ${a.statut === 'Payé' ? 'badge-vert' : 'badge-ambre'}`}
                    style={{ border: 'none' }}
                  >
                    <option value="Payé">Payé</option>
                    <option value="En attente">En attente</option>
                  </select>
                </td>
                <td><button className="btn btn-ghost" onClick={() => handleDelete(a.id)}><Trash2 size={15} color="var(--rouge)" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
