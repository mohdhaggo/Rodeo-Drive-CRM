// Local API Service using mock data
// This service simulates API calls with local data storage

interface Department {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  departmentId: string | null;
  status: string;
  createdAt: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  departmentId: string | null;
  roleId: string | null;
  lineManager: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
}

interface DepartmentPayload {
  name: string;
  description: string;
  status?: string;
}

interface RolePayload {
  name: string;
  description: string;
  departmentId?: string | null;
  status?: string;
}

interface UserPayload {
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  departmentId?: string | null;
  roleId?: string | null;
  lineManager?: string | null;
  phone?: string | null;
  status?: string;
}

type ImportMetaWithEnv = ImportMeta & {
  env?: Record<string, string | undefined>;
};

const STORAGE_KEYS = {
  departments: 'departments',
  roles: 'roles',
  users: 'users'
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

const parseStoredArray = <T>(raw: string | null): T[] => {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const getStoredArray = <T>(key: StorageKey): T[] => parseStoredArray<T>(localStorage.getItem(key));

const setStoredArray = <T>(key: StorageKey, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Check if we should use local API
const USE_LOCAL_API = ((import.meta as ImportMetaWithEnv).env?.VITE_USE_LOCAL_API ?? 'false') === 'true';

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: '1', name: 'Sales', description: 'Sales Department', status: 'active', createdAt: new Date().toISOString() },
  { id: '2', name: 'Service', description: 'Service Department', status: 'active', createdAt: new Date().toISOString() },
  { id: '3', name: 'Parts', description: 'Parts Department', status: 'active', createdAt: new Date().toISOString() },
  { id: '4', name: 'Finance', description: 'Finance Department', status: 'active', createdAt: new Date().toISOString() },
  { id: '5', name: 'Management', description: 'Management Department', status: 'active', createdAt: new Date().toISOString() }
];

const DEFAULT_ROLES: Role[] = [
  { id: '1', name: 'Sales Representative', description: 'Handles customer sales', departmentId: '1', status: 'active', createdAt: new Date().toISOString() },
  { id: '2', name: 'Sales Manager', description: 'Manages sales team', departmentId: '1', status: 'active', createdAt: new Date().toISOString() },
  { id: '3', name: 'Service Advisor', description: 'Advises on vehicle service', departmentId: '2', status: 'active', createdAt: new Date().toISOString() },
  { id: '4', name: 'Technician', description: 'Performs vehicle repairs', departmentId: '2', status: 'active', createdAt: new Date().toISOString() },
  { id: '5', name: 'Parts Manager', description: 'Manages parts inventory', departmentId: '3', status: 'active', createdAt: new Date().toISOString() },
  { id: '6', name: 'Accountant', description: 'Handles financial records', departmentId: '4', status: 'active', createdAt: new Date().toISOString() },
  { id: '7', name: 'General Manager', description: 'Oversees all operations', departmentId: '5', status: 'active', createdAt: new Date().toISOString() }
];

const DEFAULT_USERS: User[] = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john.doe@rodeo.com', employeeId: 'EMP001', departmentId: '1', roleId: '2', lineManager: null, phone: '+971501234567', status: 'active', createdAt: new Date().toISOString() },
  { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@rodeo.com', employeeId: 'EMP002', departmentId: '1', roleId: '1', lineManager: '1', phone: '+971501234568', status: 'active', createdAt: new Date().toISOString() },
  { id: '3', firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@rodeo.com', employeeId: 'EMP003', departmentId: '2', roleId: '3', lineManager: null, phone: '+971501234569', status: 'active', createdAt: new Date().toISOString() }
];

// Initialize local storage with demo data if needed
const initLocalStorage = (): void => {
  if (!localStorage.getItem(STORAGE_KEYS.departments)) {
    setStoredArray<Department>(STORAGE_KEYS.departments, DEFAULT_DEPARTMENTS);
  }

  if (!localStorage.getItem(STORAGE_KEYS.roles)) {
    setStoredArray<Role>(STORAGE_KEYS.roles, DEFAULT_ROLES);
  }

  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    setStoredArray<User>(STORAGE_KEYS.users, DEFAULT_USERS);
  }
};

// Simulate API delay
const delay = (ms = 300): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Generate unique ID
const generateId = (): string => Date.now().toString() + Math.random().toString(36).slice(2, 11);

// Department API Calls
export const getDepartments = async (): Promise<Department[]> => {
  await delay();
  initLocalStorage();
  return getStoredArray<Department>(STORAGE_KEYS.departments);
};

export const addDepartment = async (department: DepartmentPayload): Promise<Department> => {
  await delay();
  initLocalStorage();
  const departments = getStoredArray<Department>(STORAGE_KEYS.departments);

  const newDepartment: Department = {
    id: generateId(),
    name: department.name,
    description: department.description,
    status: department.status || 'active',
    createdAt: new Date().toISOString()
  };

  departments.push(newDepartment);
  setStoredArray<Department>(STORAGE_KEYS.departments, departments);
  return newDepartment;
};

export const editDepartment = async (id: string, department: DepartmentPayload): Promise<Department> => {
  await delay();
  initLocalStorage();
  const departments = getStoredArray<Department>(STORAGE_KEYS.departments);
  const index = departments.findIndex((d: Department) => d.id === id);
  if (index === -1) throw new Error('Department not found');

  departments[index] = {
    ...departments[index],
    name: department.name,
    description: department.description,
    status: department.status || departments[index].status
  };

  setStoredArray<Department>(STORAGE_KEYS.departments, departments);
  return departments[index];
};

export const removeDepartment = async (id: string): Promise<{ id: string }> => {
  await delay();
  initLocalStorage();
  const departments = getStoredArray<Department>(STORAGE_KEYS.departments);
  const filtered = departments.filter((d: Department) => d.id !== id);
  setStoredArray<Department>(STORAGE_KEYS.departments, filtered);
  return { id };
};

// Role API Calls
export const getRoles = async (): Promise<Role[]> => {
  await delay();
  initLocalStorage();
  return getStoredArray<Role>(STORAGE_KEYS.roles);
};

export const addRole = async (role: RolePayload): Promise<Role> => {
  await delay();
  initLocalStorage();
  const roles = getStoredArray<Role>(STORAGE_KEYS.roles);

  const newRole: Role = {
    id: generateId(),
    name: role.name,
    description: role.description,
    departmentId: role.departmentId || null,
    status: role.status || 'active',
    createdAt: new Date().toISOString()
  };

  roles.push(newRole);
  setStoredArray<Role>(STORAGE_KEYS.roles, roles);
  return newRole;
};

export const editRole = async (id: string, role: RolePayload): Promise<Role> => {
  await delay();
  initLocalStorage();
  const roles = getStoredArray<Role>(STORAGE_KEYS.roles);
  const index = roles.findIndex((r: Role) => r.id === id);
  if (index === -1) throw new Error('Role not found');

  roles[index] = {
    ...roles[index],
    name: role.name,
    description: role.description,
    departmentId: role.departmentId || null,
    status: role.status || roles[index].status
  };

  setStoredArray<Role>(STORAGE_KEYS.roles, roles);
  return roles[index];
};

export const removeRole = async (id: string): Promise<{ id: string }> => {
  await delay();
  initLocalStorage();
  const roles = getStoredArray<Role>(STORAGE_KEYS.roles);
  const filtered = roles.filter((r: Role) => r.id !== id);
  setStoredArray<Role>(STORAGE_KEYS.roles, filtered);
  return { id };
};

// User API Calls
export const getUsers = async (): Promise<User[]> => {
  await delay();
  initLocalStorage();
  return getStoredArray<User>(STORAGE_KEYS.users);
};

export const addUser = async (user: UserPayload): Promise<User> => {
  await delay();
  initLocalStorage();
  const users = getStoredArray<User>(STORAGE_KEYS.users);

  const newUser: User = {
    id: generateId(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    employeeId: user.employeeId,
    departmentId: user.departmentId || null,
    roleId: user.roleId || null,
    lineManager: user.lineManager || null,
    phone: user.phone || null,
    status: user.status || 'active',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  setStoredArray<User>(STORAGE_KEYS.users, users);
  return newUser;
};

export const editUser = async (id: string, user: UserPayload): Promise<User> => {
  await delay();
  initLocalStorage();
  const users = getStoredArray<User>(STORAGE_KEYS.users);
  const index = users.findIndex((u: User) => u.id === id);
  if (index === -1) throw new Error('User not found');

  users[index] = {
    ...users[index],
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    employeeId: user.employeeId,
    departmentId: user.departmentId || null,
    roleId: user.roleId || null,
    lineManager: user.lineManager || null,
    phone: user.phone || null,
    status: user.status || users[index].status
  };

  setStoredArray<User>(STORAGE_KEYS.users, users);
  return users[index];
};

export const removeUser = async (id: string): Promise<{ id: string }> => {
  await delay();
  initLocalStorage();
  const users = getStoredArray<User>(STORAGE_KEYS.users);
  const filtered = users.filter((u: User) => u.id !== id);
  setStoredArray<User>(STORAGE_KEYS.users, filtered);
  return { id };
};

export const isLocalMode = (): boolean => USE_LOCAL_API;
