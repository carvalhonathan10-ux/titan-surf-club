import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, HeartHandshake, CalendarDays, Wallet, LogOut, Waves } from 'lucide-react'
import { supabase } from '../supabaseClient'

const NAV = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/adherents', label: 'Adhérents', icon: Users },
  { to: '/benevoles', label: 'Bénévoles', icon: HeartHandshake },
  { to: '/calendrier', label: 'Calendrier', icon: CalendarDays },
  { to: '/reglements', label: 'Règlements', icon: Wallet },
]

export default function Layout({ children }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 232, background: 'var(--marine)', color: 'white',
        display: 'flex', flexDirection: 'column', padding: '20px 14px', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 24px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: 'var(--orange)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Waves size={18} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.1 }}>TITAN</div>
            <div style={{ fontSize: '0.68rem', opacity: 0.75, letterSpacing: '0.03em' }}>SURF CLUB</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                fontSize: '0.88rem', fontWeight: 600,
                color: isActive ? 'var(--marine)' : 'rgba(255,255,255,0.85)',
                background: isActive ? 'var(--sable)' : 'transparent',
                textDecoration: 'none'
              })}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button onClick={handleLogout} className="btn" style={{
          color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.08)',
          justifyContent: 'flex-start', marginTop: 12
        }}>
          <LogOut size={16} /> Déconnexion
        </button>
      </aside>

      <main style={{ flex: 1, padding: '28px 36px', maxWidth: '100%', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
