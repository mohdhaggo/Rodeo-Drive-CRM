// Production Mode - Demo data disabled
// All data should be loaded from Amplify API

export const getCustomers = () => [];
export const getVehicles = () => [];

const JOB_ORDERS_STORAGE_KEY = 'jobOrders';

const parseStoredArray = <T = any>(raw: string | null): T[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

export const getStoredJobOrders = () => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return [];
  }

  return parseStoredArray(window.localStorage.getItem(JOB_ORDERS_STORAGE_KEY));
};

export const getJobOrders = () => getStoredJobOrders();

export const generateSharedDemoData = () => ({ customers: [], vehicles: [] });
export const generateDemoJobOrders = () => [];
export const updateCompletedServiceCounts = () => {
  // No-op for production
};
