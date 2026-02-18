import { hasModuleAccess, hasOptionAccess, useRolePermissions } from './roleAccess'

const PermissionGate = ({ moduleId, optionId, children }) => {
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
