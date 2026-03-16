import { useMemo, useState, useEffect, useRef } from 'react'
import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { createPortal } from 'react-dom'
import './SystemUserManagement.css'
import PermissionGate from './PermissionGate'
import { authService, type CognitoDirectoryUser } from './authService'
import { departmentService, roleService, userService } from './amplifyService'

type UserStatus = 'active' | 'inactive'
type DashboardAccess = 'allowed' | 'blocked'

interface SystemUser {
  id: string
  username: string
  employeeId: string
  name: string
  email: string
  mobile: string
  department: string
  role: string
  lineManager?: string
  status: UserStatus
  dashboardAccess: DashboardAccess
  createdDate?: string
  tempPassword?: string | null
  mustChangePassword?: boolean
  password?: string | null
  description?: string
  [key: string]: unknown
}

interface StoredUserProfile {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  employeeId?: string | null
  departmentId?: string | null
  roleId?: string | null
  lineManager?: string | null
  phone?: string | null
}

interface StoredDepartment {
  id: string
  name?: string | null
}

interface StoredRole {
  id: string
  name?: string | null
  departmentId?: string | null
}

const normalizeEmail = (value: string | null | undefined) => String(value || '').trim().toLowerCase()

const normalizeTextKey = (value: string | null | undefined) => String(value || '').trim().toLowerCase()

const buildProfileDisplayName = (profile: StoredUserProfile): string => {
  const firstName = String(profile.firstName || '').trim()
  const lastName = String(profile.lastName || '').trim()
  return `${firstName} ${lastName}`.trim()
}

const mergeCognitoAndProfileUsers = (
  cognitoUsers: CognitoDirectoryUser[],
  storedUsers: StoredUserProfile[],
  storedDepartments: StoredDepartment[],
  storedRoles: StoredRole[],
): SystemUser[] => {
  const profilesByEmail = new Map<string, StoredUserProfile>()
  storedUsers.forEach((profile) => {
    const key = normalizeEmail(profile.email)
    if (key && !profilesByEmail.has(key)) {
      profilesByEmail.set(key, profile)
    }
  })

  const departmentNamesById = new Map<string, string>()
  storedDepartments.forEach((department) => {
    const name = String(department.name || '').trim()
    if (department.id && name) {
      departmentNamesById.set(department.id, name)
    }
  })

  const roleById = new Map<string, { name: string; departmentId: string }>()
  storedRoles.forEach((role) => {
    const name = String(role.name || '').trim()
    if (role.id && name) {
      roleById.set(role.id, {
        name,
        departmentId: String(role.departmentId || ''),
      })
    }
  })

  return cognitoUsers.map((cognitoUser) => {
    const merged = mapCognitoUserToSystemUser(cognitoUser)
    const profile = profilesByEmail.get(normalizeEmail(cognitoUser.email))
    if (!profile) {
      return merged
    }

    const profileName = buildProfileDisplayName(profile)
    const departmentFromProfile = profile.departmentId
      ? (departmentNamesById.get(profile.departmentId) || '')
      : ''
    const roleFromProfile = profile.roleId ? roleById.get(profile.roleId)?.name || '' : ''

    return {
      ...merged,
      employeeId: String(profile.employeeId || '').trim() || merged.employeeId,
      name: profileName || merged.name,
      mobile: merged.mobile || String(profile.phone || '').trim(),
      department: departmentFromProfile || merged.department,
      role: roleFromProfile || merged.role,
      lineManager: String(profile.lineManager || '').trim() || merged.lineManager || '',
    }
  })
}

const resolveDepartmentAndRoleIds = (
  departmentName: string,
  roleName: string,
  storedDepartments: StoredDepartment[],
  storedRoles: StoredRole[],
): { departmentId?: string; roleId?: string } => {
  const normalizedDepartment = normalizeTextKey(departmentName)
  const normalizedRole = normalizeTextKey(roleName)

  const departmentMatch = storedDepartments.find(
    (department) => normalizeTextKey(department.name) === normalizedDepartment,
  )

  const roleCandidates = storedRoles.filter(
    (role) => normalizeTextKey(role.name) === normalizedRole,
  )

  const roleMatch = departmentMatch?.id
    ? roleCandidates.find(
      (role) => String(role.departmentId || '') === departmentMatch.id,
    )
    : roleCandidates[0]

  return {
    departmentId: departmentMatch?.id,
    roleId: roleMatch?.id,
  }
}

const mapCognitoUserToSystemUser = (user: CognitoDirectoryUser): SystemUser => {
  return {
    id: user.id || user.username || user.email,
    username: user.username,
    employeeId: user.employeeId || user.username || 'N/A',
    name: user.name || user.email,
    email: user.email,
    mobile: user.mobile || '',
    department: user.department || '',
    role: user.role || '',
    lineManager: user.lineManager || '',
    status: user.status === 'inactive' ? 'inactive' : 'active',
    dashboardAccess: user.dashboardAccess === 'blocked' ? 'blocked' : 'allowed',
    createdDate: user.createdDate || '',
    tempPassword: null,
    mustChangePassword: Boolean(user.mustChangePassword),
    password: null,
    description: user.cognitoStatus || '',
  }
}

interface UserFormState {
  employeeId: string
  name: string
  email: string
  mobile: string
  department: string
  role: string
  lineManager: string
}

interface DepartmentRoleRecord {
  name: string
  roles: Array<{
    name: string
  }>
}

const ROLE_STORAGE_KEY = 'department_roles'
const DEPARTMENT_ROLES_UPDATED_EVENT = 'department-roles-updated'

const sortText = (left: string, right: string) => left.localeCompare(right)

const asDepartmentRoleRecord = (entry: unknown): DepartmentRoleRecord | null => {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  const record = entry as {
    name?: unknown
    roles?: unknown
  }

  const name = typeof record.name === 'string' ? record.name.trim() : ''
  if (!name) {
    return null
  }

  const rawRoles = Array.isArray(record.roles) ? record.roles : []
  const roles = rawRoles
    .map((roleEntry) => {
      if (typeof roleEntry === 'string') {
        const roleName = roleEntry.trim()
        return roleName ? { name: roleName } : null
      }

      if (!roleEntry || typeof roleEntry !== 'object') {
        return null
      }

      const roleName =
        typeof (roleEntry as { name?: unknown }).name === 'string'
          ? ((roleEntry as { name: string }).name || '').trim()
          : ''

      return roleName ? { name: roleName } : null
    })
    .filter((role): role is { name: string } => Boolean(role))

  return {
    name,
    roles,
  }
}

const loadDepartmentRoleRecords = (): DepartmentRoleRecord[] => {
  const stored = localStorage.getItem(ROLE_STORAGE_KEY)
  if (!stored) {
    return []
  }

  try {
    const parsed = JSON.parse(stored) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map(asDepartmentRoleRecord)
      .filter((record): record is DepartmentRoleRecord => Boolean(record))
  } catch {
    return []
  }
}

const emptyForm: UserFormState = {
  employeeId: '',
  name: '',
  email: '',
  mobile: '',
  department: '',
  role: '',
  lineManager: '',
}

const parseName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || 'User',
    lastName: parts.slice(1).join(' ') || 'User',
  }
}

const normalizePhoneForCognito = (value: string) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return null

  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '')
    if (digits.length < 8 || digits.length > 15) return null
    return `+${digits}`
  }

  const digitsOnly = trimmed.replace(/\D/g, '')
  if (digitsOnly.startsWith('00') && digitsOnly.length > 2) {
    const international = digitsOnly.slice(2)
    if (international.length < 8 || international.length > 15) return null
    return `+${international}`
  }

  if (digitsOnly.length < 8 || digitsOnly.length > 15) return null
  return `+${digitsOnly}`
}

const generateTemporaryPassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const numbers = '23456789'
  const symbols = '!@#$%&*?'
  const all = `${upper}${lower}${numbers}${symbols}`

  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)]

  const chars = [pick(upper), pick(lower), pick(numbers), pick(symbols)]
  while (chars.length < 12) {
    chars.push(pick(all))
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = chars[i]
    chars[i] = chars[j]
    chars[j] = temp
  }

  return chars.join('')
}

const hasName = (error: unknown): error is { name: string } => {
  return typeof error === 'object' && error !== null && 'name' in error && typeof (error as { name: unknown }).name === 'string'
}

const hasMessage = (error: unknown): error is { message: string } => {
  return typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string'
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'string') return error
  if (hasMessage(error)) return error.message

  if (typeof error === 'object' && error !== null && 'errors' in error) {
    const maybeErrors = (error as { errors?: unknown }).errors
    if (Array.isArray(maybeErrors)) {
      const firstMessage = maybeErrors
        .map((entry) => {
          if (typeof entry !== 'object' || entry === null || !('message' in entry)) return null
          const message = (entry as { message?: unknown }).message
          return typeof message === 'string' ? message : null
        })
        .find((message): message is string => Boolean(message))

      if (firstMessage) {
        return firstMessage
      }
    }
  }

  return 'Unknown error'
}

const getErrorName = (error: unknown) => {
  if (hasName(error)) return error.name
  return ''
}

const isUsernameExistsError = (error: unknown) => {
  return getErrorName(error) === 'UsernameExistsException'
}

const isUserNotFoundError = (error: unknown) => {
  return getErrorName(error) === 'UserNotFoundException'
}

const isUserNotConfirmedError = (error: unknown) => {
  return getErrorName(error) === 'UserNotConfirmedException'
}

const isNoVerifiedContactError = (error: unknown) => {
  const message = getErrorMessage(error).toLowerCase()
  return (
    message.includes('no registered/verified email or phone_number') ||
    message.includes('no registered/verified email or phone number')
  )
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
  const [users, setUsers] = useState<SystemUser[]>([])
  const [departmentRoleRecords, setDepartmentRoleRecords] = useState<DepartmentRoleRecord[]>(
    () => loadDepartmentRoleRecords()
  )
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [savingEditUser, setSavingEditUser] = useState(false)
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    title: '',
    message: '',
    type: 'info',
  })
  const [formState, setFormState] = useState<UserFormState>(emptyForm)
  const [editFormState, setEditFormState] = useState<UserFormState>(emptyForm)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  const upsertSystemUserProfile = async (input: {
    email: string
    previousEmail?: string
    fullName: string
    employeeId: string
    department: string
    role: string
    lineManager: string
    phone: string
  }) => {
    const [storedUsersRaw, storedDepartmentsRaw, storedRolesRaw] = await Promise.all([
      userService.getAll(),
      departmentService.getAll(),
      roleService.getAll(),
    ])

    const storedUsers = (storedUsersRaw || []) as StoredUserProfile[]
    const storedDepartments = (storedDepartmentsRaw || []) as StoredDepartment[]
    const storedRoles = (storedRolesRaw || []) as StoredRole[]

    const ensureDepartmentAndRoleIds = async (): Promise<{ departmentId?: string; roleId?: string }> => {
      let { departmentId, roleId } = resolveDepartmentAndRoleIds(
        input.department,
        input.role,
        storedDepartments,
        storedRoles,
      )

      const trimmedDepartmentName = input.department.trim()
      const trimmedRoleName = input.role.trim()

      if (!departmentId && trimmedDepartmentName) {
        const createdDepartment = await departmentService.create({
          name: trimmedDepartmentName,
          status: 'active',
        }) as StoredDepartment | null

        if (createdDepartment?.id) {
          storedDepartments.push(createdDepartment)
          departmentId = createdDepartment.id
        }
      }

      if (!roleId && trimmedRoleName) {
        const createdRole = await roleService.create({
          name: trimmedRoleName,
          departmentId: departmentId || undefined,
          status: 'active',
        }) as StoredRole | null

        if (createdRole?.id) {
          storedRoles.push(createdRole)
          roleId = createdRole.id
        }
      }

      return { departmentId, roleId }
    }

    const { firstName, lastName } = parseName(input.fullName)
    const { departmentId, roleId } = await ensureDepartmentAndRoleIds()

    const normalizedTargetEmail = normalizeEmail(input.email)
    const normalizedPreviousEmail = normalizeEmail(input.previousEmail)

    const existingProfile = storedUsers.find((profile) => {
      const profileEmail = normalizeEmail(profile.email)
      if (!profileEmail) {
        return false
      }

      return (
        profileEmail === normalizedTargetEmail ||
        (Boolean(normalizedPreviousEmail) && profileEmail === normalizedPreviousEmail)
      )
    })

    const payload = {
      firstName,
      lastName,
      email: input.email,
      employeeId: input.employeeId.trim() || undefined,
      departmentId: departmentId || undefined,
      roleId: roleId || undefined,
      lineManager: input.lineManager.trim() || undefined,
      phone: input.phone,
      status: 'active' as const,
    }

    if (existingProfile?.id) {
      await userService.update(existingProfile.id, payload)
      return
    }

    await userService.create(payload)
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const cognitoUsers = await authService.listCognitoUsers()
      const [storedUsersRaw, storedDepartmentsRaw, storedRolesRaw] = await Promise.all([
        userService.getAll().catch((error) => {
          console.warn('Failed to load stored user profiles:', error)
          return []
        }),
        departmentService.getAll().catch((error) => {
          console.warn('Failed to load departments:', error)
          return []
        }),
        roleService.getAll().catch((error) => {
          console.warn('Failed to load roles:', error)
          return []
        }),
      ])

      const mappedUsers = mergeCognitoAndProfileUsers(
        cognitoUsers,
        (storedUsersRaw || []) as StoredUserProfile[],
        (storedDepartmentsRaw || []) as StoredDepartment[],
        (storedRolesRaw || []) as StoredRole[],
      )
      setUsers(mappedUsers)
    } catch (error) {
      console.error('Failed to load Cognito users:', error)
      showAlertMessage({
        title: 'Error',
        message: `Failed to load Cognito users: ${getErrorMessage(error)}`,
        type: 'error',
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    const refreshDepartmentRoleRecords = () => {
      setDepartmentRoleRecords(loadDepartmentRoleRecords())
    }

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === ROLE_STORAGE_KEY) {
        refreshDepartmentRoleRecords()
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(DEPARTMENT_ROLES_UPDATED_EVENT, refreshDepartmentRoleRecords as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(DEPARTMENT_ROLES_UPDATED_EVENT, refreshDepartmentRoleRecords as EventListener)
    }
  }, [])

  // Refs for focus management
  const employeeIdRef = useRef<HTMLInputElement>(null)

  const detailsUser = useMemo(
    () => users.find((user: SystemUser) => user.id === detailsUserId) || null,
    [users, detailsUserId]
  )

  const departments = useMemo(() => {
    const fromDepartmentRoles = departmentRoleRecords
      .map((department) => department.name)
      .filter((departmentName) => Boolean(departmentName && departmentName.trim()))

    if (fromDepartmentRoles.length > 0) {
      return Array.from(new Set(fromDepartmentRoles)).sort(sortText)
    }

    const fromUsers = users
      .map((user: SystemUser) => user.department)
      .filter((departmentName) => Boolean(departmentName && departmentName.trim()))

    return Array.from(new Set(fromUsers)).sort(sortText)
  }, [departmentRoleRecords, users])

  const fallbackRoles = useMemo(() => {
    const fromUsers = users
      .map((user: SystemUser) => user.role)
      .filter((roleName) => Boolean(roleName && roleName.trim()))

    return Array.from(new Set(fromUsers)).sort(sortText)
  }, [users])

  const allRolesFromDepartmentDatabase = useMemo(() => {
    const allRoles = departmentRoleRecords.flatMap((department) =>
      department.roles
        .map((role) => role.name)
        .filter((roleName) => Boolean(roleName && roleName.trim()))
    )

    return Array.from(new Set(allRoles)).sort(sortText)
  }, [departmentRoleRecords])

  const lineManagers = useMemo(() => {
    const names = users
      .map((user: SystemUser) => user.name)
      .filter((name) => Boolean(name && name.trim()))

    return Array.from(new Set(names)).sort(sortText)
  }, [users])

  const editLineManagers = useMemo(() => {
    const set = new Set(lineManagers)
    const selectedLineManager = editFormState.lineManager.trim()

    if (selectedLineManager) {
      set.add(selectedLineManager)
    }

    return Array.from(set).sort(sortText)
  }, [lineManagers, editFormState.lineManager])

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const terms = searchQuery
      .toLowerCase()
      .split(' ')
      .filter((term) => term.trim())
    return users.filter((user: SystemUser) =>
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
    const activeUsers = users.filter((u: SystemUser) => u.status === 'active').length
    const inactiveUsers = users.filter((u: SystemUser) => u.status === 'inactive').length
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
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) {
        return
      }

      const isDropdownButton = target.closest('.btn-action-dropdown')
      const isDropdownMenu = target.closest('.action-dropdown-menu')

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
    setEditingUserId(null)
    document.body.style.overflow = 'auto'
  }

  const openModal = (setter: Dispatch<SetStateAction<boolean>>) => {
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

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number.parseInt(event.target.value, 10))
    setCurrentPage(1)
  }

  const openAddUserModal = () => {
    setFormState(emptyForm)
    openModal(setShowAddUserModal)
  }

  const openEditUserModal = (user: SystemUser) => {
    setEditingUserId(user.id)
    setEditFormState({
      employeeId: user.employeeId || '',
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      department: user.department,
      role: user.role,
      lineManager: user.lineManager || '',
    })
    openModal(setShowEditUserModal)
  }

  const saveUser = async () => {
    const { employeeId, name, email, mobile, department, role } = formState
    if (!employeeId || !name || !email || !mobile || !department || !role) {
      showAlertMessage({
        title: 'Error',
        message: 'Please fill in all required fields!',
        type: 'error',
      })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Check if email already exists in Cognito listing
    const existingUser = users.find(
      (u: SystemUser) => u.email.trim().toLowerCase() === normalizedEmail
    )
    if (existingUser) {
      showAlertMessage({
        title: 'Error',
        message: 'A Cognito account with this email already exists.',
        type: 'error',
      })
      return
    }

    const normalizedMobile = normalizePhoneForCognito(mobile)
    if (!normalizedMobile) {
      showAlertMessage({
        title: 'Error',
        message: 'Mobile must be in international format, e.g. +971501234567.',
        type: 'error',
      })
      return
    }

    const temporaryPassword = generateTemporaryPassword()
    const fullName = name.trim()

    try {
      const inviteResult = await authService.sendUserInvitation({
        email: normalizedEmail,
        fullName,
        phoneNumber: normalizedMobile,
        temporaryPassword,
      })

      if (!inviteResult.success) {
        if (inviteResult.userAlreadyExists) {
          let profileSyncError = ''
          try {
            await upsertSystemUserProfile({
              email: normalizedEmail,
              fullName,
              employeeId,
              department,
              role,
              lineManager: formState.lineManager,
              phone: normalizedMobile,
            })
          } catch (profileError) {
            profileSyncError = getErrorMessage(profileError)
          }

          showAlertMessage({
            title: profileSyncError ? 'Warning' : 'Info',
            message: profileSyncError
              ? `Cognito already has an account for ${normalizedEmail}. ${inviteResult.message} Profile sync failed: ${profileSyncError}`
              : `Cognito already has an account for ${normalizedEmail}. ${inviteResult.message} Profile was synced in system storage.`,
            type: profileSyncError ? 'warning' : 'info',
          })
          await loadUsers()
          closeAllModals()
          return
        }

        showAlertMessage({
          title: 'Error',
          message: `Cognito invitation failed: ${inviteResult.message}`,
          type: 'error',
        })
        return
      }

      let profileSyncError = ''
      try {
        await upsertSystemUserProfile({
          email: normalizedEmail,
          fullName,
          employeeId,
          department,
          role,
          lineManager: formState.lineManager,
          phone: normalizedMobile,
        })
      } catch (profileError) {
        profileSyncError = getErrorMessage(profileError)
      }

      await loadUsers()
      closeAllModals()

      const invitationMessage = inviteResult.invitationResent
        ? `Existing Cognito invitation was resent to ${normalizedEmail}. Share this temporary password securely: ${temporaryPassword}`
        : `Cognito invitation email was sent to ${normalizedEmail}. Share this temporary password securely: ${temporaryPassword}`

      showAlertMessage({
        title: profileSyncError ? 'Warning' : 'Success',
        message: profileSyncError
          ? `${invitationMessage} Profile sync failed: ${profileSyncError}`
          : `${invitationMessage} User profile was also saved in system storage.`,
        type: profileSyncError ? 'warning' : 'success',
      })
    } catch (cognitoError) {
      showAlertMessage({
        title: 'Error',
        message: `Cognito invitation request failed: ${getErrorMessage(cognitoError)}`,
        type: 'error',
      })
    }
  }

  const saveEditUser = async () => {
    if (savingEditUser) {
      return
    }

    const editingUser = users.find((user: SystemUser) => user.id === editingUserId)
    if (!editingUser) {
      showAlertMessage({
        title: 'Error',
        message: 'The selected Cognito user could not be found. Refresh the list and try again.',
        type: 'error',
      })
      return
    }

    const fullName = editFormState.name.trim()
    const normalizedEmail = editFormState.email.trim().toLowerCase()
    const department = editFormState.department.trim()
    const role = editFormState.role.trim()
    const lineManager = editFormState.lineManager.trim()
    const normalizedMobile = normalizePhoneForCognito(editFormState.mobile)

    if (!fullName || !normalizedEmail || !department || !role || !normalizedMobile) {
      showAlertMessage({
        title: 'Error',
        message: 'Please complete all required fields. Mobile must be in international format, e.g. +971501234567.',
        type: 'error',
      })
      return
    }

    const duplicateUser = users.find(
      (user: SystemUser) =>
        user.id !== editingUser.id && user.email.trim().toLowerCase() === normalizedEmail
    )

    if (duplicateUser) {
      showAlertMessage({
        title: 'Error',
        message: `A Cognito account with email ${normalizedEmail} already exists.`,
        type: 'error',
      })
      return
    }

    setSavingEditUser(true)

    try {
      const result = await authService.updateCognitoUser({
        username: editingUser.username,
        fullName,
        email: normalizedEmail,
        phoneNumber: normalizedMobile,
        department,
        role,
        lineManager,
      })

      let profileSyncError = ''
      try {
        await upsertSystemUserProfile({
          email: normalizedEmail,
          previousEmail: editingUser.email,
          fullName,
          employeeId: editFormState.employeeId,
          department,
          role,
          lineManager,
          phone: normalizedMobile,
        })
      } catch (profileError) {
        profileSyncError = getErrorMessage(profileError)
      }

      await loadUsers()
      closeAllModals()
      showAlertMessage({
        title: profileSyncError ? 'Warning' : 'Success',
        message: profileSyncError
          ? `${result.message} Cognito was updated, but profile sync failed: ${profileSyncError}`
          : `${result.message} User profile was also updated in system storage.`,
        type: profileSyncError ? 'warning' : 'success',
      })
    } catch (error) {
      showAlertMessage({
        title: 'Error',
        message: `Failed to update Cognito user: ${getErrorMessage(error)}`,
        type: 'error',
      })
    } finally {
      setSavingEditUser(false)
    }
  }

  const confirmDeleteUser = () => {
    if (!userToDelete) return

    closeAllModals()
    showAlertMessage({
      title: 'Info',
      message:
        `Delete user is disabled in this screen for Cognito-sourced users. Remove ${userToDelete.email} through Cognito-backed admin APIs.`,
      type: 'info',
    })
  }

  const openDeleteModal = (user: SystemUser) => {
    setUserToDelete(user)
    showAlertMessage({
      title: 'Confirm Delete',
      message: `Delete is currently disabled in this screen for Cognito users. Continue to view guidance for ${user.email}?`,
      type: 'warning',
      buttons: [
        {
          text: 'Cancel',
          class: 'alert-btn-secondary',
          action: closeAlert,
        },
        {
          text: 'Continue',
          class: 'alert-btn-primary',
          action: confirmDeleteUser,
        },
      ],
    })
  }

  const openDetailsView = (userId: string) => {
    setDetailsUserId(userId)
  }

  const closeDetailsView = () => {
    setDetailsUserId(null)
  }

  const resetPassword = async (userId: string) => {
    const user = users.find((u: SystemUser) => u.id === userId)
    if (!user) {
      showAlertMessage({
        title: 'Error',
        message: 'User not found',
        type: 'error',
      })
      return
    }

    const normalizedEmail = user.email.trim().toLowerCase()

    try {
      await authService.requestPasswordReset(normalizedEmail)
      showAlertMessage({
        title: 'Success',
        message: `Cognito password reset code has been sent to ${normalizedEmail}`,
        type: 'success',
      })
      return
    } catch (cognitoError) {
      if (isUserNotConfirmedError(cognitoError)) {
        try {
          await authService.resendSignUpCode(normalizedEmail)
          showAlertMessage({
            title: 'Info',
            message: `User exists in Cognito but is not confirmed. A verification email was resent to ${normalizedEmail}. Confirm the account first, then retry Reset Password.`,
            type: 'info',
          })
          return
        } catch (resendError) {
          showAlertMessage({
            title: 'Error',
            message: `Cognito verification resend failed: ${getErrorMessage(resendError)}`,
            type: 'error',
          })
          return
        }
      }

      if (isNoVerifiedContactError(cognitoError)) {
        try {
          await authService.resendSignUpCode(normalizedEmail)
          showAlertMessage({
            title: 'Info',
            message: `Password reset requires a verified contact. A verification email was resent to ${normalizedEmail}. Complete verification first, then retry Reset Password.`,
            type: 'info',
          })
          return
        } catch (resendError) {
          showAlertMessage({
            title: 'Error',
            message: `Password reset requires a verified email or phone number for ${normalizedEmail}. Verify the user contact in Cognito, then retry. (${getErrorMessage(resendError)})`,
            type: 'error',
          })
          return
        }
      }

      if (isUserNotFoundError(cognitoError)) {
        const temporaryPassword = generateTemporaryPassword()
        const { firstName, lastName } = parseName(user.name)
        const fullName = user.name.trim()
        const normalizedMobile = normalizePhoneForCognito(user.mobile)
        if (!normalizedMobile) {
          showAlertMessage({
            title: 'Error',
            message: `Cannot create Cognito account for ${normalizedEmail}. Update the mobile number to international format (e.g. +971501234567) and retry.`,
            type: 'error',
          })
          return
        }

        try {
          await authService.signUp({
            email: normalizedEmail,
            password: temporaryPassword,
            firstName,
            lastName,
            fullName,
            phoneNumber: normalizedMobile,
          })

          showAlertMessage({
            title: 'Info',
            message: `No Cognito account existed for ${normalizedEmail}. A Cognito verification email has now been sent. Confirm the account, then click Reset Password again.`,
            type: 'info',
          })
          return
        } catch (signUpError) {
          if (isUsernameExistsError(signUpError)) {
            try {
              await authService.resendSignUpCode(normalizedEmail)
              showAlertMessage({
                title: 'Info',
                message: `A Cognito account exists for ${normalizedEmail}. Verification email was resent. Confirm the account, then retry Reset Password.`,
                type: 'info',
              })
              return
            } catch (resendError) {
              showAlertMessage({
                title: 'Error',
                message: `Cognito verification resend failed: ${getErrorMessage(resendError)}`,
                type: 'error',
              })
              return
            }
          }

          showAlertMessage({
            title: 'Error',
            message: `Failed to create Cognito account for reset flow: ${getErrorMessage(signUpError)}`,
            type: 'error',
          })
          return
        }
      }

      showAlertMessage({
        title: 'Error',
        message: `Cognito reset email failed: ${getErrorMessage(cognitoError)}`,
        type: 'error',
      })
    }
  }

  const toggleUserStatus = (userId: string) => {
    const user = users.find((u: SystemUser) => u.id === userId)
    if (!user) return

    showAlertMessage({
      title: 'Info',
      message:
        `Status toggle is disabled in this screen for Cognito users (${user.email}). Use Cognito-backed admin APIs to enable or disable accounts.`,
      type: 'info',
    })
  }

  const toggleDashboardAccess = (userId: string) => {
    const user = users.find((u: SystemUser) => u.id === userId)
    if (!user || user.status !== 'active') return

    showAlertMessage({
      title: 'Info',
      message:
        `Dashboard access toggle is disabled in this screen for Cognito users (${user.email}). Manage access through role/permission configuration.`,
      type: 'info',
    })
  }

  const departmentRoles = useMemo(() => {
    const selectedDepartment = departmentRoleRecords.find(
      (department) => department.name === formState.department
    )

    if (selectedDepartment) {
      return Array.from(new Set(selectedDepartment.roles.map((role) => role.name))).sort(sortText)
    }

    if (allRolesFromDepartmentDatabase.length > 0) {
      return allRolesFromDepartmentDatabase
    }

    return fallbackRoles
  }, [departmentRoleRecords, formState.department, allRolesFromDepartmentDatabase, fallbackRoles])

  const editDepartmentRoles = useMemo(() => {
    const selectedDepartment = departmentRoleRecords.find(
      (department) => department.name === editFormState.department
    )

    if (selectedDepartment) {
      return Array.from(new Set(selectedDepartment.roles.map((role) => role.name))).sort(sortText)
    }

    if (allRolesFromDepartmentDatabase.length > 0) {
      return allRolesFromDepartmentDatabase
    }

    return fallbackRoles
  }, [departmentRoleRecords, editFormState.department, allRolesFromDepartmentDatabase, fallbackRoles])

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
            {loadingUsers && <p className="page-description">Syncing users from Cognito...</p>}
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
                    <td colSpan={9} className="empty-table-cell">
                      <div className="empty-state">
                        <i className="fas fa-user-slash"></i>
                        <h3>No Users Found</h3>
                        <p>Try adjusting your search or add a new user</p>
                      </div>
                    </td>
                  </tr>
                )}
                {paginatedUsers.map((user: SystemUser) => (
                  <tr key={user.id}>
                    <td>
                      <span className="employee-id-badge">{user.employeeId}</span>
                    </td>
                    <td className="user-name-cell">{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.mobile}</td>
                    <td>
                      <span className="dept-badge">{user.department || 'Not set'}</span>
                    </td>
                    <td>
                      <span className="role-badge">{user.role || 'Not set'}</span>
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
                      const user = users.find((entry: SystemUser) => entry.id === activeDropdown)
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
                      const user = users.find((entry: SystemUser) => entry.id === activeDropdown)
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
                    <span className="dept-badge">{detailsUser.department || 'Not set'}</span>
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Role</span>
                  <span className="info-value">
                    <span className="role-badge">{detailsUser.role || 'Not set'}</span>
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
                  placeholder="e.g., +971501234567"
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
                  disabled={!formState.department}
                  required
                >
                  <option value="">{formState.department ? 'Select Role' : 'Select Department First'}</option>
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
                  disabled={!editFormState.department}
                  required
                >
                  <option value="">{editFormState.department ? 'Select Role' : 'Select Department First'}</option>
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
                  {editLineManagers.map(manager => (
                    <option key={manager} value={manager}>{manager}</option>
                  ))}
                </select>
              </div>

              <div className="button-group">
                <button type="submit" className="btn btn-primary" disabled={savingEditUser}>
                  {savingEditUser ? 'Saving...' : 'Save Changes'}
                </button>
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