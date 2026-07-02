import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Users, CalendarClock, TrendingUp, AlertTriangle, Waves, Euro } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: accent || 'var(--sable)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={19} color="var(--marine)" />
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--marine)', lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [upcoming, setUpcoming] = useState([])
  const [aRelancer, setARelancer] = useState([])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)

    const [{ data: adherents }, { data: vstats }, { data: achats }, { data: sessions }] = await Promise.all([
      supabase.from('adherents').select('id, nom, prenom, actif').eq('actif', true),
      supabase.from('v_adherents_stats').select('*'),
      supabase.from('achats').select('montant, statut').eq('statut', 'Payé'),
      supabase.from('sessions_surf').select('id, date, heure, lieu').gte('date', today).order('date').order('heure').limit(5),
    ])

    const statsById = Object.fromEntries((vstats || []).map(s => [s.adherent_id, s]))
    const activeIds = new Set((adherents || []).map(a => a.id))

    const seancesRestantesTotal = (vstats || [])
      .filter(s => activeIds.has(s.adherent_id))
      .reduce((sum, s) => sum + s.seances_restantes, 0)
    const seancesRealiseesTotal = (vstats || [])
      .filter(s => activeIds.has(s.adherent_id))
      .reduce((sum, s) => sum + s.seances_realisees, 0)
    const reservationsAvenir = (vstats || [])
      .filter(s => activeIds.has(s.adherent_id))
      .reduce((sum, s) => sum + s.reservations_a_venir, 0)
    const ca = (achats || []).reduce((sum, a) => sum + Number(a.montant || 0), 0)

    const relancer = (adherents || [])
      .map(a => ({ ...a, seances: statsById[a.id]?.seances_restantes ?? 0 }))
      .filter(a => a.seances <= 0)

    setStats({
      totalClients: (adherents || []).length,
      seancesRestantesTotal,
      seancesRealiseesTotal,
      reservationsAvenir,
      ca,
    })
    setARelancer(relancer)
    setUpcoming(sessions || [])
    setLoading(false)
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Chargement du tableau de bord...</p>

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Tableau de bord</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
        Île de La Réunion — Toute Incapacité Trouve Adaptation Nécessaire
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={Users} label="Adhérents actifs" value={stats.totalClients} />
        <StatCard icon={Waves} label="Séances restantes (total)" value={stats.seancesRestantesTotal} />
        <StatCard icon={TrendingUp} label="Séances réalisées (total)" value={stats.seancesRealiseesTotal} />
        <StatCard icon={CalendarClock} label="Réservations à venir" value={stats.reservationsAvenir} />
        <StatCard icon={AlertTriangle} label="À relancer (0 séance)" value={aRelancer.length} accent="var(--rouge-bg)" />
        <StatCard icon={Euro} label="Chiffre d'affaires encaissé" value={`${stats.ca.toFixed(0)} €`} accent="#FDEBD8" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Prochaines séances</h3>
          {upcoming.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Aucune séance à venir programmée.</p>}
          {upcoming.map(s => (
            <Link key={s.id} to={`/calendrier/${s.id}`} style={{
              display: 'flex', justifyContent: 'space-between', padding: '10px 4px',
              borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-main)'
            }}>
              <span style={{ fontWeight: 600 }}>
                {format(parseISO(s.date), 'EEEE d MMMM', { locale: fr })}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{s.heure?.slice(0, 5)} · {s.lieu}</span>
            </Link>
          ))}
          <Link to="/calendrier" className="btn btn-secondary" style={{ marginTop: 14 }}>Voir le calendrier</Link>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Adhérents à relancer</h3>
          {aRelancer.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Personne à relancer pour le moment 🎉</p>}
          {aRelancer.map(a => (
            <Link key={a.id} to={`/adherents/${a.id}`} style={{
              display: 'flex', justifyContent: 'space-between', padding: '10px 4px',
              borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-main)'
            }}>
              <span>{a.prenom} {a.nom}</span>
              <span className="badge badge-rouge">{a.seances} séance{a.seances === 1 ? '' : 's'}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
