// Centralized user management service for sharing user data across components

const STORAGE_KEY = 'rodeo_crm_users';
const SESSION_KEY = 'rodeo_crm_current_user';
const NOTIFICATIONS_KEY = 'rodeo_crm_user_notifications';

// Initial system users - can be extended with more users
const initialUsers = [
  {
    id: '1',
    employeeId: 'EP0001',
    name: 'test number 99',
    email: 'test99@rodeodrive.com',
    password: 'password123', // In production, this should be hashed
    mobile: '12345699',
    department: 'IT',
    role: 'Administrator',
    lineManager: 'test number 08',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'System Administrator responsible for overall system management and user administration.',
  },
  {
    id: '2',
    employeeId: 'EP0002',
    name: 'test number 01',
    email: 'test1@rodeodrive.com',
    password: 'password123',
    mobile: '12345601',
    department: 'IT',
    role: 'IT helpdesk',
    lineManager: 'test number 99',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Provides technical support and assistance to end users.',
  },
  {
    id: '3',
    employeeId: 'EP0003',
    name: 'test number 02',
    email: 'test2@rodeodrive.com',
    password: 'password123',
    mobile: '12345602',
    department: 'Sales',
    role: 'Sales Manager',
    lineManager: 'test number 08',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Manages sales team and develops sales strategies.',
  },
  {
    id: '4',
    employeeId: 'EP0004',
    name: 'test number 03',
    email: 'test3@rodeodrive.com',
    password: 'password123',
    mobile: '12345603',
    department: 'Sales',
    role: 'Sales Agent',
    lineManager: 'test number 02',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Handles direct sales and customer relationships.',
  },
  {
    id: '5',
    employeeId: 'EP0005',
    name: 'test number 04',
    email: 'test4@rodeodrive.com',
    password: 'password123',
    mobile: '12345604',
    department: 'Sales',
    role: 'Receiptioant',
    lineManager: 'test number 02',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Manages sales receipts and payment processing.',
  },
  {
    id: '6',
    employeeId: 'EP0006',
    name: 'test number 05',
    email: 'test5@rodeodrive.com',
    password: 'password123',
    mobile: '12345605',
    department: 'Sales',
    role: 'Seinor receiptant',
    lineManager: 'test number 02',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Senior receiptant overseeing payment operations.',
  },
  {
    id: '7',
    employeeId: 'EP0007',
    name: 'test number 06',
    email: 'test6@rodeodrive.com',
    password: 'password123',
    mobile: '12345606',
    department: 'Sales',
    role: 'Cashir',
    lineManager: 'test number 02',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Handles cash transactions and daily sales reconciliation.',
  },
  {
    id: '8',
    employeeId: 'EP0008',
    name: 'test number 07',
    email: 'test7@rodeodrive.com',
    password: 'password123',
    mobile: '12345607',
    department: 'Sales',
    role: 'Sales Agent',
    lineManager: 'test number 02',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Sales representative for customer acquisition.',
  },
  {
    id: '9',
    employeeId: 'EP0009',
    name: 'test number 08',
    email: 'test8@rodeodrive.com',
    password: 'password123',
    mobile: '12345608',
    department: 'Management',
    role: 'General manger',
    lineManager: 'test number 09',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Oversees overall operations and department management.',
  },
  {
    id: '10',
    employeeId: 'EP0010',
    name: 'test number 09',
    email: 'test9@rodeodrive.com',
    password: 'password123',
    mobile: '12345609',
    department: 'Management',
    role: 'CEO',
    lineManager: 'not available',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Chief Executive Officer, responsible for strategic direction.',
  },
  {
    id: '11',
    employeeId: 'EP0011',
    name: 'test number 10',
    email: 'test10@rodeodrive.com',
    password: 'password123',
    mobile: '12345610',
    department: 'Management',
    role: 'Director',
    lineManager: 'test number 09',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Directs department operations and strategic initiatives.',
  },
  {
    id: '12',
    employeeId: 'EP0012',
    name: 'test number 11',
    email: 'test11@rodeodrive.com',
    password: 'password123',
    mobile: '12345611',
    department: 'Operation',
    role: 'Operation Manager',
    lineManager: 'test number 08',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Manages day-to-day operations and workflow.',
  },
  {
    id: '13',
    employeeId: 'EP0013',
    name: 'test number 12',
    email: 'test12@rodeodrive.com',
    password: 'password123',
    mobile: '12345612',
    department: 'Operation',
    role: 'Supervisor',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Supervises operational staff and processes.',
  },
  {
    id: '14',
    employeeId: 'EP0014',
    name: 'test number 13',
    email: 'test13@rodeodrive.com',
    password: 'password123',
    mobile: '12345613',
    department: 'Operation',
    role: 'Supervisor',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Team supervisor for operational excellence.',
  },
  {
    id: '15',
    employeeId: 'EP0015',
    name: 'test number 14',
    email: 'test14@rodeodrive.com',
    password: 'password123',
    mobile: '12345614',
    department: 'Operation',
    role: 'Technician',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Technical support and equipment maintenance.',
  },
  {
    id: '16',
    employeeId: 'EP0016',
    name: 'test number 15',
    email: 'test15@rodeodrive.com',
    password: 'password123',
    mobile: '12345615',
    department: 'Operation',
    role: 'Technician',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Field technician for operational support.',
  },
  {
    id: '17',
    employeeId: 'EP0017',
    name: 'test number 16',
    email: 'test16@rodeodrive.com',
    password: 'password123',
    mobile: '12345616',
    department: 'Operation',
    role: 'Professional Technician',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Advanced technical specialist.',
  },
  {
    id: '18',
    employeeId: 'EP0018',
    name: 'test number 17',
    email: 'test17@rodeodrive.com',
    password: 'password123',
    mobile: '12345617',
    department: 'Operation',
    role: 'Senior Technician',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Senior technician leading technical operations.',
  },
  {
    id: '19',
    employeeId: 'EP0019',
    name: 'test number 18',
    email: 'test18@rodeodrive.com',
    password: 'password123',
    mobile: '12345618',
    department: 'Operation',
    role: 'Quality Inspector',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Ensures quality standards and compliance.',
  },
  {
    id: '20',
    employeeId: 'EP0020',
    name: 'test number 19',
    email: 'test19@rodeodrive.com',
    password: 'password123',
    mobile: '12345619',
    department: 'Operation',
    role: 'Service Inspector',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Inspects service delivery and customer satisfaction.',
  },
  {
    id: '21',
    employeeId: 'EP0021',
    name: 'test number 20',
    email: 'test20@rodeodrive.com',
    password: 'password123',
    mobile: '12345620',
    department: 'Operation',
    role: 'Inspection Supoervsior',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Supervises inspection team and processes.',
  },
  {
    id: '22',
    employeeId: 'EP0022',
    name: 'test number 21',
    email: 'test21@rodeodrive.com',
    password: 'password123',
    mobile: '12345621',
    department: 'Operation',
    role: 'Qulaity Supervior',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Quality supervisor ensuring product standards.',
  },
  {
    id: '23',
    employeeId: 'EP0023',
    name: 'test number 22',
    email: 'test22@rodeodrive.com',
    password: 'password123',
    mobile: '12345622',
    department: 'Operation',
    role: 'Techinician',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Operations technician.',
  },
  {
    id: '24',
    employeeId: 'EP0024',
    name: 'test number 23',
    email: 'test23@rodeodrive.com',
    password: 'password123',
    mobile: '12345623',
    department: 'Operation',
    role: 'Techinician',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Field service technician.',
  },
  {
    id: '25',
    employeeId: 'EP0025',
    name: 'test number 24',
    email: 'test24@rodeodrive.com',
    password: 'password123',
    mobile: '12345624',
    department: 'Operation',
    role: 'Techinician',
    lineManager: 'test number 11',
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: '2025-01-15',
    description: 'Maintenance technician.',
  },
];

// Initialize users in localStorage if not present
export const initializeUsers = () => {
  const storedUsers = localStorage.getItem(STORAGE_KEY);
  if (!storedUsers) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialUsers));
  }
};

// Get all active users
export const getAllUsers = () => {
  initializeUsers();
  const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return users.filter(user => user.status === 'active');
};

// Get all users (including inactive)
export const getAllUsersIncludingInactive = () => {
  initializeUsers();
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
};

// Get user by email
export const getUserByEmail = (email) => {
  const users = getAllUsersIncludingInactive();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
};

// Get user by ID
export const getUserById = (id) => {
  const users = getAllUsersIncludingInactive();
  return users.find(user => user.id === id);
};

const getAllNotifications = () => {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveNotifications = (notifications) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const sendUserNotification = (email, message) => {
  const notifications = getAllNotifications();
  const newNotification = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    email: email.toLowerCase(),
    message,
    createdAt: new Date().toISOString(),
    read: false
  };
  notifications.push(newNotification);
  saveNotifications(notifications);
  return { success: true, notification: newNotification };
};

export const getUnreadNotificationsForUser = (email) => {
  const notifications = getAllNotifications();
  return notifications.filter(
    (notification) =>
      notification.email === email.toLowerCase() && !notification.read
  );
};

export const markNotificationsRead = (email) => {
  const notifications = getAllNotifications();
  const updated = notifications.map((notification) =>
    notification.email === email.toLowerCase()
      ? { ...notification, read: true }
      : notification
  );
  saveNotifications(updated);
};

// Validate user credentials
export const validateCredentials = (email, password) => {
  const user = getUserByEmail(email);
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  if (user.status !== 'active') {
    return { success: false, error: 'User account is not active' };
  }
  
  if (user.dashboardAccess !== 'allowed') {
    return { success: false, error: 'Dashboard access not allowed for this user' };
  }
  
  // In production, compare hashed passwords
  if (user.password !== password) {
    return { success: false, error: 'Invalid password' };
  }
  
  // Don't return the password in the user object
  const { password: _, ...userWithoutPassword } = user;
  return {
    success: true,
    user: userWithoutPassword,
    requiresPasswordChange: Boolean(user.mustChangePassword || user.tempPassword),
    notifications: getUnreadNotificationsForUser(email)
  };
};

// Set current logged-in user
export const setCurrentUser = (user) => {
  if (user) {
    const { password, ...userWithoutPassword } = user;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
};

// Get current logged-in user
export const getCurrentUser = () => {
  const user = sessionStorage.getItem(SESSION_KEY);
  return user ? JSON.parse(user) : null;
};

// Clear current user (logout)
export const clearCurrentUser = () => {
  sessionStorage.removeItem(SESSION_KEY);
};

// Get users by department
export const getUsersByDepartment = (department) => {
  const users = getAllUsers();
  return users.filter(user => user.department === department);
};

// Get users by role
export const getUsersByRole = (role) => {
  const users = getAllUsers();
  return users.filter(user => user.role === role);
};

// Get technicians (users with Technician-related roles)
export const getTechnicians = () => {
  const users = getAllUsers();
  return users.filter(user => 
    user.role.toLowerCase().includes('technician') ||
    user.role === 'Supervisor' ||
    user.department === 'Operation'
  );
};

// Get supervisors and managers
export const getSupervisorsAndManagers = () => {
  const users = getAllUsers();
  return users.filter(user => 
    user.role.toLowerCase().includes('manager') ||
    user.role.toLowerCase().includes('supervisor') ||
    user.role === 'Director'
  );
};

// Update user in storage
export const updateUser = (userId, updates) => {
  const users = getAllUsersIncludingInactive();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    
    // If updating current user, update session
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(users[userIndex]);
    }
    
    return { success: true, user: users[userIndex] };
  }
  
  return { success: false, error: 'User not found' };
};

export const updateUserPassword = (email, newPassword) => {
  const user = getUserByEmail(email);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  return updateUser(user.id, {
    password: newPassword,
    tempPassword: null,
    mustChangePassword: false,
    passwordUpdatedAt: new Date().toISOString()
  });
};

// Add new user
export const addUser = (newUser) => {
  const users = getAllUsersIncludingInactive();
  const maxId = Math.max(...users.map(u => parseInt(u.id)), 0);
  
  const user = {
    ...newUser,
    id: String(maxId + 1),
    createdDate: new Date().toISOString().split('T')[0],
    status: 'active',
  };
  
  users.push(user);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  
  return { success: true, user };
};

// Delete user (soft delete - set status to inactive)
export const deleteUser = (userId) => {
  return updateUser(userId, { status: 'inactive' });
};

// Get users formatted for dropdown (name and role)
export const getUsersForDropdown = () => {
  const users = getAllUsers();
  return users.map(user => ({
    id: user.id,
    label: `${user.name} (${user.role})`,
    name: user.name,
    role: user.role,
    department: user.department,
  }));
};

export default {
  initializeUsers,
  getAllUsers,
  getAllUsersIncludingInactive,
  getUserByEmail,
  getUserById,
  validateCredentials,
  setCurrentUser,
  getCurrentUser,
  clearCurrentUser,
  getUsersByDepartment,
  getUsersByRole,
  getTechnicians,
  getSupervisorsAndManagers,
  updateUser,
  addUser,
  deleteUser,
  getUsersForDropdown,
};
