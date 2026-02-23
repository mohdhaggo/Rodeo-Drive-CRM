import { useEffect, useState } from 'react'
import { getCurrentUser as getSystemUser } from './userService.ts'

const ROLE_STORAGE_KEY = 'department_roles'
const PERMISSIONS_UPDATED_EVENT = 'role-permissions-updated'

const DEFAULT_ROLE_MAP = {
  administrator: 'admin',
  'service manager': 'manager',
  'service technician': 'technician',
  'service advisor': 'advisor',
  cashier: 'cashier',
  'view only': 'viewer',
}

const normalize = (value: string | undefined | null): string => (value || '').trim().toLowerCase()

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
  if (!user?.role) {
    return null
  }

  const roleValue = findRoleValue(user.role)
  return loadPermissions(roleValue)
}

export const hasModuleAccess = (permissions: any, moduleId: string): boolean => {
  if (!permissions || !permissions[moduleId]) {
    return false
  }

  return Boolean(permissions[moduleId].enabled)
}

export const hasOptionAccess = (permissions: any, moduleId: string, optionId?: string): boolean => {
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
  const [permissions, setPermissions] = useState(null)

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

      if (event.key.startsWith('permissions_') || event.key === ROLE_STORAGE_KEY) {
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
