import { ReactNode } from 'react'
import { hasModuleAccess, hasOptionAccess, useRolePermissions } from './roleAccess'

interface PermissionGateProps {
  moduleId: string
  optionId?: string
  children: ReactNode
}

const PermissionGate = ({ moduleId, optionId, children }: PermissionGateProps) => {
  const permissions = useRolePermissions()

  const allowed = optionId
    ? hasOptionAccess(permissions, moduleId, optionId)
    : hasModuleAccess(permissions, moduleId)

  if (!allowed) {
    return null
  }

  return children
}

export default PermissionGate
