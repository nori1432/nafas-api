import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './store/auth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Hospitals from './pages/Hospitals'
import Users from './pages/Users'
import BedManagement from './pages/BedManagement'
import Appointments from './pages/Appointments'
import Maintenance from './pages/Maintenance'
import Donations from './pages/Donations'
import Community from './pages/Community'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Subscriptions from './pages/Subscriptions'
import Companies from './pages/Companies'
import Accounts from './pages/Accounts'
import Reviews from './pages/Reviews'
import HospDashboard from './pages/HospDashboard'
import Staff from './pages/Staff'
import HospNeeds from './pages/HospNeeds'
import CompanyDashboard from './pages/CompanyDashboard'
import CompanyProfile from './pages/CompanyProfile'
import BrowseNeeds from './pages/BrowseNeeds'
import MyOffers from './pages/MyOffers'

import Subscribe from './pages/Subscribe'
import About from './pages/About'

function Protected({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth()
  if (!hydrated) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicHome() {
  const { user, hydrated } = useAuth()
  if (!hydrated) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <Landing />
}

function RoleDashboard() {
  const { user } = useAuth()
  if (user?.role === 'hospital_admin') return <HospDashboard />
  if (user?.role === 'maintenance_company') return <CompanyDashboard />
  return <Dashboard />
}

export default function App() {
  const hydrate = useAuth((s) => s.hydrate)
  useEffect(() => { hydrate() }, [hydrate])

  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/subscribe" element={<Subscribe />} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/dashboard" element={<RoleDashboard />} />
        {/* National admin */}
        <Route path="/hospitals" element={<Hospitals />} />
        <Route path="/users" element={<Users />} />
        <Route path="/beds" element={<BedManagement />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/donations" element={<Donations />} />
        <Route path="/community" element={<Community />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/reviews" element={<Reviews />} />
        {/* Hospital admin */}
        <Route path="/staff" element={<Staff />} />
        <Route path="/equipment" element={<BedManagement />} />
        <Route path="/needs" element={<HospNeeds />} />
        {/* Maintenance company */}
        <Route path="/profile" element={<CompanyProfile />} />
        <Route path="/browse-needs" element={<BrowseNeeds />} />
        <Route path="/my-offers" element={<MyOffers />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
