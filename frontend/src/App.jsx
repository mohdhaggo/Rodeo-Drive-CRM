import { useState, useEffect } from 'react'
import { Amplify } from 'aws-amplify'
import { getCurrentUser, signOut } from 'aws-amplify/auth'
import amplifyOutputs from '../../amplify_outputs.json'
import Login from './Login'
import DepartmentRoles from './DepartmentRoles'
import UserManagement from './UserManagement'
import JobOrderManagement from './JobOrderManagement'
import PaymentInvoiceManagement from './PaymentInvoiceManagement'
import ExitPermitManagement from './ExitPermitManagement'
import InspectionModule from './InspectionModule'
import JobOrderHistory from './JobOrderHistory'
import CustomerManagement from './CustomerManagement'
import VehicleManagement from './VehicleManagement'
import SalesLeadManagement from './SalesLeadManagement'
import SalesLeadHistory from './SalesLeadHistory'
import SalesApprovals from './SalesApprovals'
import ServiceApprovalHistory from './ServiceApprovalHistory'
import ServiceExecutionModule from './ServiceExecutionModule'
import './App.css'

// Configure Amplify using generated outputs
try {
  Amplify.configure(amplifyOutputs)
} catch (err) {
  console.warn('Amplify config warning:', err.message)
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('Overview')
  const [navigationData, setNavigationData] = useState(null)
  const [returnToCustomerId, setReturnToCustomerId] = useState(null)

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

  const handleNavigate = (section, data = null) => {
    setActiveSection(section)
    setNavigationData(data)
    if (section !== 'Customers Management') {
      setReturnToCustomerId(null)
    }
  }

  const handleClearNavigation = () => {
    setNavigationData(null)
  }

  const handleNavigateBack = (section, returnId = null) => {
    setActiveSection(section)
    if (section === 'Customers Management') {
      setReturnToCustomerId(returnId)
      setNavigationData(null)
      return
    }
    if (section === 'Vehicles Management' && returnId) {
      setNavigationData({ openDetails: true, vehicleId: returnId })
      return
    }
    setNavigationData(null)
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
    'Sales Lead History',
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
    'Service Approval History',
  ]

  const renderContent = () => {
    if (activeSection === 'Job Order Management') {
      return (
        <JobOrderManagement
          navigationData={navigationData}
          onClearNavigation={handleClearNavigation}
          onNavigateBack={handleNavigateBack}
        />
      )
    }

    if (activeSection === 'Payment & Invoice') {
      return <PaymentInvoiceManagement />
    }

    if (activeSection === 'Exit Permit') {
      return <ExitPermitManagement />
    }

    if (activeSection === 'Inspection') {
      return <InspectionModule />
    }

    if (activeSection === 'Service Execution') {
      return <ServiceExecutionModule />
    }

    if (activeSection === 'Job Order History') {
      return (
        <JobOrderHistory
          navigationData={navigationData}
          onClearNavigation={handleClearNavigation}
          onNavigateBack={handleNavigateBack}
        />
      )
    }

    if (activeSection === 'Services Approvals') {
      return <SalesApprovals />
    }

    if (activeSection === 'Service Approval History') {
      return <ServiceApprovalHistory />
    }

    if (activeSection === 'Customers Management') {
      return (
        <CustomerManagement
          onNavigate={handleNavigate}
          returnToCustomer={returnToCustomerId}
        />
      )
    }

    if (activeSection === 'Vehicles Management') {
      return (
        <VehicleManagement
          navigationData={navigationData}
          onClearNavigation={handleClearNavigation}
          onNavigateBack={handleNavigateBack}
          onNavigate={handleNavigate}
        />
      )
    }

    if (activeSection === 'Sales Lead Management') {
      return <SalesLeadManagement />
    }

    if (activeSection === 'Sales Lead History') {
      return <SalesLeadHistory />
    }

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
                onClick={() => {
                  setActiveSection(item)
                  setNavigationData(null)
                  if (item !== 'Customers Management') {
                    setReturnToCustomerId(null)
                  }
                }}
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
