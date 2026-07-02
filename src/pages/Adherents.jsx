import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import StatutBadge from '../components/StatutBadge'
import { Plus, Search } from 'lucide-react'

export default function Adherents() {
  const [adherents, setAdherents] = useState([])
  const [stats, setStats] = useState({})
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: a }, { data: s }] = await Promise.all([
      supabase.from('adherents').select('*').order('nom'),
      supabase.from('v_adherents_stats').select('*'),
    ])
    setAdherents(a || [])
    setStats(Object.fromEntries((s || []).map(x => [x.adherent_id, x])))
    setLoading(false)
  }

  async function handleAdd() {
    const { data, error } = await supabase
      .from('adherents')
      .insert({ nom: 'Nouvel', prenom: 'Adhérent' })
      .select()
      .single()
    if (!error) navigate(`/adherents/${data.id}`)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return adherents
    return adherents.filter(a =>
      `${a.nom} ${a.prenom} ${a.email || ''}`.toLowerCase().includes(q)
    )
  }, [adherents, query])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem' }}>Adhérents</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>{adherents.length} adhérent(s) enregistré(s)</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}><Plus size={16} /> Ajouter un adhérent</button>
      </div>

      <div className="card" style={{ padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, maxWidth: 360 }}>
        <Search size={16} color="var(--text-muted)" />
        <input
          placeholder="Rechercher par nom, prénom, email..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ border: 'none', outline: 'none', flex: 1, background: 'transparent' }}
        />
      </div>

      <div className="card scroll-x">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Contact</th>
              <th>Licence</th>
              <th>Droit à l'image</th>
              <th>Séances restantes</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ color: 'var(--text-muted)' }}>Chargement...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--text-muted)' }}>Aucun adhérent trouvé.</td></tr>}
            {filtered.map(a => {
              const st = stats[a.id]
              return (
                <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/adherents/${a.id}`)}>
                  <td style={{ fontWeight: 700, color: 'var(--marine)' }}>{a.nom} {a.prenom}</td>
                  <td>
                    <div>{a.email || '—'}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{a.telephone || ''}</div>
                  </td>
                  <td>{a.licence ? '✅' : '—'}</td>
                  <td>{a.droit_image ? '✅' : '—'}</td>
                  <td><StatutBadge seances={st?.seances_restantes} /></td>
                  <td>
                    {a.actif
                      ? <span className="badge badge-vert">Actif</span>
                      : <span className="badge badge-neutral">Inactif</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
