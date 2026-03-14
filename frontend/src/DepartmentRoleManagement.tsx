import { useEffect, useMemo, useState } from 'react'
import './DepartmentRoleManagement.css'
import PermissionGate from './PermissionGate'

const ROLE_STORAGE_KEY = 'department_roles'
const DEPARTMENT_ROLES_UPDATED_EVENT = 'department-roles-updated'

interface Role {
  id: number
  name: string
  description: string
}

interface Department {
  id: number
  name: string
  description: string
  roles: Role[]
}

type ModalType = 'addDept' | 'editDept' | 'addRole' | 'editRole'
type AlertType = 'info' | 'success' | 'error' | 'warning'

interface AlertButton {
  text: string
  className: string
  action: () => void
}

interface AlertState {
  open: boolean
  title: string
  message: string
  type: AlertType
  buttons: AlertButton[] | null
}

const initialDepartments: Department[] = [
  {
    id: 1,
    name: 'IT',
    description:
      'Information Technology department responsible for managing computer systems, software, hardware, and network infrastructure. Provides technical support and IT solutions across the organization.',
    roles: [
      {
        id: 101,
        name: 'Administrator',
        description:
          'System Administrator responsible for overall system management and user administration.',
      },
      {
        id: 102,
        name: 'IT helpdesk',
        description: 'Provides technical support and assistance to end users.',
      },
    ],
  },
  {
    id: 2,
    name: 'Sales',
    description:
      'Sales department focused on driving revenue through customer acquisition, relationship management, and product sales. Develops sales strategies and manages client accounts.',
    roles: [
      {
        id: 201,
        name: 'Sales Manager',
        description: 'Manages sales team and develops sales strategies.',
      },
      {
        id: 202,
        name: 'Sales Agent',
        description: 'Handles direct sales and customer relationships.',
      },
      {
        id: 203,
        name: 'Receiptioant',
        description: 'Manages sales receipts and payment processing.',
      },
      {
        id: 204,
        name: 'Seinor receiptant',
        description: 'Senior receiptant overseeing payment operations.',
      },
      {
        id: 205,
        name: 'Cashir',
        description: 'Handles cash transactions and daily sales reconciliation.',
      },
    ],
  },
  {
    id: 3,
    name: 'Management',
    description:
      'Management department provides strategic direction, leadership, and oversight across all business units. Responsible for decision-making, policy development, and organizational governance.',
    roles: [
      {
        id: 301,
        name: 'General manger',
        description: 'Oversees overall operations and department management.',
      },
      {
        id: 302,
        name: 'CEO',
        description: 'Chief Executive Officer, responsible for strategic direction.',
      },
      {
        id: 303,
        name: 'Director',
        description: 'Directs department operations and strategic initiatives.',
      },
    ],
  },
  {
    id: 4,
    name: 'Operation',
    description:
      'Operations department ensures efficient and effective execution of business processes. Manages day-to-day activities, quality control, and service delivery.',
    roles: [
      {
        id: 401,
        name: 'Operation Manager',
        description: 'Manages day-to-day operations and workflow.',
      },
      {
        id: 402,
        name: 'Supervisor',
        description: 'Supervises operational staff and processes.',
      },
      {
        id: 403,
        name: 'Techinician',
        description: 'Technical support and equipment maintenance.',
      },
      {
        id: 404,
        name: 'professional Techinician',
        description: 'Advanced technical specialist.',
      },
      {
        id: 405,
        name: 'Seinor Techinician',
        description: 'Senior technician leading technical operations.',
      },
      {
        id: 406,
        name: 'Quality Inspector',
        description: 'Ensures quality standards and compliance.',
      },
      {
        id: 407,
        name: 'Service Inspector',
        description: 'Inspects service delivery and customer satisfaction.',
      },
      {
        id: 408,
        name: 'Inspection Supoervsior',
        description: 'Supervises inspection team and processes.',
      },
      {
        id: 409,
        name: 'Qulaity Supervior',
        description: 'Quality supervisor ensuring product standards.',
      },
    ],
  },
]

const usersData = [
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

const loadDepartments = (): Department[] => {
  const stored = localStorage.getItem(ROLE_STORAGE_KEY)
  if (!stored) {
    return initialDepartments
  }

  try {
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? (parsed as Department[]) : initialDepartments
  } catch (error) {
    console.warn('Failed to parse stored departments:', error)
    return initialDepartments
  }
}

function DepartmentRoleManagement() {
  const [departments, setDepartments] = useState<Department[]>(loadDepartments)
  const [showAddDept, setShowAddDept] = useState(false)
  const [showEditDept, setShowEditDept] = useState(false)
  const [showAddRole, setShowAddRole] = useState(false)
  const [showEditRole, setShowEditRole] = useState(false)

  const [deptName, setDeptName] = useState('')
  const [deptDescription, setDeptDescription] = useState('')
  const [editDeptId, setEditDeptId] = useState<number | null>(null)
  const [editDeptName, setEditDeptName] = useState('')
  const [editDeptDescription, setEditDeptDescription] = useState('')

  const [roleDeptId, setRoleDeptId] = useState<number | null>(null)
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [editRoleId, setEditRoleId] = useState<number | null>(null)
  const [editRoleDeptId, setEditRoleDeptId] = useState<number | null>(null)
  const [editRoleName, setEditRoleName] = useState('')
  const [editRoleDescription, setEditRoleDescription] = useState('')

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    title: '',
    message: '',
    type: 'info',
    buttons: null,
  })

  const totalRoles = useMemo(
    () => departments.reduce((sum, dept) => sum + dept.roles.length, 0),
    [departments]
  )
  const avgRoles = departments.length
    ? (totalRoles / departments.length).toFixed(1)
    : '0'

  useEffect(() => {
    if (
      alertState.open &&
      alertState.type === 'success' &&
      (!alertState.buttons || alertState.buttons.length === 0)
    ) {
      const timer = setTimeout(() => {
        setAlertState((prev) => ({ ...prev, open: false }))
      }, 3000)
      return () => clearTimeout(timer)
    }

    return undefined
  }, [alertState])

  useEffect(() => {
    localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(departments))
    window.dispatchEvent(new Event(DEPARTMENT_ROLES_UPDATED_EVENT))
  }, [departments])

  const openAddDepartmentModal = () => {
    setDeptName('')
    setDeptDescription('')
    setShowAddDept(true)
  }

  const openEditDepartmentModal = (dept: Department) => {
    setEditDeptId(dept.id)
    setEditDeptName(dept.name)
    setEditDeptDescription(dept.description || '')
    setShowEditDept(true)
  }

  const openAddRoleModal = (dept: Department) => {
    setRoleDeptId(dept.id)
    setRoleName('')
    setRoleDescription('')
    setShowAddRole(true)
  }

  const openEditRoleModal = (deptId: number, role: Role) => {
    setEditRoleId(role.id)
    setEditRoleDeptId(deptId)
    setEditRoleName(role.name)
    setEditRoleDescription(role.description || '')
    setShowEditRole(true)
  }

  const closeModal = (modalType: ModalType) => {
    if (modalType === 'addDept') setShowAddDept(false)
    if (modalType === 'editDept') setShowEditDept(false)
    if (modalType === 'addRole') setShowAddRole(false)
    if (modalType === 'editRole') setShowEditRole(false)
  }

  const showAlert = (
    title: string,
    message: string,
    type: AlertType,
    buttons: AlertButton[] | null = null
  ) => {
    setAlertState({ open: true, title, message, type, buttons })
  }

  const closeAlert = () => {
    setAlertState((prev) => ({ ...prev, open: false, buttons: null }))
  }

  const saveNewDepartment = () => {
    const name = deptName.trim()
    const description = deptDescription.trim()

    if (!name) {
      showAlert('Error', 'Department name is required', 'error')
      return
    }

    const newId =
      departments.length > 0
        ? Math.max(...departments.map((dept) => dept.id)) + 1
        : 1

    setDepartments((prev) => [
      ...prev,
      {
        id: newId,
        name,
        description,
        roles: [],
      },
    ])

    closeModal('addDept')
    showAlert('Success', 'Department added successfully!', 'success')
  }

  const updateDepartment = () => {
    const name = editDeptName.trim()
    const description = editDeptDescription.trim()

    if (!name) {
      showAlert('Error', 'Department name is required', 'error')
      return
    }

    setDepartments((prev) =>
      prev.map((dept) =>
        dept.id === editDeptId
          ? { ...dept, name, description }
          : dept
      )
    )

    closeModal('editDept')
    showAlert('Success', 'Department updated successfully!', 'success')
  }

  const deleteDepartment = (dept: Department) => {
    const usersInDept = usersData.filter((user) => user.department === dept.name)

    if (usersInDept.length > 0) {
      showAlert(
        'Cannot Delete',
        `Department "${dept.name}" has ${usersInDept.length} users assigned. Please reassign or delete these users first.`,
        'warning'
      )
      return
    }

    showAlert(
      'Confirm Delete',
      `Are you sure you want to delete the department "${dept.name}"? This will also delete all roles in this department.`,
      'warning',
      [
        {
          text: 'Cancel',
          className: 'alert-btn-secondary',
          action: closeAlert,
        },
        {
          text: 'Delete',
          className: 'alert-btn-danger',
          action: () => {
            setDepartments((prev) => prev.filter((item) => item.id !== dept.id))
            closeAlert()
            showAlert(
              'Success',
              `Department "${dept.name}" deleted successfully!`,
              'success'
            )
          },
        },
      ]
    )
  }

  const saveNewRole = () => {
    const name = roleName.trim()
    const description = roleDescription.trim()

    if (!name) {
      showAlert('Error', 'Role name is required', 'error')
      return
    }

    const allRoleIds = departments.flatMap((dept) =>
      dept.roles.map((role) => role.id)
    )
    const newRoleId = allRoleIds.length > 0 ? Math.max(...allRoleIds) + 1 : 101

    setDepartments((prev) =>
      prev.map((dept) =>
        dept.id === roleDeptId
          ? {
              ...dept,
              roles: [...dept.roles, { id: newRoleId, name, description }],
            }
          : dept
      )
    )

    closeModal('addRole')
    showAlert('Success', 'Role added successfully!', 'success')
  }

  const updateRole = () => {
    const name = editRoleName.trim()
    const description = editRoleDescription.trim()

    if (!name) {
      showAlert('Error', 'Role name is required', 'error')
      return
    }

    setDepartments((prev) =>
      prev.map((dept) => {
        if (dept.id !== editRoleDeptId) return dept

        return {
          ...dept,
          roles: dept.roles.map((role) =>
            role.id === editRoleId ? { ...role, name, description } : role
          ),
        }
      })
    )

    closeModal('editRole')
    showAlert('Success', 'Role updated successfully!', 'success')
  }

  const deleteRole = (deptId: number, role: Role) => {
    const usersWithRole = usersData.filter((user) => user.role === role.name)

    if (usersWithRole.length > 0) {
      showAlert(
        'Cannot Delete',
        `Role "${role.name}" has ${usersWithRole.length} users assigned. Please reassign or delete these users first.`,
        'warning'
      )
      return
    }

    showAlert(
      'Confirm Delete',
      `Are you sure you want to delete the role "${role.name}"?`,
      'warning',
      [
        {
          text: 'Cancel',
          className: 'alert-btn-secondary',
          action: closeAlert,
        },
        {
          text: 'Delete',
          className: 'alert-btn-danger',
          action: () => {
            setDepartments((prev) =>
              prev.map((dept) =>
                dept.id === deptId
                  ? {
                      ...dept,
                      roles: dept.roles.filter((item) => item.id !== role.id),
                    }
                  : dept
              )
            )
            closeAlert()
            showAlert(
              'Success',
              `Role "${role.name}" deleted successfully!`,
              'success'
            )
          },
        },
      ]
    )
  }

  return (
    <div className="department-role-module">
      <div className="module-container">
        <div className="module-header">
          <h1>Department and Role Management</h1>
        </div>

        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-value">{departments.length}</div>
            <div className="stat-label">Departments</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{totalRoles}</div>
            <div className="stat-label">Total Roles</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{avgRoles}</div>
            <div className="stat-label">Avg Roles/Dept</div>
          </div>
        </div>

        <div className="section-header">
          <h2 className="section-title">Departments and Roles</h2>
          <button className="btn btn-primary" onClick={openAddDepartmentModal}>
            Add New Department
          </button>
        </div>

        {departments.length === 0 ? (
          <div className="empty-state">
            <h3>No Departments Yet</h3>
            <p>Click "Add New Department" to create your first department</p>
          </div>
        ) : (
          <div className="departments-container">
            {departments.map((dept) => (
              <div key={dept.id} className="department-item">
                <div className="department-header">
                  <div className="department-title">
                    <span>{dept.name}</span>
                    <span className="role-count">
                      {dept.roles.length} role
                      {dept.roles.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="department-actions">
                    <button
                      className="btn btn-success btn-small"
                      onClick={() => openAddRoleModal(dept)}
                    >
                      Add Role
                    </button>
                    <PermissionGate moduleId="department" optionId="department_actions">
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => openEditDepartmentModal(dept)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => deleteDepartment(dept)}
                      >
                        Delete
                      </button>
                    </PermissionGate>
                  </div>
                </div>
                <div className="department-body">
                  <div className="department-description">
                    {dept.description ? (
                      dept.description
                    ) : (
                      <em>No description provided</em>
                    )}
                  </div>
                  <div className="roles-section">
                    <div className="roles-header">
                      <div className="roles-title">
                        Department Roles ({dept.roles.length})
                      </div>
                    </div>
                    <div className="roles-list">
                      {dept.roles.length === 0 ? (
                        <div className="no-roles">
                          <p>
                            No roles in this department yet. Click "Add Role" to
                            create one.
                          </p>
                        </div>
                      ) : (
                        dept.roles.map((role, index) => (
                          <div key={role.id} className="role-item">
                            <div className="role-info">
                              <h4>
                                <span className="role-number">
                                  {index + 1}
                                </span>
                                <span className="role-title">{role.name}</span>
                              </h4>
                              <p>
                                {role.description || 'No description provided'}
                              </p>
                            </div>
                            <div className="role-actions">
                              <PermissionGate moduleId="department" optionId="department_roles">
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    className="btn btn-secondary btn-xsmall"
                                    onClick={() => openEditRoleModal(dept.id, role)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-danger btn-xsmall"
                                    onClick={() => deleteRole(dept.id, role)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </PermissionGate>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddDept && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add New Department</h3>
              <button
                type="button"
                className="close-modal"
                onClick={() => closeModal('addDept')}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                saveNewDepartment()
              }}
            >
              <div className="form-group">
                <label htmlFor="deptName">Department Name *</label>
                <input
                  id="deptName"
                  type="text"
                  placeholder="Enter department name"
                  value={deptName}
                  onChange={(event) => setDeptName(event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="deptDescription">Description</label>
                <textarea
                  id="deptDescription"
                  rows={4}
                  placeholder="Enter department description"
                  value={deptDescription}
                  onChange={(event) => setDeptDescription(event.target.value)}
                />
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-primary">
                  Add Department
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => closeModal('addDept')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddRole && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add New Role</h3>
              <button
                type="button"
                className="close-modal"
                onClick={() => closeModal('addRole')}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                saveNewRole()
              }}
            >
              <div className="form-group">
                <label htmlFor="roleName">Role Name *</label>
                <input
                  id="roleName"
                  type="text"
                  placeholder="Enter role name"
                  value={roleName}
                  onChange={(event) => setRoleName(event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="roleDescription">Role Description</label>
                <textarea
                  id="roleDescription"
                  rows={4}
                  placeholder="Enter role description"
                  value={roleDescription}
                  onChange={(event) => setRoleDescription(event.target.value)}
                />
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-success">
                  Add Role
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => closeModal('addRole')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditDept && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Department</h3>
              <button
                type="button"
                className="close-modal"
                onClick={() => closeModal('editDept')}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                updateDepartment()
              }}
            >
              <div className="form-group">
                <label htmlFor="editDeptName">Department Name *</label>
                <input
                  id="editDeptName"
                  type="text"
                  value={editDeptName}
                  onChange={(event) => setEditDeptName(event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="editDeptDescription">Description</label>
                <textarea
                  id="editDeptDescription"
                  rows={4}
                  value={editDeptDescription}
                  onChange={(event) =>
                    setEditDeptDescription(event.target.value)
                  }
                />
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => closeModal('editDept')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditRole && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Role</h3>
              <button
                type="button"
                className="close-modal"
                onClick={() => closeModal('editRole')}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                updateRole()
              }}
            >
              <div className="form-group">
                <label htmlFor="editRoleName">Role Name *</label>
                <input
                  id="editRoleName"
                  type="text"
                  value={editRoleName}
                  onChange={(event) => setEditRoleName(event.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="editRoleDescription">Role Description</label>
                <textarea
                  id="editRoleDescription"
                  rows={4}
                  value={editRoleDescription}
                  onChange={(event) =>
                    setEditRoleDescription(event.target.value)
                  }
                />
              </div>
              <div className="button-group">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => closeModal('editRole')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {alertState.open && (
        <div className="alert-popup" role="alertdialog" aria-modal="true">
          <div className="alert-content">
            <div className={`alert-header ${alertState.type}`}>
              <div className="alert-icon" />
              <div className="alert-title">{alertState.title}</div>
            </div>
            <div className="alert-body">
              <div className="alert-message">{alertState.message}</div>
              <div className="alert-actions">
                {alertState.buttons && alertState.buttons.length > 0 ? (
                  alertState.buttons.map((button, index) => (
                    <button
                      key={`${button.text}-${index}`}
                      type="button"
                      className={`alert-btn ${button.className}`}
                      onClick={button.action}
                    >
                      {button.text}
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    className="alert-btn alert-btn-primary"
                    onClick={closeAlert}
                  >
                    OK
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer>Department Management Module Copyright 2025</footer>
    </div>
  )
}

export default DepartmentRoleManagement
