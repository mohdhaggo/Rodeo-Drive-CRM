// Local API Service using mock data
// This service simulates API calls with local data storage

// Check if we should use local API
const USE_LOCAL_API = import.meta.env.VITE_USE_LOCAL_API === 'true';

// Initialize local storage with demo data if needed
const initLocalStorage = () => {
  if (!localStorage.getItem('departments')) {
    localStorage.setItem('departments', JSON.stringify([
      { id: '1', name: 'Sales', description: 'Sales Department', status: 'active', createdAt: new Date().toISOString() },
      { id: '2', name: 'Service', description: 'Service Department', status: 'active', createdAt: new Date().toISOString() },
      { id: '3', name: 'Parts', description: 'Parts Department', status: 'active', createdAt: new Date().toISOString() },
      { id: '4', name: 'Finance', description: 'Finance Department', status: 'active', createdAt: new Date().toISOString() },
      { id: '5', name: 'Management', description: 'Management Department', status: 'active', createdAt: new Date().toISOString() },
    ]));
  }

  if (!localStorage.getItem('roles')) {
    localStorage.setItem('roles', JSON.stringify([
      { id: '1', name: 'Sales Representative', description: 'Handles customer sales', departmentId: '1', status: 'active', createdAt: new Date().toISOString() },
      { id: '2', name: 'Sales Manager', description: 'Manages sales team', departmentId: '1', status: 'active', createdAt: new Date().toISOString() },
      { id: '3', name: 'Service Advisor', description: 'Advises on vehicle service', departmentId: '2', status: 'active', createdAt: new Date().toISOString() },
      { id: '4', name: 'Technician', description: 'Performs vehicle repairs', departmentId: '2', status: 'active', createdAt: new Date().toISOString() },
      { id: '5', name: 'Parts Manager', description: 'Manages parts inventory', departmentId: '3', status: 'active', createdAt: new Date().toISOString() },
      { id: '6', name: 'Accountant', description: 'Handles financial records', departmentId: '4', status: 'active', createdAt: new Date().toISOString() },
      { id: '7', name: 'General Manager', description: 'Oversees all operations', departmentId: '5', status: 'active', createdAt: new Date().toISOString() },
    ]));
  }

  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([
      { id: '1', firstName: 'John', lastName: 'Doe', email: 'john.doe@rodeo.com', employeeId: 'EMP001', departmentId: '1', roleId: '2', lineManager: null, phone: '+971501234567', status: 'active', createdAt: new Date().toISOString() },
      { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@rodeo.com', employeeId: 'EMP002', departmentId: '1', roleId: '1', lineManager: '1', phone: '+971501234568', status: 'active', createdAt: new Date().toISOString() },
      { id: '3', firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@rodeo.com', employeeId: 'EMP003', departmentId: '2', roleId: '3', lineManager: null, phone: '+971501234569', status: 'active', createdAt: new Date().toISOString() },
    ]));
  }
};

// Simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Generate unique ID
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

// Department API Calls
export const getDepartments = async () => {
  await delay();
  initLocalStorage();
  const departments = JSON.parse(localStorage.getItem('departments') || '[]');
  return departments;
};

export const addDepartment = async (department) => {
  await delay();
  initLocalStorage();
  const departments = JSON.parse(localStorage.getItem('departments') || '[]');
  const newDepartment = {
    id: generateId(),
    name: department.name,
    description: department.description,
    status: department.status || 'active',
    createdAt: new Date().toISOString()
  };
  departments.push(newDepartment);
  localStorage.setItem('departments', JSON.stringify(departments));
  return newDepartment;
};

export const editDepartment = async (id, department) => {
  await delay();
  initLocalStorage();
  const departments = JSON.parse(localStorage.getItem('departments') || '[]');
  const index = departments.findIndex(d => d.id === id);
  if (index === -1) throw new Error('Department not found');
  
  departments[index] = {
    ...departments[index],
    name: department.name,
    description: department.description,
    status: department.status
  };
  localStorage.setItem('departments', JSON.stringify(departments));
  return departments[index];
};

export const removeDepartment = async (id) => {
  await delay();
  initLocalStorage();
  const departments = JSON.parse(localStorage.getItem('departments') || '[]');
  const filtered = departments.filter(d => d.id !== id);
  localStorage.setItem('departments', JSON.stringify(filtered));
  return { id };
};

// Role API Calls
export const getRoles = async () => {
  await delay();
  initLocalStorage();
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');
  return roles;
};

export const addRole = async (role) => {
  await delay();
  initLocalStorage();
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');
  const newRole = {
    id: generateId(),
    name: role.name,
    description: role.description,
    departmentId: role.departmentId || null,
    status: role.status || 'active',
    createdAt: new Date().toISOString()
  };
  roles.push(newRole);
  localStorage.setItem('roles', JSON.stringify(roles));
  return newRole;
};

export const editRole = async (id, role) => {
  await delay();
  initLocalStorage();
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');
  const index = roles.findIndex(r => r.id === id);
  if (index === -1) throw new Error('Role not found');
  
  roles[index] = {
    ...roles[index],
    name: role.name,
    description: role.description,
    departmentId: role.departmentId || null,
    status: role.status
  };
  localStorage.setItem('roles', JSON.stringify(roles));
  return roles[index];
};

export const removeRole = async (id) => {
  await delay();
  initLocalStorage();
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');
  const filtered = roles.filter(r => r.id !== id);
  localStorage.setItem('roles', JSON.stringify(filtered));
  return { id };
};

// User API Calls
export const getUsers = async () => {
  await delay();
  initLocalStorage();
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  return users;
};

export const addUser = async (user) => {
  await delay();
  initLocalStorage();
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const newUser = {
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
  localStorage.setItem('users', JSON.stringify(users));
  return newUser;
};

export const editUser = async (id, user) => {
  await delay();
  initLocalStorage();
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const index = users.findIndex(u => u.id === id);
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
    status: user.status
  };
  localStorage.setItem('users', JSON.stringify(users));
  return users[index];
};

export const removeUser = async (id) => {
  await delay();
  initLocalStorage();
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const filtered = users.filter(u => u.id !== id);
  localStorage.setItem('users', JSON.stringify(filtered));
  return { id };
};

export const isLocalMode = () => USE_LOCAL_API;
