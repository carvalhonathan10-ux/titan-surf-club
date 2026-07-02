import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Adherents from './pages/Adherents'
import AdherentDetail from './pages/AdherentDetail'
import Benevoles from './pages/Benevoles'
import Calendrier from './pages/Calendrier'
import SessionDetail from './pages/SessionDetail'
import Reglements from './pages/Reglements'

function PrivateArea({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--petrole)' }}>
        Chargement...
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateArea session={session}><Dashboard /></PrivateArea>} />
      <Route path="/adherents" element={<PrivateArea session={session}><Adherents /></PrivateArea>} />
      <Route path="/adherents/:id" element={<PrivateArea session={session}><AdherentDetail /></PrivateArea>} />
      <Route path="/benevoles" element={<PrivateArea session={session}><Benevoles /></PrivateArea>} />
      <Route path="/calendrier" element={<PrivateArea session={session}><Calendrier /></PrivateArea>} />
      <Route path="/calendrier/:id" element={<PrivateArea session={session}><SessionDetail /></PrivateArea>} />
      <Route path="/reglements" element={<PrivateArea session={session}><Reglements /></PrivateArea>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
