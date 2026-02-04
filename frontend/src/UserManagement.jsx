import React, { useMemo, useState } from 'react'
import './UserManagement.css'

const departments = [
  'IT',
  'HR',
  'Finance',
  'Marketing',
  'Sales',
  'Operations',
  'Customer Support',
  'Research & Development',
]

const roles = [
  'Administrator',
  'Manager',
  'Supervisor',
  'Team Lead',
  'Developer',
  'Accountant',
  'Marketing Manager',
  'Sales Executive',
  'Support Specialist',
  'Analyst',
]

const initialUsers = [
  {
    id: '1',
    employeeId: 'EMP001',
    name: 'John Doe',
    email: 'john.doe@company.com',
    mobile: '+974 1234 5678',
    department: 'IT',
    role: 'Administrator',
    lineManager: 'Sarah Williams',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2024-01-15',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    mobile: '+974 9876 5432',
    department: 'HR',
    role: 'Manager',
    lineManager: 'Michael Brown',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2024-02-20',
  },
]

const emptyForm = {
  id: '',
  employeeId: '',
  name: '',
  email: '',
  mobile: '',
  department: '',
  role: '',
  lineManager: '',
}

export default function UserManagement() {
  const [users, setUsers] = useState(initialUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [formState, setFormState] = useState(emptyForm)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [detailsUser, setDetailsUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)
  const [notification, setNotification] = useState(null)

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const terms = searchQuery.toLowerCase().split(' ').filter(Boolean)
    return users.filter((user) =>
      terms.every((term) =>
        [
          user.employeeId,
          user.name,
          user.email,
          user.mobile,
          user.department,
          user.role,
          user.status,
          user.dashboardAccess,
          user.lineManager,
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      )
    )
  }, [users, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const openCreate = () => {
    setFormState(emptyForm)
    setIsCreateOpen(true)
  }

  const openEdit = (user) => {
    setFormState({
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      department: user.department,
      role: user.role,
      lineManager: user.lineManager,
    })
    setIsEditOpen(true)
  }

  const closeModals = () => {
    setIsCreateOpen(false)
    setIsEditOpen(false)
    setDetailsUser(null)
    setDeleteUser(null)
  }

  const showNotification = (message, isError = false) => {
    setNotification({ message, isError })
    setTimeout(() => setNotification(null), 4000)
  }

  const validateForm = () => {
    const requiredFields = [
      'employeeId',
      'name',
      'email',
      'mobile',
      'department',
      'role',
      'lineManager',
    ]
    for (const field of requiredFields) {
      if (!formState[field]?.trim()) {
        showNotification('Please fill all required fields.', true)
        return false
      }
    }
    return true
  }

  const handleCreate = () => {
    if (!validateForm()) return

    const newUser = {
      id: String(Date.now()),
      employeeId: formState.employeeId.trim(),
      name: formState.name.trim(),
      email: formState.email.trim(),
      mobile: formState.mobile.trim(),
      department: formState.department,
      role: formState.role,
      lineManager: formState.lineManager.trim(),
      status: 'active',
      dashboardAccess: 'allowed',
      createdDate: new Date().toISOString().split('T')[0],
    }

    setUsers((prev) => [...prev, newUser])
    setIsCreateOpen(false)
    setCurrentPage(1)
    showNotification('User created successfully!')
  }

  const handleEdit = () => {
    if (!validateForm()) return

    setUsers((prev) =>
      prev.map((user) =>
        user.id === formState.id
          ? {
              ...user,
              employeeId: formState.employeeId.trim(),
              name: formState.name.trim(),
              email: formState.email.trim(),
              mobile: formState.mobile.trim(),
              department: formState.department,
              role: formState.role,
              lineManager: formState.lineManager.trim(),
            }
          : user
      )
    )
    setIsEditOpen(false)
    showNotification('User updated successfully!')
  }

  const confirmDelete = () => {
    if (!deleteUser) return
    setUsers((prev) => prev.filter((user) => user.id !== deleteUser.id))
    closeModals()
    showNotification('User deleted successfully!')
  }

  const handleSearch = (value) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  return (
    <div className="user-management">
      <header className="user-header">
        <h1>👤 User Management System</h1>
      </header>

      <section className="search-section">
        <div className="search-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Search by Employee ID, Name, Email, Mobile, Department, Role, or Line Manager"
          />
        </div>
        <div className="search-stats">
          Showing {filteredUsers.length} user
          {filteredUsers.length !== 1 ? 's' : ''}
        </div>
      </section>

      <section className="results-section">
        <div className="section-header">
          <h2>Users List</h2>
          <div className="section-actions">
            <div className="records-per-page">
              <label>Records per page</label>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <button className="btn btn-success" onClick={openCreate}>
              ➕ Add New User
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Email Address</th>
                <th>Mobile Number</th>
                <th>Department</th>
                <th>Role</th>
                <th>Line Manager</th>
                <th>User Status</th>
                <th>Dashboard Access</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.employeeId}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.mobile}</td>
                  <td><span className="badge dept">{user.department}</span></td>
                  <td><span className="badge role">{user.role}</span></td>
                  <td>{user.lineManager}</td>
                  <td>
                    <span className={`status ${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status ${
                        user.dashboardAccess === 'allowed'
                          ? 'allowed'
                          : 'blocked'
                      }`}
                    >
                      {user.dashboardAccess}
                    </span>
                  </td>
                  <td className="action-cell">
                    <button className="btn btn-secondary" onClick={() => setDetailsUser(user)}>
                      View
                    </button>
                    <button className="btn btn-primary" onClick={() => openEdit(user)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => setDeleteUser(user)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="empty-state">No matching users found.</div>
        )}

        <div className="pagination">
          <button
            className="btn btn-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
          >
            Next
          </button>
        </div>
      </section>

      {(isCreateOpen || isEditOpen) && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isCreateOpen ? 'Add New User' : 'Edit User'}</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Employee ID *</label>
                <input
                  type="text"
                  value={formState.employeeId}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      employeeId: event.target.value,
                    }))
                  }
                  placeholder="Enter employee ID"
                />
              </div>
              <div className="form-group">
                <label>Employee Name *</label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Mobile Number *</label>
                <input
                  type="text"
                  value={formState.mobile}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      mobile: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <select
                  value={formState.department}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      department: event.target.value,
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
                <label>Role *</label>
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
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Line Manager *</label>
                <input
                  type="text"
                  value={formState.lineManager}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      lineManager: event.target.value,
                    }))
                  }
                  placeholder="Enter line manager name"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeModals}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={isCreateOpen ? handleCreate : handleEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsUser && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>User Details</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                <div>
                  <strong>Employee ID:</strong> {detailsUser.employeeId}
                </div>
                <div>
                  <strong>Name:</strong> {detailsUser.name}
                </div>
                <div>
                  <strong>Email:</strong> {detailsUser.email}
                </div>
                <div>
                  <strong>Mobile:</strong> {detailsUser.mobile}
                </div>
                <div>
                  <strong>Department:</strong> {detailsUser.department}
                </div>
                <div>
                  <strong>Role:</strong> {detailsUser.role}
                </div>
                <div>
                  <strong>Line Manager:</strong> {detailsUser.lineManager}
                </div>
                <div>
                  <strong>Status:</strong> {detailsUser.status}
                </div>
                <div>
                  <strong>Dashboard Access:</strong> {detailsUser.dashboardAccess}
                </div>
                <div>
                  <strong>Created Date:</strong> {detailsUser.createdDate}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeModals}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteUser && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              Are you sure you want to delete {deleteUser.name}?
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeModals}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className={`notification ${notification.isError ? 'error' : ''}`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}
