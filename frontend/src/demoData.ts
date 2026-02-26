// Production Mode - Demo data disabled
// All data should be loaded from Amplify API

export const getCustomers = () => [];
export const getVehicles = () => [];
export const getJobOrders = () => [];
export const getStoredJobOrders = () => [];
export const generateSharedDemoData = () => ({ customers: [], vehicles: [] });
export const generateDemoJobOrders = () => [];
export const updateCompletedServiceCounts = () => {
  // No-op for production
};
