import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths,
  isSameMonth, isSameDay, format,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

export default function Calendrier() {
  const [cursor, setCursor] = useState(new Date())
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { load() }, [cursor])

  async function load() {
    setLoading(true)
    const from = format(startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const to = format(endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('sessions_surf')
      .select('id, date, heure, lieu, reservations(id)')
      .gte('date', from).lte('date', to)
      .order('heure')
    setSessions(data || [])
    setLoading(false)
  }

  async function handleAddSession() {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data, error } = await supabase
      .from('sessions_surf')
      .insert({ date: today, heure: '09:30', lieu: 'Saint-Leu' })
      .select().single()
    if (!error) navigate(`/calendrier/${data.id}`)
  }

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    const arr = []
    let d = start
    while (d <= end) { arr.push(d); d = addDays(d, 1) }
    return arr
  }, [cursor])

  const sessionsByDay = useMemo(() => {
    const map = {}
    for (const s of sessions) {
      map[s.date] = map[s.date] || []
      map[s.date].push(s)
    }
    return map
  }, [sessions])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem' }}>Calendrier des séances</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>Mercredis & samedis, 9h–15h, Saint-Leu</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddSession}><Plus size={16} /> Nouvelle séance</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <button className="btn btn-secondary" onClick={() => setCursor(c => addMonths(c, -1))}><ChevronLeft size={16} /></button>
        <h3 style={{ fontSize: '1.05rem', minWidth: 180, textTransform: 'capitalize' }}>{format(cursor, 'MMMM yyyy', { locale: fr })}</h3>
        <button className="btn btn-secondary" onClick={() => setCursor(c => addMonths(c, 1))}><ChevronRight size={16} /></button>
        <button className="btn btn-ghost" onClick={() => setCursor(new Date())}>Aujourd'hui</button>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {days.map(d => {
            const key = format(d, 'yyyy-MM-dd')
            const daySessions = sessionsByDay[key] || []
            const inMonth = isSameMonth(d, cursor)
            const today = isSameDay(d, new Date())
            return (
              <div key={key} style={{
                minHeight: 88, borderRadius: 8, padding: 6,
                background: inMonth ? 'var(--white)' : 'transparent',
                border: today ? '2px solid var(--orange)' : '1px solid var(--border)',
                opacity: inMonth ? 1 : 0.4,
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--petrole)', marginBottom: 4 }}>{format(d, 'd')}</div>
                {daySessions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/calendrier/${s.id}`)}
                    style={{
                      background: 'var(--bleu-doux)', color: 'white', borderRadius: 6,
                      padding: '3px 6px', fontSize: '0.72rem', marginBottom: 3, cursor: 'pointer'
                    }}
                  >
                    {s.heure?.slice(0, 5)} · {s.reservations?.length || 0} insc.
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
      {loading && <p style={{ color: 'var(--text-muted)', marginTop: 10 }}>Chargement...</p>}
    </div>
  )
}
