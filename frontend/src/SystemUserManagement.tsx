import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './SystemUserManagement.css'
import PermissionGate from './PermissionGate'
import { 
  getAllUsersIncludingInactive, 
  addUser as addUserToService,
  updateUser as updateUserInService,
  deleteUser as deleteUserFromService,
  initializeUsers,
  sendUserNotification
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
  {
    id: '2',
    employeeId: 'EP0002',
    name: 'test number 01',
    email: 'test1@rodeodrive.com',
    mobile: '12345601',
    department: 'IT',
    role: 'IT helpdesk',
    lineManager: 'test number 99',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Provides technical support and assistance to end users.',
  },
  {
    id: '3',
    employeeId: 'EP0003',
    name: 'test number 02',
    email: 'test2@rodeodrive.com',
    mobile: '12345602',
    department: 'Sales',
    role: 'Sales Manager',
    lineManager: 'test number 08',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Manages sales team and develops sales strategies.',
  },
  {
    id: '4',
    employeeId: 'EP0004',
    name: 'test number 03',
    email: 'test3@rodeodrive.com',
    mobile: '12345603',
    department: 'Sales',
    role: 'Sales Agent',
    lineManager: 'test number 02',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Handles direct sales and customer relationships.',
  },
  {
    id: '5',
    employeeId: 'EP0005',
    name: 'test number 04',
    email: 'test4@rodeodrive.com',
    mobile: '12345604',
    department: 'Sales',
    role: 'Receiptioant',
    lineManager: 'test number 02',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Manages sales receipts and payment processing.',
  },
  {
    id: '6',
    employeeId: 'EP0006',
    name: 'test number 05',
    email: 'test5@rodeodrive.com',
    mobile: '12345605',
    department: 'Sales',
    role: 'Seinor receiptant',
    lineManager: 'test number 02',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Senior receiptant overseeing payment operations.',
  },
  {
    id: '7',
    employeeId: 'EP0007',
    name: 'test number 06',
    email: 'test6@rodeodrive.com',
    mobile: '12345606',
    department: 'Sales',
    role: 'Cashir',
    lineManager: 'test number 02',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Handles cash transactions and daily sales reconciliation.',
  },
  {
    id: '8',
    employeeId: 'EP0008',
    name: 'test number 07',
    email: 'test7@rodeodrive.com',
    mobile: '12345607',
    department: 'Sales',
    role: 'Sales Agent',
    lineManager: 'test number 02',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Sales representative for customer acquisition.',
  },
  {
    id: '9',
    employeeId: 'EP0009',
    name: 'test number 08',
    email: 'test8@rodeodrive.com',
    mobile: '12345608',
    department: 'Management',
    role: 'General manger',
    lineManager: 'test number 09',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Oversees overall operations and department management.',
  },
  {
    id: '10',
    employeeId: 'EP0010',
    name: 'test number 09',
    email: 'test9@rodeodrive.com',
    mobile: '12345609',
    department: 'Management',
    role: 'CEO',
    lineManager: 'not available',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Chief Executive Officer, responsible for strategic direction.',
  },
  {
    id: '11',
    employeeId: 'EP0011',
    name: 'test number 10',
    email: 'test10@rodeodrive.com',
    mobile: '12345610',
    department: 'Management',
    role: 'Director',
    lineManager: 'test number 09',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Directs department operations and strategic initiatives.',
  },
  {
    id: '12',
    employeeId: 'EP0012',
    name: 'test number 11',
    email: 'test11@rodeodrive.com',
    mobile: '12345611',
    department: 'Operation',
    role: 'Operation Manager',
    lineManager: 'test number 08',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Manages day-to-day operations and workflow.',
  },
  {
    id: '13',
    employeeId: 'EP0013',
    name: 'test number 12',
    email: 'test12@rodeodrive.com',
    mobile: '12345612',
    department: 'Operation',
    role: 'Supervisor',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Supervises operational staff and processes.',
  },
  {
    id: '14',
    employeeId: 'EP0014',
    name: 'test number 13',
    email: 'test13@rodeodrive.com',
    mobile: '12345613',
    department: 'Operation',
    role: 'Supervisor',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Team supervisor for operational excellence.',
  },
  {
    id: '15',
    employeeId: 'EP0015',
    name: 'test number 14',
    email: 'test14@rodeodrive.com',
    mobile: '12345614',
    department: 'Operation',
    role: 'Techinician',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Technical support and equipment maintenance.',
  },
  {
    id: '16',
    employeeId: 'EP0016',
    name: 'test number 15',
    email: 'test15@rodeodrive.com',
    mobile: '12345615',
    department: 'Operation',
    role: 'Techinician',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Field technician for operational support.',
  },
  {
    id: '17',
    employeeId: 'EP0017',
    name: 'test number 16',
    email: 'test16@rodeodrive.com',
    mobile: '12345616',
    department: 'Operation',
    role: 'professional Techinician',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Advanced technical specialist.',
  },
  {
    id: '18',
    employeeId: 'EP0018',
    name: 'test number 17',
    email: 'test17@rodeodrive.com',
    mobile: '12345617',
    department: 'Operation',
    role: 'Seinor Techinician',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Senior technician leading technical operations.',
  },
  {
    id: '19',
    employeeId: 'EP0019',
    name: 'test number 18',
    email: 'test18@rodeodrive.com',
    mobile: '12345618',
    department: 'Operation',
    role: 'Quality Inspector',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Ensures quality standards and compliance.',
  },
  {
    id: '20',
    employeeId: 'EP0020',
    name: 'test number 19',
    email: 'test19@rodeodrive.com',
    mobile: '12345619',
    department: 'Operation',
    role: 'Service Inspector',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Inspects service delivery and customer satisfaction.',
  },
  {
    id: '21',
    employeeId: 'EP0021',
    name: 'test number 20',
    email: 'test20@rodeodrive.com',
    mobile: '12345620',
    department: 'Operation',
    role: 'Inspection Supoervsior',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Supervises inspection team and processes.',
  },
  {
    id: '22',
    employeeId: 'EP0022',
    name: 'test number 21',
    email: 'test21@rodeodrive.com',
    mobile: '12345621',
    department: 'Operation',
    role: 'Qulaity Supervior',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Quality supervisor ensuring product standards.',
  },
  {
    id: '23',
    employeeId: 'EP0023',
    name: 'test number 22',
    email: 'test22@rodeodrive.com',
    mobile: '12345622',
    department: 'Operation',
    role: 'Techinician',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Operations technician.',
  },
  {
    id: '24',
    employeeId: 'EP0024',
    name: 'test number 23',
    email: 'test23@rodeodrive.com',
    mobile: '12345623',
    department: 'Operation',
    role: 'Techinician',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Field service technician.',
  },
  {
    id: '25',
    employeeId: 'EP0025',
    name: 'test number 24',
    email: 'test24@rodeodrive.com',
    mobile: '12345624',
    department: 'Operation',
    role: 'Techinician',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    tempPassword: null,
    description: 'Maintenance technician.',
  },
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
  name: '',
  email: '',
  mobile: '',
  department: '',
  role: '',
  lineManager: '',
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
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [notification, setNotification] = useState(null)
  const [formState, setFormState] = useState(emptyForm)
  const [editFormState, setEditFormState] = useState(emptyForm)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

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

  const showNotification = (message, isError = false) => {
    setNotification({ message, isError })
    window.setTimeout(() => setNotification(null), 3000)
  }

  const getNextEmployeeId = () => {
    const last = users[users.length - 1]?.employeeId || 'EP0000'
    const lastNum = Number.parseInt(last.replace('EP', ''), 10)
    const nextNum = Number.isNaN(lastNum) ? 1 : lastNum + 1
    return `EP${String(nextNum).padStart(4, '0')}`
  }

  const handleSearch = (event) => {
    setSearchQuery(event.target.value)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (event) => {
    setPageSize(Number.parseInt(event.target.value, 10))
    setCurrentPage(1)
  }

  const openCreateForm = () => {
    setFormState(emptyForm)
    setIsCreateOpen(true)
  }

  const closeCreateForm = () => {
    setIsCreateOpen(false)
  }

  const openEditForm = (user) => {
    setEditFormState({
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      department: user.department,
      role: user.role,
      lineManager: user.lineManager || '',
    })
    setIsEditOpen(true)
  }

  const closeEditForm = () => {
    setIsEditOpen(false)
  }

  const saveUser = () => {
    const { name, email, mobile, department, role } = formState
    if (!name || !email || !mobile || !department || !role) {
      showNotification('Please fill in all required fields!', true)
      return
    }

    const tempPassword = generateTempPassword()
    const newUser = {
      id: String(users.length + 1),
      employeeId: getNextEmployeeId(),
      name,
      email,
      mobile,
      department,
      role,
      lineManager: formState.lineManager || 'not available',
      status: 'active',
      dashboardAccess: 'allowed',
      createdDate: new Date().toISOString().slice(0, 10),
      tempPassword,
      mustChangePassword: true,
      password: tempPassword,
      description: '',
    }

    // Add user to centralized service
    const result = addUserToService(newUser)
    if (result.success) {
      loadUsers() // Reload users from service
      closeCreateForm()
      const notificationMessage =
        `Your account has been created. Use ${email} as your username. ` +
        `Temporary password: ${tempPassword}. You will be asked to change it on first login.`
      sendUserNotification(email, notificationMessage)
      showNotification('User created and notification queued successfully!', false)
    } else {
      showNotification('Failed to create user', true)
    }
  }

  const saveEditUser = () => {
    const { name, email, mobile, department, role } = editFormState
    if (!name || !email || !mobile || !department || !role) {
      showNotification('Please fill in all required fields!', true)
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

    // Update user in centralized service
    const result = updateUserInService(detailsUserId, updates)
    if (result.success) {
      loadUsers() // Reload users from service
      closeEditForm()
      showNotification('User updated successfully!', false)
    } else {
      showNotification('Failed to update user', true)
    }
  }

  const openDeleteModal = (user) => {
    setUserToDelete(user)
    setIsDeleteOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteOpen(false)
    setUserToDelete(null)
  }

  const confirmDeleteUser = () => {
    if (!userToDelete) return
    
    // Delete user in centralized service (soft delete)
    const result = deleteUserFromService(userToDelete.id)
    if (result.success) {
      loadUsers() // Reload users from service
      if (detailsUserId === userToDelete.id) {
        setDetailsUserId(null)
      }
      closeDeleteModal()
      showNotification(`User ${userToDelete.name} deleted successfully!`, false)
    } else {
      showNotification('Failed to delete user', true)
    }
  }

  const openDetailsView = (userId) => {
    setDetailsUserId(userId)
  }

  const closeDetailsView = () => {
    setDetailsUserId(null)
  }

  const resetPassword = (userId) => {
    const password = generateTempPassword()
    const result = updateUserInService(userId, { 
      tempPassword: password,
      mustChangePassword: true,
      password: password // Update actual password as well
    })
    if (result.success) {
      loadUsers()
      showNotification('Temporary password generated successfully!', false)
    } else {
      showNotification('Failed to reset password', true)
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
    } else {
      showNotification('Failed to update user status', true)
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
      showNotification('Failed to update dashboard access', true)
    }
  }

  const copyToClipboard = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(
      () => showNotification('Password copied to clipboard!', false),
      () => showNotification('Failed to copy password', true)
    )
  }

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 10; i += 1) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
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

  const paginationNumbers = useMemo(() => {
    const startPage = Math.max(1, currentPage - 2)
    const endPage = Math.min(totalPages, startPage + 4)
    const pages = []
    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page)
    }
    return pages
  }, [currentPage, totalPages])

  return (
    <div className="module-container">
      <div className="app-header">
        <div className="header-left">
          <h1>
            <i className="fas fa-users"></i>
            System User Management
          </h1>
        </div>
      </div>

      {!detailsUser && (
        <div id="userManagementMainView">
          <div className="user-management-container">
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

            <div className="section-header">
              <h2>
                <i className="fas fa-list"></i> Users List
              </h2>
              <div className="pagination-controls">
                <div className="records-per-page">
                  <label htmlFor="dashboardPageSizeSelect">Records per page:</label>
                  <select
                    id="dashboardPageSizeSelect"
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
                <button className="btn-create-user" onClick={openCreateForm}>
                  <i className="fas fa-user-plus"></i> Add New User
                </button>
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
                        <i className="fas fa-user-slash"></i>
                        <p>No users found</p>
                      </td>
                    </tr>
                  )}
                  {paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.employeeId}</td>
                      <td>{user.name}</td>
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
                          {user.status.charAt(0).toUpperCase() +
                            user.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <PermissionGate moduleId="user" optionId="user_actions">
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
                <PermissionGate moduleId="user" optionId="user_actions">
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
                {paginationNumbers.map((page) => (
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
        </div>
      )}

      {detailsUser && (
        <div className="dashboard-details-screen active">
          <div className="details-header-actions">
            <h2>
              <i className="fas fa-user-circle"></i> User Details
            </h2>
            <button className="btn-back" onClick={closeDetailsView}>
              <i className="fas fa-arrow-left"></i> Back to Users
            </button>
          </div>
          <div className="details-grid details-view-grid">
            <div className="detail-card">
              <div className="detail-card-header">
                <h3>
                  <i className="fas fa-user-circle"></i> User Information
                </h3>
                <div className="card-header-actions">
                  <button
                    className="btn-edit-header"
                    onClick={() => openEditForm(detailsUser)}
                  >
                    <i className="fas fa-edit"></i> Edit User
                  </button>
                </div>
              </div>
              <div className="details-info-grid">
                <div className="info-item">
                  <span className="info-label">Employee ID</span>
                  <span className="info-value">{detailsUser.employeeId}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Employee Name</span>
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
                  <span className="info-value">{detailsUser.department}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Role</span>
                  <span className="info-value">{detailsUser.role}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Line Manager</span>
                  <span className="info-value">
                    {detailsUser.lineManager || 'Not Assigned'}
                  </span>
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
                  <i className="fas fa-cog"></i> Account Settings
                </h3>
              </div>
              <div className="details-info-grid">
                <div className="info-item">
                  <span className="info-label">User Status</span>
                  <label className="toggle-label">
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={detailsUser.status === 'active'}
                        onChange={() => toggleUserStatus(detailsUser.id)}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                    {detailsUser.status === 'active' ? 'Active' : 'Inactive'}
                  </label>
                </div>
                <div className="info-item">
                  <span className="info-label">Dashboard Access</span>
                  <label className="toggle-label">
                    <div
                      className={`toggle-switch ${
                        detailsUser.status !== 'active'
                          ? 'toggle-disabled'
                          : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={detailsUser.dashboardAccess === 'allowed'}
                        onChange={() => toggleDashboardAccess(detailsUser.id)}
                        disabled={detailsUser.status !== 'active'}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                    {detailsUser.dashboardAccess === 'allowed'
                      ? 'Allowed'
                      : 'Blocked'}
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
                <div className="reset-password-container">
                  <div className="reset-password-info">
                    <h4>Reset User Password</h4>
                    <p>Generate a temporary password for the user.</p>
                  </div>
                  <button
                    className="btn-reset-password"
                    onClick={() => resetPassword(detailsUser.id)}
                  >
                    <i className="fas fa-key"></i> Reset Password
                  </button>
                </div>
                {detailsUser.tempPassword && (
                  <div className="temp-password-display">
                    <div className="temp-password-box">
                      <div className="temp-password-value">
                        {detailsUser.tempPassword}
                      </div>
                      <button
                        className="btn-copy-password"
                        onClick={() => copyToClipboard(detailsUser.tempPassword)}
                      >
                        <i className="fas fa-copy"></i> Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`form-overlay ${isCreateOpen ? 'active' : ''}`}>
        <div className="form-container">
          <div className="form-header">
            <h2>Add New User</h2>
            <button className="close-btn" onClick={closeCreateForm}>
              X
            </button>
          </div>
          <div className="form-content">
            <form>
              <div className="form-group">
                <label>
                  Employee Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Enter employee name"
                />
              </div>
              <div className="form-group">
                <label>
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>
                  Mobile Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  value={formState.mobile}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      mobile: event.target.value,
                    }))
                  }
                  placeholder="Enter mobile number"
                />
              </div>
              <div className="form-group">
                <label>
                  Department <span className="required">*</span>
                </label>
                <select
                  value={formState.department}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      department: event.target.value,
                      role: '',
                    }))
                  }
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Role <span className="required">*</span>
                </label>
                <select
                  value={formState.role}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      role: event.target.value,
                    }))
                  }
                >
                  <option value="">Select Role</option>
                  {departmentRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Line Manager</label>
                <select
                  value={formState.lineManager}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      lineManager: event.target.value,
                    }))
                  }
                >
                  <option value="">Select Line Manager</option>
                  {lineManagers.map((manager) => (
                    <option key={manager} value={manager}>
                      {manager}
                    </option>
                  ))}
                </select>
              </div>
            </form>
            <div className="form-buttons">
              <button className="btn-cancel" onClick={closeCreateForm}>
                Cancel
              </button>
              <button className="btn-save" onClick={saveUser}>
                <i className="fas fa-save"></i> Save User
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`edit-form-overlay ${isEditOpen ? 'active' : ''}`}>
        <div className="edit-form-container">
          <div className="edit-form-header">
            <h2>Edit User Details</h2>
            <button className="close-btn" onClick={closeEditForm}>
              X
            </button>
          </div>
          <div className="form-content">
            <form>
              <div className="form-group">
                <label>
                  Employee Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={editFormState.name}
                  onChange={(event) =>
                    setEditFormState((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Enter employee name"
                />
              </div>
              <div className="form-group">
                <label>
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  value={editFormState.email}
                  onChange={(event) =>
                    setEditFormState((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>
                  Mobile Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  value={editFormState.mobile}
                  onChange={(event) =>
                    setEditFormState((prev) => ({
                      ...prev,
                      mobile: event.target.value,
                    }))
                  }
                  placeholder="Enter mobile number"
                />
              </div>
              <div className="form-group">
                <label>
                  Department <span className="required">*</span>
                </label>
                <select
                  value={editFormState.department}
                  onChange={(event) =>
                    setEditFormState((prev) => ({
                      ...prev,
                      department: event.target.value,
                      role: '',
                    }))
                  }
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Role <span className="required">*</span>
                </label>
                <select
                  value={editFormState.role}
                  onChange={(event) =>
                    setEditFormState((prev) => ({
                      ...prev,
                      role: event.target.value,
                    }))
                  }
                >
                  <option value="">Select Role</option>
                  {editDepartmentRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Line Manager</label>
                <select
                  value={editFormState.lineManager}
                  onChange={(event) =>
                    setEditFormState((prev) => ({
                      ...prev,
                      lineManager: event.target.value,
                    }))
                  }
                >
                  <option value="">Select Line Manager</option>
                  {lineManagers.map((manager) => (
                    <option key={manager} value={manager}>
                      {manager}
                    </option>
                  ))}
                </select>
              </div>
            </form>
            <div className="form-buttons">
              <button className="btn-cancel" onClick={closeEditForm}>
                Cancel
              </button>
              <button className="btn-save" onClick={saveEditUser}>
                <i className="fas fa-save"></i> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`delete-modal-overlay ${isDeleteOpen ? 'active' : ''}`}>
        <div className="delete-modal">
          <div className="delete-modal-header">
            <h3>
              <i className="fas fa-exclamation-triangle"></i> Confirm Deletion
            </h3>
          </div>
          <div className="delete-modal-body">
            <div className="delete-warning">
              <i className="fas fa-exclamation-circle"></i>
              <div className="delete-warning-text">
                <p>
                  You are about to delete user{' '}
                  <strong>{userToDelete?.name}</strong>.
                </p>
                <p>This action cannot be undone.</p>
              </div>
            </div>
            <div className="delete-modal-actions">
              <button className="btn-cancel" onClick={closeDeleteModal}>
                <i className="fas fa-times"></i> Cancel
              </button>
              <button className="btn-confirm-delete" onClick={confirmDeleteUser}>
                <i className="fas fa-trash"></i> Delete User
              </button>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div className={`notification ${notification.isError ? 'error' : ''}`}>
          <i
            className={`fas ${
              notification.isError ? 'fa-exclamation-circle' : 'fa-check-circle'
            }`}
          ></i>
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  )
}
