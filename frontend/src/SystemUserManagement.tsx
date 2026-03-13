import { useMemo, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './SystemUserManagement.css'
import PermissionGate from './PermissionGate'
import { 
  getAllUsersIncludingInactive, 
  addUser as addUserToService,
  updateUser as updateUserInService,
  deleteUser as deleteUserFromService,
  initializeUsers,
  generatePasswordResetToken
} from './userService.ts'

const initialUsers = [
  {
    id: '1',
    employeeId: 'EP0001',
    name: 'test number 99',
    email: 'test99@redoedrive.com',
    mobile: '12345699',
    department: 'IT',
    role: 'Administrator',
    lineManager: 'test number 08',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description:
      'System Administrator responsible for overall system management and user administration.',
  },
  // ... rest of initial users array (keeping the same)
]

const departmentData = [
  { id: 1, name: 'IT', roles: ['Administrator', 'IT helpdesk'] },
  {
    id: 2,
    name: 'Sales',
    roles: [
      'Sales Manager',
      'Sales Agent',
      'Receiptioant',
      'Seinor receiptant',
      'Cashir',
    ],
  },
  { id: 3, name: 'Management', roles: ['General manger', 'CEO', 'Director'] },
  {
    id: 4,
    name: 'Operation',
    roles: [
      'Operation Manager',
      'Supervisor',
      'Techinician',
      'professional Techinician',
      'Seinor Techinician',
      'Quality Inspector',
      'Service Inspector',
      'Inspection Supoervsior',
      'Qulaity Supervior',
    ],
  },
]

const emptyForm = {
  employeeId: '',
  name: '',
  email: '',
  mobile: '',
  department: '',
  role: '',
  lineManager: '',
}

interface AlertOptions {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  buttons?: Array<{
    text: string;
    class: string;
    action: () => void;
  }>;
}

export default function SystemUserManagement() {
  // Initialize users from the centralized service
  useEffect(() => {
    initializeUsers()
    loadUsers()
  }, [])

  const loadUsers = () => {
    const usersFromService = getAllUsersIncludingInactive()
    setUsers(usersFromService)
  }

  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detailsUserId, setDetailsUserId] = useState(null)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    title: '',
    message: '',
    type: 'info',
  })
  const [formState, setFormState] = useState(emptyForm)
  const [editFormState, setEditFormState] = useState(emptyForm)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  // Refs for focus management
  const employeeIdRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const mobileRef = useRef<HTMLInputElement>(null)

  const detailsUser = useMemo(
    () => users.find((user) => user.id === detailsUserId) || null,
    [users, detailsUserId]
  )

  const departments = useMemo(() => {
    const fromUsers = new Set(users.map((user) => user.department))
    return Array.from(fromUsers).sort()
  }, [users])

  const roles = useMemo(() => {
    const fromUsers = new Set(users.map((user) => user.role))
    return Array.from(fromUsers).sort()
  }, [users])

  const lineManagers = useMemo(() => {
    const names = users.map((user) => user.name).sort()
    return ['not available', ...new Set(names)]
  }, [users])

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const terms = searchQuery
      .toLowerCase()
      .split(' ')
      .filter((term) => term.trim())
    return users.filter((user) =>
      terms.every((term) =>
        [
          user.employeeId,
          user.name,
          user.email,
          user.mobile,
          user.department,
          user.role,
          user.lineManager || '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      )
    )
  }, [users, searchQuery])

  const totalPages = useMemo(() => {
    const total = Math.ceil(filteredUsers.length / pageSize)
    return total > 0 ? total : 1
  }, [filteredUsers.length, pageSize])

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredUsers.slice(startIndex, startIndex + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  const getStats = () => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.status === 'active').length
    const inactiveUsers = users.filter(u => u.status === 'inactive').length
    return { totalUsers, activeUsers, inactiveUsers }
  }

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    if (detailsUserId && !detailsUser) {
      setDetailsUserId(null)
    }
  }, [detailsUserId, detailsUser])

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isDropdownButton = event.target.closest('.btn-action-dropdown')
      const isDropdownMenu = event.target.closest('.action-dropdown-menu')

      if (!isDropdownButton && !isDropdownMenu) {
        setActiveDropdown(null)
      }
    }

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }

    return undefined
  }, [activeDropdown])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllModals()
        closeAlert()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    if (showAddUserModal && employeeIdRef.current) {
      employeeIdRef.current.focus()
    }
  }, [showAddUserModal])

  const closeAllModals = () => {
    setShowAddUserModal(false)
    setShowEditUserModal(false)
    setUserToDelete(null)
    document.body.style.overflow = 'auto'
  }

  const openModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true)
    document.body.style.overflow = 'hidden'
  }

  const closeAlert = () => {
    setShowAlert(false)
    document.body.style.overflow = 'auto'
  }

  const showAlertMessage = (options: AlertOptions) => {
    setAlertOptions(options)
    setShowAlert(true)
    document.body.style.overflow = 'hidden'

    if (options.type === 'success' && !options.buttons) {
      setTimeout(closeAlert, 3000)
    }
  }

  const handleSearch = (event) => {
    setSearchQuery(event.target.value)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (event) => {
    setPageSize(Number.parseInt(event.target.value, 10))
    setCurrentPage(1)
  }

  const openAddUserModal = () => {
    setFormState(emptyForm)
    openModal(setShowAddUserModal)
  }

  const openEditUserModal = (user) => {
    setEditFormState({
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      department: user.department,
      role: user.role,
      lineManager: user.lineManager || '',
    })
    setDetailsUserId(user.id)
    openModal(setShowEditUserModal)
  }

  const saveUser = () => {
    const { employeeId, name, email, mobile, department, role } = formState
    if (!employeeId || !name || !email || !mobile || !department || !role) {
      showAlertMessage({
        title: 'Error',
        message: 'Please fill in all required fields!',
        type: 'error',
      })
      return
    }

    // Check if Employee ID already exists
    const existingUser = users.find(u => u.employeeId === employeeId.trim())
    if (existingUser) {
      showAlertMessage({
        title: 'Error',
        message: 'Employee ID already exists! Please use a unique Employee ID.',
        type: 'error',
      })
      return
    }

    const newUser = {
      id: String(users.length + 1),
      employeeId: employeeId.trim(),
      name,
      email,
      mobile,
      department,
      role,
      lineManager: formState.lineManager || 'not available',
      status: 'active',
      dashboardAccess: 'allowed',
      createdDate: new Date().toISOString().slice(0, 10),
      tempPassword: null,
      mustChangePassword: true,
      password: null,
      description: '',
    }

    // Add user to centralized service
    const result = addUserToService(newUser)
    if (result.success) {
      loadUsers()
      closeAllModals()
      
      // Send password reset link to new user
      const resetResult = generatePasswordResetToken(email)
      if (resetResult.success) {
        showAlertMessage({
          title: 'Success',
          message: 'User created successfully! Password setup link has been sent to their email.',
          type: 'success',
        })
        console.log('Password setup link:', resetResult.resetLink)
      } else {
        showAlertMessage({
          title: 'Success',
          message: 'User created but failed to send password setup link',
          type: 'warning',
        })
      }
    } else {
      showAlertMessage({
        title: 'Error',
        message: 'Failed to create user',
        type: 'error',
      })
    }
  }

  const saveEditUser = () => {
    const { name, email, mobile, department, role } = editFormState
    if (!name || !email || !mobile || !department || !role) {
      showAlertMessage({
        title: 'Error',
        message: 'Please fill in all required fields!',
        type: 'error',
      })
      return
    }

    const updates = {
      name,
      email,
      mobile,
      department,
      role,
      lineManager: editFormState.lineManager || 'not available',
    }

    const result = updateUserInService(detailsUserId, updates)
    if (result.success) {
      loadUsers()
      closeAllModals()
      showAlertMessage({
        title: 'Success',
        message: 'User updated successfully!',
        type: 'success',
      })
    } else {
      showAlertMessage({
        title: 'Error',
        message: 'Failed to update user',
        type: 'error',
      })
    }
  }

  const confirmDeleteUser = () => {
    if (!userToDelete) return
    
    const result = deleteUserFromService(userToDelete.id)
    if (result.success) {
      loadUsers()
      if (detailsUserId === userToDelete.id) {
        setDetailsUserId(null)
      }
      closeAllModals()
      showAlertMessage({
        title: 'Success',
        message: `User ${userToDelete.name} deleted successfully!`,
        type: 'success',
      })
    } else {
      showAlertMessage({
        title: 'Error',
        message: 'Failed to delete user',
        type: 'error',
      })
    }
  }

  const openDeleteModal = (user) => {
    showAlertMessage({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete "${user.name}"? This action cannot be undone.`,
      type: 'warning',
      buttons: [
        {
          text: 'Cancel',
          class: 'alert-btn-secondary',
          action: closeAlert,
        },
        {
          text: 'Delete',
          class: 'alert-btn-danger',
          action: confirmDeleteUser,
        },
      ],
    })
    setUserToDelete(user)
  }

  const openDetailsView = (userId) => {
    setDetailsUserId(userId)
  }

  const closeDetailsView = () => {
    setDetailsUserId(null)
  }

  const resetPassword = (userId) => {
    const user = users.find(u => u.id === userId)
    if (!user) {
      showAlertMessage({
        title: 'Error',
        message: 'User not found',
        type: 'error',
      })
      return
    }

    const result = generatePasswordResetToken(user.email)
    if (result.success) {
      showAlertMessage({
        title: 'Success',
        message: `Password reset link has been sent to ${user.email}`,
        type: 'success',
      })
      console.log('Reset Link:', result.resetLink)
    } else {
      showAlertMessage({
        title: 'Error',
        message: result.message || 'Failed to send reset link',
        type: 'error',
      })
    }
  }

  const toggleUserStatus = (userId) => {
    const user = users.find(u => u.id === userId)
    if (!user) return
    
    const nextStatus = user.status === 'active' ? 'inactive' : 'active'
    const updates = {
      status: nextStatus,
      dashboardAccess: nextStatus === 'inactive' ? 'blocked' : user.dashboardAccess,
    }
    
    const result = updateUserInService(userId, updates)
    if (result.success) {
      loadUsers()
      showAlertMessage({
        title: 'Success',
        message: `User status changed to ${nextStatus}`,
        type: 'success',
      })
    } else {
      showAlertMessage({
        title: 'Error',
        message: 'Failed to update user status',
        type: 'error',
      })
    }
  }

  const toggleDashboardAccess = (userId) => {
    const user = users.find(u => u.id === userId)
    if (!user || user.status !== 'active') return
    
    const updates = {
      dashboardAccess: user.dashboardAccess === 'allowed' ? 'blocked' : 'allowed',
    }
    
    const result = updateUserInService(userId, updates)
    if (result.success) {
      loadUsers()
    } else {
      showAlertMessage({
        title: 'Error',
        message: 'Failed to update dashboard access',
        type: 'error',
      })
    }
  }

  const departmentRoles = useMemo(() => {
    const entry = departmentData.find(
      (dept) => dept.name === formState.department
    )
    return entry ? entry.roles : roles
  }, [formState.department, roles])

  const editDepartmentRoles = useMemo(() => {
    const entry = departmentData.find(
      (dept) => dept.name === editFormState.department
    )
    return entry ? entry.roles : roles
  }, [editFormState.department, roles])

  const stats = getStats()

  return (
    <div className="system-user-container">
      <div className="page-header">
        <div className="header-top">
          <h1>
            <i className="fas fa-users"></i>
            System User Management
          </h1>
          <PermissionGate moduleId="system" optionId="system_systemuser">
            <button className="btn btn-primary" onClick={openAddUserModal}>
              <i className="fas fa-user-plus"></i> Add New User
            </button>
          </PermissionGate>
        </div>
        <p className="page-description">
          Create and manage system users, assign roles and departments, and control access permissions
        </p>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.activeUsers}</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.inactiveUsers}</div>
          <div className="stat-label">Inactive Users</div>
        </div>
      </div>

      {!detailsUser && (
        <div className="user-management-content">
          <div className="search-section">
            <div className="search-container">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                className="smart-search-input"
                placeholder="Search by Employee ID, Name, Email, Mobile, Department, Role, or Line Manager"
                autoComplete="off"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="list-header">
            <h2>
              <i className="fas fa-list"></i> Users List
            </h2>
            <div className="pagination-controls">
              <div className="records-per-page">
                <label htmlFor="pageSizeSelect">Records per page:</label>
                <select
                  id="pageSizeSelect"
                  className="page-size-select"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Email Address</th>
                  <th>Mobile Number</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Line Manager</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan="9" className="empty-table-cell">
                      <div className="empty-state">
                        <i className="fas fa-user-slash"></i>
                        <h3>No Users Found</h3>
                        <p>Try adjusting your search or add a new user</p>
                      </div>
                    </td>
                  </tr>
                )}
                {paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="employee-id-badge">{user.employeeId}</span>
                    </td>
                    <td className="user-name-cell">{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.mobile}</td>
                    <td>
                      <span className="dept-badge">{user.department}</span>
                    </td>
                    <td>
                      <span className="role-badge">{user.role}</span>
                    </td>
                    <td>
                      <span className="line-manager-badge">
                        {user.lineManager || 'Not Assigned'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          user.status === 'active'
                            ? 'status-active'
                            : 'status-inactive'
                        }`}
                      >
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <PermissionGate moduleId="system" optionId="system_systemuser">
                        <div className="action-dropdown-container">
                          <button
                            className={`btn-action-dropdown ${
                              activeDropdown === user.id ? 'active' : ''
                            }`}
                            onClick={(event) => {
                              const isActive = activeDropdown === user.id
                              if (isActive) {
                                setActiveDropdown(null)
                                return
                              }
                              const rect = event.currentTarget.getBoundingClientRect()
                              const menuHeight = 120
                              const menuWidth = 200
                              const spaceBelow = window.innerHeight - rect.bottom
                              const top =
                                spaceBelow < menuHeight
                                  ? rect.top - menuHeight - 6
                                  : rect.bottom + 6
                              const left = Math.max(
                                8,
                                Math.min(
                                  rect.right - menuWidth,
                                  window.innerWidth - menuWidth - 8
                                )
                              )
                              setDropdownPosition({ top, left })
                              setActiveDropdown(user.id)
                            }}
                            aria-label={`Actions for ${user.name}`}
                          >
                            <i className="fas fa-cogs"></i> Actions
                            <i className="fas fa-chevron-down"></i>
                          </button>
                        </div>
                      </PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {activeDropdown && typeof document !== 'undefined' &&
            createPortal(
              <PermissionGate moduleId="system" optionId="system_systemuser">
                <div
                  className="action-dropdown-menu show action-dropdown-menu-fixed"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                  }}
                >
                  <button
                    className="dropdown-item view"
                    onClick={() => {
                      openDetailsView(activeDropdown)
                      setActiveDropdown(null)
                    }}
                  >
                    <i className="fas fa-eye"></i> View Details
                  </button>
                  <button
                    className="dropdown-item edit"
                    onClick={() => {
                      const user = users.find((entry) => entry.id === activeDropdown)
                      if (user) {
                        openEditUserModal(user)
                      }
                      setActiveDropdown(null)
                    }}
                  >
                    <i className="fas fa-edit"></i> Edit User
                  </button>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item delete"
                    onClick={() => {
                      const user = users.find((entry) => entry.id === activeDropdown)
                      if (user) {
                        openDeleteModal(user)
                      }
                      setActiveDropdown(null)
                    }}
                  >
                    <i className="fas fa-trash"></i> Delete User
                  </button>
                </div>
              </PermissionGate>,
              document.body
            )}

          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`pagination-btn ${
                    page === currentPage ? 'active' : ''
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className="pagination-btn"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}

      {detailsUser && (
        <div className="user-details-screen">
          <div className="details-header">
            <div className="details-header-left">
              <h2>
                <i className="fas fa-user-circle"></i> User Details
              </h2>
              <span className={`status-badge ${detailsUser.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                {detailsUser.status}
              </span>
            </div>
            <div className="details-header-actions">
              <button className="btn btn-secondary" onClick={closeDetailsView}>
                <i className="fas fa-arrow-left"></i> Back to Users
              </button>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>
                  <i className="fas fa-user"></i> User Information
                </h3>
                <button
                  className="btn btn-success btn-small"
                  onClick={() => openEditUserModal(detailsUser)}
                >
                  <i className="fas fa-edit"></i> Edit User
                </button>
              </div>
              <div className="details-info-grid">
                <div className="info-item">
                  <span className="info-label">Employee ID</span>
                  <span className="info-value employee-id">{detailsUser.employeeId}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{detailsUser.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{detailsUser.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Mobile Number</span>
                  <span className="info-value">{detailsUser.mobile}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Department</span>
                  <span className="info-value">
                    <span className="dept-badge">{detailsUser.department}</span>
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Role</span>
                  <span className="info-value">
                    <span className="role-badge">{detailsUser.role}</span>
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Line Manager</span>
                  <span className="info-value">{detailsUser.lineManager || 'Not Assigned'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Created Date</span>
                  <span className="info-value">{detailsUser.createdDate}</span>
                </div>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-card-header">
                <h3>
                  <i className="fas fa-shield-alt"></i> Account Settings
                </h3>
              </div>
              <div className="settings-grid">
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">User Status</div>
                    <div className="setting-description">Enable or disable user account</div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={detailsUser.status === 'active'}
                      onChange={() => toggleUserStatus(detailsUser.id)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Dashboard Access</div>
                    <div className="setting-description">Allow user to access dashboard</div>
                  </div>
                  <label className={`toggle-switch ${detailsUser.status !== 'active' ? 'toggle-disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={detailsUser.dashboardAccess === 'allowed'}
                      onChange={() => toggleDashboardAccess(detailsUser.id)}
                      disabled={detailsUser.status !== 'active'}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-card-header">
                <h3>
                  <i className="fas fa-key"></i> Password Management
                </h3>
              </div>
              <div className="reset-password-section">
                <div className="reset-password-info">
                  <h4>Send Password Reset Link</h4>
                  <p>Send a secure password reset link to the user's email address. The link will expire in 1 hour.</p>
                </div>
                <button
                  className="btn btn-warning"
                  onClick={() => resetPassword(detailsUser.id)}
                >
                  <i className="fas fa-envelope"></i> Send Reset Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && closeAllModals()}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-user-plus"></i>
                Add New User
              </h3>
              <button className="close-modal" onClick={closeAllModals}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveUser(); }}>
              <div className="form-group">
                <label htmlFor="employeeId">Employee ID <span className="required">*</span></label>
                <input
                  type="text"
                  id="employeeId"
                  ref={employeeIdRef}
                  value={formState.employeeId}
                  onChange={(e) => setFormState(prev => ({ ...prev, employeeId: e.target.value }))}
                  placeholder="e.g., EP0001"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Employee Name <span className="required">*</span></label>
                <input
                  type="text"
                  id="name"
                  value={formState.name}
                  onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  id="email"
                  value={formState.email}
                  onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g., user@company.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mobile">Mobile Number <span className="required">*</span></label>
                <input
                  type="tel"
                  id="mobile"
                  value={formState.mobile}
                  onChange={(e) => setFormState(prev => ({ ...prev, mobile: e.target.value }))}
                  placeholder="Enter mobile number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="department">Department <span className="required">*</span></label>
                <select
                  id="department"
                  value={formState.department}
                  onChange={(e) => setFormState(prev => ({ ...prev, department: e.target.value, role: '' }))}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="role">Role <span className="required">*</span></label>
                <select
                  id="role"
                  value={formState.role}
                  onChange={(e) => setFormState(prev => ({ ...prev, role: e.target.value }))}
                  required
                >
                  <option value="">Select Role</option>
                  {departmentRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="lineManager">Line Manager</label>
                <select
                  id="lineManager"
                  value={formState.lineManager}
                  onChange={(e) => setFormState(prev => ({ ...prev, lineManager: e.target.value }))}
                >
                  <option value="">Select Line Manager</option>
                  {lineManagers.map(manager => (
                    <option key={manager} value={manager}>{manager}</option>
                  ))}
                </select>
              </div>

              <div className="button-group">
                <button type="submit" className="btn btn-primary">Create User</button>
                <button type="button" className="btn btn-secondary" onClick={closeAllModals}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && closeAllModals()}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fas fa-edit"></i>
                Edit User
              </h3>
              <button className="close-modal" onClick={closeAllModals}>&times;</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveEditUser(); }}>
              <div className="form-group">
                <label htmlFor="editName">Employee Name <span className="required">*</span></label>
                <input
                  type="text"
                  id="editName"
                  value={editFormState.name}
                  onChange={(e) => setEditFormState(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editEmail">Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  id="editEmail"
                  value={editFormState.email}
                  onChange={(e) => setEditFormState(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editMobile">Mobile Number <span className="required">*</span></label>
                <input
                  type="tel"
                  id="editMobile"
                  value={editFormState.mobile}
                  onChange={(e) => setEditFormState(prev => ({ ...prev, mobile: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editDepartment">Department <span className="required">*</span></label>
                <select
                  id="editDepartment"
                  value={editFormState.department}
                  onChange={(e) => setEditFormState(prev => ({ ...prev, department: e.target.value, role: '' }))}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="editRole">Role <span className="required">*</span></label>
                <select
                  id="editRole"
                  value={editFormState.role}
                  onChange={(e) => setEditFormState(prev => ({ ...prev, role: e.target.value }))}
                  required
                >
                  <option value="">Select Role</option>
                  {editDepartmentRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="editLineManager">Line Manager</label>
                <select
                  id="editLineManager"
                  value={editFormState.lineManager}
                  onChange={(e) => setEditFormState(prev => ({ ...prev, lineManager: e.target.value }))}
                >
                  <option value="">Select Line Manager</option>
                  {lineManagers.map(manager => (
                    <option key={manager} value={manager}>{manager}</option>
                  ))}
                </select>
              </div>

              <div className="button-group">
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button type="button" className="btn btn-secondary" onClick={closeAllModals}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Popup */}
      {showAlert && (
        <div className="alert-popup" onClick={(e) => e.target === e.currentTarget && closeAlert()}>
          <div className="alert-content">
            <div className={`alert-header ${alertOptions.type}`}>
              <div className="alert-icon">
                {alertOptions.type === 'success' && <i className="fas fa-check-circle"></i>}
                {alertOptions.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
                {alertOptions.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                {alertOptions.type === 'info' && <i className="fas fa-info-circle"></i>}
              </div>
              <div className="alert-title">{alertOptions.title}</div>
            </div>
            <div className="alert-body">
              <div className="alert-message">{alertOptions.message}</div>
              <div className="alert-actions">
                {alertOptions.buttons ? (
                  alertOptions.buttons.map((button, index) => (
                    <button
                      key={index}
                      className={`alert-btn ${button.class}`}
                      onClick={button.action}
                    >
                      {button.text}
                    </button>
                  ))
                ) : (
                  <button className="alert-btn alert-btn-primary" onClick={closeAlert}>
                    OK
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}