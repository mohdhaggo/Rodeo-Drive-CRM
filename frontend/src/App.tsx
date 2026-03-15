import { useState, useEffect } from 'react'
import amplifyOutputs from '../../amplify_outputs.json'
import { getCurrentUser as getSystemUser, clearCurrentUser } from './userService.ts'
import { getRolePermissionsForUser, hasModuleAccess, hasOptionAccess } from './roleAccess.ts'
import { authService, type AuthUser } from './authService'
import Login from './Login'
import PasswordReset from './PasswordReset'
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

console.log('✅ App.tsx: Amplify configuration loaded:', amplifyOutputs.auth?.user_pool_id ? 'AWS Cognito configured' : 'No auth configured')

function App() {
  // Check if this is the password reset page
  const params = new URLSearchParams(window.location.search)
  const isResetPage = window.location.pathname === '/reset-password' || params.has('token')
  
  if (isResetPage) {
    return <PasswordReset />
  }

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('Overview')
  const [navigationData, setNavigationData] = useState<Record<string, any> | null>(null)
  const [returnToCustomerId, setReturnToCustomerId] = useState<string | null>(null)
  const [rolePermissions, setRolePermissions] = useState<any>(null)

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
      // First, check if user is logged in via our local user service
      console.log('🔍 Checking current user from local service...')
      const currentUser = getSystemUser()
      
      if (currentUser) {
        console.log('✅ Local user found:', currentUser.email)
        setUser(currentUser)
        
        // Also initialize Amplify auth in background (optional)
        try {
          const amplifyUser = await authService.initializeAuth()
          if (amplifyUser) {
            console.log('✅ Amplify auth initialized')
          }
        } catch (error) {
          console.log('ℹ️ Amplify auth not available (using local auth):', error)
        }
      } else {
        console.log('ℹ️ No local user found, checking Amplify auth...')
        
        // Try to get Amplify user (with timeout to prevent hanging)
        try {
          const amplifyUser: AuthUser | null = await Promise.race([
            authService.initializeAuth(),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ])
          
          if (amplifyUser) {
            console.log('✅ Amplify user found:', amplifyUser.email)
            // Map Amplify user to local format
            setUser({
              id: amplifyUser.userId,
              email: amplifyUser.email,
              name: `${amplifyUser.firstName || ''} ${amplifyUser.lastName || ''}`.trim(),
            })
          } else {
            console.log('ℹ️ No authenticated user found')
            setUser(null)
          }
        } catch (error) {
          console.log('ℹ️ Amplify auth not available:', error)
          setUser(null)
        }
      }
    } catch (err) {
      console.log('ℹ️ User check complete - no user logged in')
      setUser(null)
    } finally {
      setLoading(false)
      console.log('✅ Loading complete')
    }
  }

  const handleLoginSuccess = (loggedInUser: any): void => {
    console.log('✅ Login successful:', loggedInUser.email)
    setUser(loggedInUser)
  }

  const handleLogout = async () => {
    try {
      // Clear local user
      clearCurrentUser()
      
      // Also sign out from Amplify
      try {
        await authService.signOut()
        console.log('✅ Amplify auth signed out')
      } catch (error) {
        console.log('ℹ️ Amplify sign out not applicable')
      }
      
      setUser(null)
      console.log('✅ User logged out')
    } catch (err) {
      console.error('❌ Logout failed:', err)
    }
  }

  const handleNavigate = (section: string, data: any = null): void => {
    setActiveSection(section)
    setNavigationData(data)
    if (section !== 'Customers Management') {
      setReturnToCustomerId(null)
    }
  }

  const handleClearNavigation = () => {
    setNavigationData(null)
  }

  const handleNavigateBack = (section?: string, returnId?: string | null): void => {
    if (!section) {
      setNavigationData(null)
      return
    }

    setActiveSection(section)
    if (section === 'Customers Management') {
      setReturnToCustomerId(returnId || null)
      setNavigationData(null)
      return
    }
    if (section === 'Vehicles Management' && returnId) {
      setNavigationData({ openDetails: true, vehicleId: returnId } as Record<string, any>)
      return
    }
    setNavigationData(null)
  }

  const handleVehicleNavigateBack = (source: string, returnToCustomerId?: string | null): void => {
    handleNavigateBack(source, returnToCustomerId)
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
    const isAllowed = (moduleId: string, optionId?: string): boolean =>
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
      // Permissions not loaded yet — don't block with "Access Restricted" during loading
      if (!rolePermissions) {
        return <div className="loading">Loading...</div>
      }
      // Permissions loaded and the user has at least one accessible section —
      // the useEffect will redirect activeSection; show loading briefly instead of blocking
      if (visibleDashboardItems.length > 0) {
        return <div className="loading">Loading...</div>
      }
      return renderDenied()
    }

    if (activeSection === 'Job Order Management') {
      if (!isAllowed('joborder', '')) {
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
      if (!isAllowed('payment', '')) {
        return renderDenied()
      }
      return <PaymentInvoiceManagement currentUser={user} />
    }

    if (activeSection === 'Exit Permit') {
      if (!isAllowed('exitpermit', '')) {
        return renderDenied()
      }
      return <ExitPermitManagement currentUser={user} />
    }

    if (activeSection === 'Inspection') {
      if (!isAllowed('inspection', '')) {
        return renderDenied()
      }
      return <InspectionModule currentUser={user} />
    }

    if (activeSection === 'Service Execution') {
      if (!isAllowed('serviceexec', '')) {
        return renderDenied()
      }
      return <ServiceExecutionModule currentUser={user} />
    }

    if (activeSection === 'Delivery Quality Check' || activeSection === 'Quality Check List') {
      if (!isAllowed('deliveryqc', '')) {
        return renderDenied()
      }
      return <QualityCheckModule currentUser={user} />
    }

    if (activeSection === 'Job Order History') {
      if (!isAllowed('joborderhistory', '')) {
        return renderDenied()
      }
      return (
        <JobOrderHistory
          navigationData={navigationData || undefined}
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
      if (!isAllowed('customer', '')) {
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
      if (!isAllowed('vehicle', '')) {
        return renderDenied()
      }
      return (
        <VehicleManagement
          navigationData={navigationData}
          onClearNavigation={handleClearNavigation}
          onNavigateBack={handleVehicleNavigateBack}
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
          <span>Welcome, {(user as any)?.name || (user as any)?.username}</span>
          <span className="user-role">{(user as any)?.role}</span>
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
