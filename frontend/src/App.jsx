import { useState, useEffect } from 'react'
import { Amplify } from 'aws-amplify'
import { getCurrentUser, signOut } from 'aws-amplify/auth'
import Login from './Login'
import DepartmentRoles from './DepartmentRoles'
import UserManagement from './UserManagement'
import './App.css'

// Configure Amplify - will auto-detect sandbox backend
try {
  Amplify.configure({
    Auth: {
      Cognito: {
        region: 'us-east-1',
        userPoolId: import.meta.env.VITE_USER_POOL_ID || undefined,
        userPoolClientId: import.meta.env.VITE_CLIENT_ID || undefined,
      }
    }
  })
} catch (err) {
  console.warn('Amplify config warning:', err.message)
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('Overview')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (err) {
      console.log('User not logged in')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return <Login onLoginSuccess={checkUser} />
  }

  const dashboardItems = [
    'Overview',
    'Job Order Management',
    'Payment & Invoice',
    'Exit Permit',
    'Inspection',
    'Service Execution',
    'Delivery Quality Check',
    'Job Order History',
    'Services Approvals',
    'Customers Management',
    'Vehicles Management',
    'Sales Lead Management',
    'Purchases',
    'Inventory',
    'Reports',
    'Human Resource',
    'My Request',
    'Accountant',
    'Service Creation',
    'Department & Roles',
    'User Role Access',
    'Dashboard User Management',
    'User Profile Management',
    'Inspection List',
    'Quality Check List',
  ]

  const renderContent = () => {
    if (activeSection === 'Department & Roles') {
      return <DepartmentRoles />
    }

    if (activeSection === 'Dashboard User Management') {
      return <UserManagement />
    }

    return (
      <section className="dashboard-section">
        <h2>{activeSection}</h2>
        <p>Select a section from the left to get started.</p>
      </section>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Rodeo Drive CRM</h1>
        <div className="user-info">
          <span>Welcome, {user.username}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>
      <div className="dashboard-body">
        <aside className="sidebar">
          <h2 className="sidebar-title">Dashboard</h2>
          <nav className="sidebar-nav">
            {dashboardItems.map((item) => (
              <button
                key={item}
                className={`nav-item ${activeSection === item ? 'active' : ''}`}
                onClick={() => setActiveSection(item)}
              >
                {item}
              </button>
            ))}
          </nav>
          <button onClick={handleLogout} className="nav-item logout-item">
            Logout
          </button>
        </aside>
        <main className="dashboard-main">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default App
