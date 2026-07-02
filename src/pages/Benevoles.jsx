import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Trash2 } from 'lucide-react'

export default function Benevoles() {
  const [benevoles, setBenevoles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('benevoles').select('*').order('prenom')
    setBenevoles(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    const { data, error } = await supabase.from('benevoles').insert({ prenom: 'Nouveau bénévole' }).select().single()
    if (!error) setBenevoles(b => [...b, data])
  }

  async function updateField(id, field, value) {
    setBenevoles(bs => bs.map(b => (b.id === id ? { ...b, [field]: value } : b)))
    await supabase.from('benevoles').update({ [field]: value }).eq('id', id)
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce bénévole ?')) return
    await supabase.from('benevoles').delete().eq('id', id)
    setBenevoles(bs => bs.filter(b => b.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem' }}>Bénévoles</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>{benevoles.length} bénévole(s)</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}><Plus size={16} /> Ajouter un bénévole</button>
      </div>

      <div className="card scroll-x">
        <table>
          <thead>
            <tr>
              <th>Prénom</th>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Licence</th>
              <th>Droit à l'image</th>
              <th>Actif</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ color: 'var(--text-muted)' }}>Chargement...</td></tr>}
            {benevoles.map(b => (
              <tr key={b.id}>
                <td><input defaultValue={b.prenom || ''} onBlur={e => updateField(b.id, 'prenom', e.target.value)} style={{ border: 'none', background: 'transparent', width: '100%' }} /></td>
                <td><input defaultValue={b.nom || ''} onBlur={e => updateField(b.id, 'nom', e.target.value)} style={{ border: 'none', background: 'transparent', width: '100%' }} /></td>
                <td><input defaultValue={b.telephone || ''} onBlur={e => updateField(b.id, 'telephone', e.target.value)} style={{ border: 'none', background: 'transparent', width: '100%' }} /></td>
                <td><input type="checkbox" checked={!!b.licence} onChange={e => updateField(b.id, 'licence', e.target.checked)} /></td>
                <td><input type="checkbox" checked={!!b.droit_image} onChange={e => updateField(b.id, 'droit_image', e.target.checked)} /></td>
                <td><input type="checkbox" checked={!!b.actif} onChange={e => updateField(b.id, 'actif', e.target.checked)} /></td>
                <td>
                  <button className="btn btn-ghost" onClick={() => handleDelete(b.id)}><Trash2 size={15} color="var(--rouge)" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 10 }}>
        Les modifications sont enregistrées automatiquement quand vous quittez un champ.
      </p>
    </div>
  )
}
