import { generateClient } from 'aws-amplify/api';
import * as localApi from './localApiService.js';

const client = generateClient();

// Check if we should use local API
const USE_LOCAL_API = import.meta.env.VITE_USE_LOCAL_API === 'true';

// GraphQL Queries
export const listDepartments = `
  query ListDepartments {
    listDepartments {
      items {
        id
        name
        description
        status
        createdAt
      }
    }
  }
`;

export const listRoles = `
  query ListRoles {
    listRoles {
      items {
        id
        name
        description
        departmentId
        status
        createdAt
      }
    }
  }
`;

export const listUsers = `
  query ListUsers {
    listUsers {
      items {
        id
        firstName
        lastName
        email
        employeeId
        departmentId
        roleId
        lineManager
        phone
        status
        createdAt
      }
    }
  }
`;

// GraphQL Mutations
export const createDepartment = `
  mutation CreateDepartment($input: CreateDepartmentInput!) {
    createDepartment(input: $input) {
      id
      name
      description
      status
      createdAt
    }
  }
`;

export const updateDepartment = `
  mutation UpdateDepartment($input: UpdateDepartmentInput!) {
    updateDepartment(input: $input) {
      id
      name
      description
      status
      createdAt
    }
  }
`;

export const deleteDepartment = `
  mutation DeleteDepartment($input: DeleteDepartmentInput!) {
    deleteDepartment(input: $input) {
      id
    }
  }
`;

export const createRole = `
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(input: $input) {
      id
      name
      description
      departmentId
      status
      createdAt
    }
  }
`;

export const updateRole = `
  mutation UpdateRole($input: UpdateRoleInput!) {
    updateRole(input: $input) {
      id
      name
      description
      departmentId
      status
      createdAt
    }
  }
`;

export const deleteRole = `
  mutation DeleteRole($input: DeleteRoleInput!) {
    deleteRole(input: $input) {
      id
    }
  }
`;

export const createUser = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      firstName
      lastName
      email
      employeeId
      departmentId
      roleId
      lineManager
      phone
      status
      createdAt
    }
  }
`;

export const updateUser = `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      firstName
      lastName
      email
      employeeId
      departmentId
      roleId
      lineManager
      phone
      status
      createdAt
    }
  }
`;

export const deleteUser = `
  mutation DeleteUser($input: DeleteUserInput!) {
    deleteUser(input: $input) {
      id
    }
  }
`;

// API Helper Functions
export const callGraphQL = async (query, variables = {}) => {
  try {
    const result = await client.graphql({
      query,
      variables
    });
    
    return result.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Department API Calls
export const getDepartments = async () => {
  if (USE_LOCAL_API) return localApi.getDepartments();
  
  try {
    const data = await callGraphQL(listDepartments);
    return data.listDepartments.items;
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
};

export const addDepartment = async (department) => {
  if (USE_LOCAL_API) return localApi.addDepartment(department);
  
  try {
    const data = await callGraphQL(createDepartment, {
      input: {
        name: department.name,
        description: department.description,
        status: department.status || 'active'
      }
    });
    return data.createDepartment;
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
};

export const editDepartment = async (id, department) => {
  if (USE_LOCAL_API) return localApi.editDepartment(id, department);
  
  try {
    const data = await callGraphQL(updateDepartment, {
      input: {
        id,
        name: department.name,
        description: department.description,
        status: department.status
      }
    });
    return data.updateDepartment;
  } catch (error) {
    console.error('Error updating department:', error);
    throw error;
  }
};

export const removeDepartment = async (id) => {
  if (USE_LOCAL_API) return localApi.removeDepartment(id);
  
  try {
    const data = await callGraphQL(deleteDepartment, {
      input: { id }
    });
    return data.deleteDepartment;
  } catch (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
};

// Role API Calls
export const getRoles = async () => {
  if (USE_LOCAL_API) return localApi.getRoles();
  
  try {
    const data = await callGraphQL(listRoles);
    return data.listRoles.items;
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
};

export const addRole = async (role) => {
  if (USE_LOCAL_API) return localApi.addRole(role);
  
  try {
    const data = await callGraphQL(createRole, {
      input: {
        name: role.name,
        description: role.description,
        departmentId: role.departmentId || null,
        status: role.status || 'active'
      }
    });
    return data.createRole;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

export const editRole = async (id, role) => {
  if (USE_LOCAL_API) return localApi.editRole(id, role);
  
  try {
    const data = await callGraphQL(updateRole, {
      input: {
        id,
        name: role.name,
        description: role.description,
        departmentId: role.departmentId || null,
        status: role.status
      }
    });
    return data.updateRole;
  } catch (error) {
    console.error('Error updating role:', error);
    throw error;
  }
};

export const removeRole = async (id) => {
  if (USE_LOCAL_API) return localApi.removeRole(id);
  
  try {
    const data = await callGraphQL(deleteRole, {
      input: { id }
    });
    return data.deleteRole;
  } catch (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
};

// User API Calls
export const getUsers = async () => {
  if (USE_LOCAL_API) return localApi.getUsers();
  
  try {
    const data = await callGraphQL(listUsers);
    return data.listUsers.items;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const addUser = async (user) => {
  if (USE_LOCAL_API) return localApi.addUser(user);
  
  try {
    const data = await callGraphQL(createUser, {
      input: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        employeeId: user.employeeId,
        departmentId: user.departmentId || null,
        roleId: user.roleId || null,
        lineManager: user.lineManager || null,
        phone: user.phone || null,
        status: user.status || 'active'
      }
    });
    return data.createUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const editUser = async (id, user) => {
  if (USE_LOCAL_API) return localApi.editUser(id, user);
  
  try {
    const data = await callGraphQL(updateUser, {
      input: {
        id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        employeeId: user.employeeId,
        departmentId: user.departmentId || null,
        roleId: user.roleId || null,
        lineManager: user.lineManager || null,
        phone: user.phone || null,
        status: user.status
      }
    });
    return data.updateUser;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const removeUser = async (id) => {
  if (USE_LOCAL_API) return localApi.removeUser(id);
  
  try {
    const data = await callGraphQL(deleteUser, {
      input: { id }
    });
    return data.deleteUser;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
