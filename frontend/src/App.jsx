import { useState, useEffect } from 'react'
import { Amplify } from 'aws-amplify'
import amplifyOutputs from '../../amplify_outputs.json'
import { getCurrentUser as getSystemUser, clearCurrentUser } from './userService'
import { getRolePermissionsForUser, hasModuleAccess, hasOptionAccess } from './roleAccess'
import Login from './Login'
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
import QualityCheckModule from './QualityCheckModule'
import SystemUserManagement from './SystemUserManagement'
import DepartmentRoleManagement from './DepartmentRoleManagement'
import RoleAccessControl from './RoleAccessControl'
import Overview from './Overview'
import PurchaseModule from './PurchaseModule'
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
  const [rolePermissions, setRolePermissions] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (!user) {
      setRolePermissions(null)
      return
    }

    setRolePermissions(getRolePermissionsForUser(user))
  }, [user, activeSection])

  const checkUser = async () => {
    try {
      // Check if user is logged in via our user service
      const currentUser = getSystemUser()
      setUser(currentUser)
    } catch (err) {
      console.log('User not logged in')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser)
  }

  const handleLogout = async () => {
    try {
      clearCurrentUser()
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

  const dashboardItems = [
    { label: 'Overview', moduleId: 'overview', optionId: 'overview_access' },
    { label: 'Job Order Management', moduleId: 'joborder' },
    { label: 'Payment & Invoice', moduleId: 'payment' },
    { label: 'Exit Permit', moduleId: 'exitpermit' },
    { label: 'Inspection', moduleId: 'inspection' },
    { label: 'Service Execution', moduleId: 'serviceexec' },
    { label: 'Delivery Quality Check', moduleId: 'deliveryqc' },
    { label: 'Job Order History', moduleId: 'joborderhistory' },
    { label: 'Services Approvals', moduleId: 'system', optionId: 'system_serviceapproval' },
    { label: 'Customers Management', moduleId: 'customer' },
    { label: 'Vehicles Management', moduleId: 'vehicle' },
    { label: 'Sales Lead Management', moduleId: 'system', optionId: 'system_saleslead' },
    { label: 'Sales Lead History', moduleId: 'system', optionId: 'system_salesleadhistory' },
    { label: 'Purchases', moduleId: 'system', optionId: 'system_purchases' },
    { label: 'Inventory', moduleId: 'system', optionId: 'system_inventory' },
    { label: 'Reports', moduleId: 'system', optionId: 'system_reports' },
    { label: 'Human Resource', moduleId: 'system', optionId: 'system_hr' },
    { label: 'My Request', moduleId: 'system', optionId: 'system_myrequest' },
    { label: 'Accountant', moduleId: 'system', optionId: 'system_accountant' },
    { label: 'Service Creation', moduleId: 'system', optionId: 'system_servicecreation' },
    { label: 'User Role Access', moduleId: 'system', optionId: 'system_userrole' },
    { label: 'Department and Role Management', moduleId: 'system', optionId: 'system_departmentrole' },
    { label: 'System User Management', moduleId: 'system', optionId: 'system_systemuser' },
    { label: 'User Profile Management', moduleId: 'system', optionId: 'system_userprofile' },
    { label: 'Inspection List', moduleId: 'system', optionId: 'system_inspectionlist' },
    { label: 'Quality Check List', moduleId: 'deliveryqc' },
    { label: 'Service Approval History', moduleId: 'system', optionId: 'system_serviceapprovalhistory' },
  ]

  const visibleDashboardItems = dashboardItems.filter((item) =>
    item.optionId
      ? hasOptionAccess(rolePermissions, item.moduleId, item.optionId)
      : hasModuleAccess(rolePermissions, item.moduleId)
  )

  useEffect(() => {
    if (visibleDashboardItems.length === 0) {
      return
    }

    const hasActive = visibleDashboardItems.some((item) => item.label === activeSection)
    if (!hasActive) {
      setActiveSection(visibleDashboardItems[0].label)
    }
  }, [activeSection, visibleDashboardItems])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  const renderContent = () => {
    const isAllowed = (moduleId, optionId) =>
      optionId
        ? hasOptionAccess(rolePermissions, moduleId, optionId)
        : hasModuleAccess(rolePermissions, moduleId)

    const renderDenied = () => (
      <section className="dashboard-section">
        <h2>Access Restricted</h2>
        <p>Your role does not have permission to view this module.</p>
      </section>
    )

    if (!visibleDashboardItems.some((item) => item.label === activeSection)) {
      return renderDenied()
    }

    if (activeSection === 'Job Order Management') {
      if (!isAllowed('joborder')) {
        return renderDenied()
      }
      return (
        <JobOrderManagement
          currentUser={user}
          navigationData={navigationData}
          onClearNavigation={handleClearNavigation}
          onNavigateBack={handleNavigateBack}
        />
      )
    }

    if (activeSection === 'Overview') {
      if (!isAllowed('overview', 'overview_access')) {
        return renderDenied()
      }
      return <Overview onNavigate={handleNavigate} currentUser={user} />
    }

    if (activeSection === 'Payment & Invoice') {
      if (!isAllowed('payment')) {
        return renderDenied()
      }
      return <PaymentInvoiceManagement currentUser={user} />
    }

    if (activeSection === 'Exit Permit') {
      if (!isAllowed('exitpermit')) {
        return renderDenied()
      }
      return <ExitPermitManagement currentUser={user} />
    }

    if (activeSection === 'Inspection') {
      if (!isAllowed('inspection')) {
        return renderDenied()
      }
      return <InspectionModule currentUser={user} />
    }

    if (activeSection === 'Service Execution') {
      if (!isAllowed('serviceexec')) {
        return renderDenied()
      }
      return <ServiceExecutionModule currentUser={user} />
    }

    if (activeSection === 'Delivery Quality Check' || activeSection === 'Quality Check List') {
      if (!isAllowed('deliveryqc')) {
        return renderDenied()
      }
      return <QualityCheckModule currentUser={user} />
    }

    if (activeSection === 'Job Order History') {
      if (!isAllowed('joborderhistory')) {
        return renderDenied()
      }
      return (
        <JobOrderHistory
          currentUser={user}
          navigationData={navigationData}
          onClearNavigation={handleClearNavigation}
          onNavigateBack={handleNavigateBack}
        />
      )
    }

    if (activeSection === 'Services Approvals') {
      if (!isAllowed('system', 'system_serviceapproval')) {
        return renderDenied()
      }
      return <SalesApprovals />
    }

    if (activeSection === 'Service Approval History') {
      if (!isAllowed('system', 'system_serviceapprovalhistory')) {
        return renderDenied()
      }
      return <ServiceApprovalHistory />
    }

    if (activeSection === 'Customers Management') {
      if (!isAllowed('customer')) {
        return renderDenied()
      }
      return (
        <CustomerManagement
          onNavigate={handleNavigate}
          returnToCustomer={returnToCustomerId}
        />
      )
    }

    if (activeSection === 'Vehicles Management') {
      if (!isAllowed('vehicle')) {
        return renderDenied()
      }
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
      if (!isAllowed('system', 'system_saleslead')) {
        return renderDenied()
      }
      return <SalesLeadManagement />
    }

    if (activeSection === 'Sales Lead History') {
      if (!isAllowed('system', 'system_salesleadhistory')) {
        return renderDenied()
      }
      return <SalesLeadHistory />
    }

    if (activeSection === 'Purchases') {
      if (!isAllowed('system', 'system_purchases')) {
        return renderDenied()
      }
      return <PurchaseModule currentUser={user} />
    }

    if (activeSection === 'System User Management') {
      if (!isAllowed('system', 'system_systemuser')) {
        return renderDenied()
      }
      return <SystemUserManagement />
    }

    if (activeSection === 'Department and Role Management') {
      if (!isAllowed('system', 'system_departmentrole')) {
        return renderDenied()
      }
      return <DepartmentRoleManagement />
    }

    if (activeSection === 'User Role Access') {
      if (!isAllowed('system', 'system_userrole')) {
        return renderDenied()
      }
      return <RoleAccessControl />
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
        <div className="header-left">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPoCJV5AIkhwzaOSgnWDVpRIZITDAkRDsf5A&s" 
            alt="Rodeo Drive Logo" 
            className="dashboard-logo" 
          />
          <h1>Rodeo Drive CRM</h1>
        </div>
        <div className="user-info">
          <span>Welcome, {user.name || user.username}</span>
          <span className="user-role">{user.role}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>
      <div className="dashboard-body">
        <aside className="sidebar">
          <h2 className="sidebar-title">Dashboard</h2>
          <nav className="sidebar-nav">
            {visibleDashboardItems.map((item) => (
              <button
                key={item.label}
                className={`nav-item ${activeSection === item.label ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection(item.label)
                  setNavigationData(null)
                  if (item.label !== 'Customers Management') {
                    setReturnToCustomerId(null)
                  }
                }}
              >
                {item.label}
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
