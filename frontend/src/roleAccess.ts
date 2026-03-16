import { useEffect, useState } from 'react'
import { getCurrentUser as getSystemUser } from './userService.ts'

const ROLE_STORAGE_KEY = 'department_roles'
const PERMISSIONS_UPDATED_EVENT = 'role-permissions-updated'
const PERCENT_STORAGE_PREFIX = 'permissionPercents_'

const DEFAULT_PERCENT_LIMITS: Record<string, number> = {
  joborder_discount_percent: 20,
  joborder_servicediscount_percent: 15,
  inspection_discount_percent: 15,
  serviceexec_assigned_discount_percent: 15,
  serviceexec_unassigned_discount_percent: 15,
  serviceexec_team_discount_percent: 15,
  payment_discount_percent: 10,
}

const DEFAULT_ROLE_MAP = {
  administrator: 'admin',
  'service manager': 'manager',
  'service technician': 'technician',
  'service advisor': 'advisor',
  cashier: 'cashier',
  'view only': 'viewer',
}

const TEST99_EMAILS = new Set(['test99@rodeodrive.com', 'test99@redoedrive.com'])
const FULL_ACCESS_USER_IDENTIFIERS = new Set([
  'mohd.haggo',
  'mohd.haggo@rodeodrive.com',
])
const FULL_ACCESS_IDENTITIES = new Set([
  'mohd.haggo',
  'mohd.haggo@rodeodrive.com',
])

const normalize = (value: string | undefined | null): string => (value || '').trim().toLowerCase()

const getLocalPart = (email: string): string => {
  const atIndex = email.indexOf('@')
  return atIndex === -1 ? email : email.slice(0, atIndex)
}

const isTest99User = (user: any): boolean => {
  if (!user) {
    return false
  }

  const normalizedEmail = normalize(user.email)
  const normalizedUsername = normalize(user.username)
  const normalizedEmployeeId = normalize(user.employeeId)
  const normalizedName = normalize(user.name)
  const emailLocalPart = getLocalPart(normalizedEmail)
  const usernameLocalPart = getLocalPart(normalizedUsername)

  return (
    TEST99_EMAILS.has(normalizedEmail) ||
    FULL_ACCESS_IDENTITIES.has(normalizedEmail) ||
    FULL_ACCESS_IDENTITIES.has(normalizedUsername) ||
    FULL_ACCESS_IDENTITIES.has(emailLocalPart) ||
    FULL_ACCESS_IDENTITIES.has(usernameLocalPart) ||
    normalizedEmployeeId === 'ep0001' ||
    normalizedName === 'test number 99'
  )
}

const isFullAccessOverrideUser = (user: any): boolean => {
  if (!user) {
    return false
  }

  const normalizedEmail = normalize(user.email)
  const normalizedUsername = normalize(user.username)
  const normalizedName = normalize(user.name)
  const emailLocalPart = normalizedEmail.includes('@')
    ? normalizedEmail.split('@')[0]
    : normalizedEmail

  return (
    FULL_ACCESS_USER_IDENTIFIERS.has(normalizedEmail) ||
    FULL_ACCESS_USER_IDENTIFIERS.has(emailLocalPart) ||
    FULL_ACCESS_USER_IDENTIFIERS.has(normalizedUsername) ||
    normalizedName === 'mohd haggo'
  )
}

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value))

const parsePercent = (value: unknown, fallbackValue: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clampPercent(value)
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return clampPercent(parsed)
    }
  }

  return clampPercent(fallbackValue)
}

const loadDepartmentRoles = () => {
  const stored = localStorage.getItem(ROLE_STORAGE_KEY)
  if (!stored) {
    return []
  }

  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn('Failed to parse stored roles:', error)
    return []
  }
}

const findRoleValue = (roleName: string): string | null => {
  const normalized = normalize(roleName)
  if (!normalized) {
    return null
  }

  const departments = loadDepartmentRoles()
  for (const dept of departments) {
    for (const role of dept.roles || []) {
      if (normalize(role.name) === normalized) {
        return `role_${role.id}`
      }
    }
  }

  return (DEFAULT_ROLE_MAP as Record<string, string>)[normalized] || null
}

const loadPercentValues = (roleValue: string | null): Record<string, unknown> | null => {
  if (!roleValue) {
    return null
  }

  const stored = localStorage.getItem(`${PERCENT_STORAGE_PREFIX}${roleValue}`)
  if (!stored) {
    return null
  }

  try {
    const parsed = JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    return parsed as Record<string, unknown>
  } catch (error) {
    console.warn('Failed to parse permission percentages:', error)
    return null
  }
}

const loadPermissions = (roleValue: string | null) => {
  if (!roleValue) {
    return null
  }

  const stored = localStorage.getItem(`permissions_${roleValue}`)
  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored)
  } catch (error) {
    console.warn('Failed to parse permissions:', error)
    return null
  }
}

export const getRolePermissionsForUser = (user: any) => {
  if (!user) {
    return null
  }

  if (isTest99User(user) || isFullAccessOverrideUser(user)) {
    return {
      __fullAccess: true,
    }
  }

  const roleValue = getRoleValueForUser(user)
  return loadPermissions(roleValue)
}

export const getRoleValueForUser = (user: any): string | null => {
  if (!user?.role) {
    return null
  }

  return findRoleValue(user.role)
}

export const getRolePercentLimit = (
  roleValue: string | null,
  optionId: string,
  fallbackValue = 100
): number => {
  const defaultLimit = DEFAULT_PERCENT_LIMITS[optionId] ?? fallbackValue
  const percentValues = loadPercentValues(roleValue)

  if (!percentValues) {
    return clampPercent(defaultLimit)
  }

  return parsePercent(percentValues[optionId], defaultLimit)
}

export const getRolePercentLimitForUser = (
  user: any,
  optionId: string,
  fallbackValue = 100
): number => {
  const roleValue = getRoleValueForUser(user)
  return getRolePercentLimit(roleValue, optionId, fallbackValue)
}

export const getCurrentUserPercentLimit = (optionId: string, fallbackValue = 100): number => {
  const user = getSystemUser()
  return getRolePercentLimitForUser(user, optionId, fallbackValue)
}

export const hasModuleAccess = (permissions: any, moduleId: string): boolean => {
  if (permissions?.__fullAccess) {
    return true
  }

  if (!permissions || !permissions[moduleId]) {
    return false
  }

  return Boolean(permissions[moduleId].enabled)
}

export const hasOptionAccess = (permissions: any, moduleId: string, optionId?: string): boolean => {
  if (permissions?.__fullAccess) {
    return true
  }

  if (!permissions || !permissions[moduleId]) {
    return false
  }

  if (!optionId) {
    return Boolean(permissions[moduleId].enabled)
  }

  return Boolean(permissions[moduleId].enabled && permissions[moduleId].options?.[optionId])
}

export const notifyPermissionsUpdated = () => {
  window.dispatchEvent(new Event(PERMISSIONS_UPDATED_EVENT))
}

export const useRolePermissions = () => {
  const [permissions, setPermissions] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    const user = getSystemUser()
    setPermissions(getRolePermissionsForUser(user))
  }, [])

  useEffect(() => {
    const refreshPermissions = () => {
      const user = getSystemUser()
      setPermissions(getRolePermissionsForUser(user))
    }

    const handleStorage = (event: StorageEvent) => {
      if (!event.key) {
        return
      }

      if (
        event.key.startsWith('permissions_') ||
        event.key.startsWith(PERCENT_STORAGE_PREFIX) ||
        event.key === ROLE_STORAGE_KEY
      ) {
        refreshPermissions()
      }
    }

    window.addEventListener('storage', handleStorage as EventListener)
    window.addEventListener(PERMISSIONS_UPDATED_EVENT, refreshPermissions as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(PERMISSIONS_UPDATED_EVENT, refreshPermissions)
    }
  }, [])

  return permissions
}
