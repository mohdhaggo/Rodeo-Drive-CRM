/**
 * Amplify Backend Integration Service
 * Handles all CRUD operations for backend entities
 */

import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

// ==================== USER MANAGEMENT ====================

// Department Operations
export const departmentService = {
  async getAll() {
    try {
      const { data } = await client.models.Department.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  },

  async getById(id: string) {
    try {
      const { data } = await client.models.Department.get({ id });
      return data;
    } catch (error) {
      console.error('Error fetching department:', error);
      return null;
    }
  },

  async create(input: { name: string; description?: string; status?: 'active' | 'inactive' }) {
    try {
      const { data } = await client.models.Department.create({
        ...input,
        status: input.status || 'active',
      });
      return data;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{ name: string; description: string; status: 'active' | 'inactive' }>) {
    try {
      const { data } = await client.models.Department.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { data } = await client.models.Department.delete({ id });
      return data;
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  },
};

// Role Operations
export const roleService = {
  async getAll() {
    try {
      const { data } = await client.models.Role.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  },

  async getById(id: string) {
    try {
      const { data } = await client.models.Role.get({ id });
      return data;
    } catch (error) {
      console.error('Error fetching role:', error);
      return null;
    }
  },

  async create(input: { name: string; description?: string; departmentId?: string; status?: 'active' | 'inactive' }) {
    try {
      const { data } = await client.models.Role.create({
        ...input,
        status: input.status || 'active',
      });
      return data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{ name: string; description: string; departmentId: string; status: 'active' | 'inactive' }>) {
    try {
      const { data } = await client.models.Role.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { data } = await client.models.Role.delete({ id });
      return data;
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  },
};

// User Operations
export const userService = {
  async getAll() {
    try {
      const { data } = await client.models.User.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  async getById(id: string) {
    try {
      const { data } = await client.models.User.get({ id });
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  async create(input: {
    firstName: string;
    lastName: string;
    email: string;
    employeeId?: string;
    departmentId?: string;
    roleId?: string;
    lineManager?: string;
    phone?: string;
    status?: 'active' | 'inactive' | 'on_leave';
  }) {
    try {
      const { data } = await client.models.User.create({
        ...input,
        status: input.status || 'active',
      });
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
    departmentId: string;
    roleId: string;
    lineManager: string;
    phone: string;
    status: 'active' | 'inactive' | 'on_leave';
  }>) {
    try {
      const { data } = await client.models.User.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { data } = await client.models.User.delete({ id });
      return data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
};

// Permission Operations
export const permissionService = {
  async getByRole(roleId: string) {
    try {
      const { data } = await client.models.Permission.list({
        filter: { roleId: { eq: roleId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
  },

  async create(input: {
    roleId: string;
    moduleName: string;
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }) {
    try {
      const { data } = await client.models.Permission.create(input);
      return data;
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }>) {
    try {
      const { data } = await client.models.Permission.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating permission:', error);
      throw error;
    }
  },
};

// ==================== CUSTOMER MANAGEMENT ====================

// Customer Operations
export const customerService = {
  async getAll() {
    try {
      const { data } = await client.models.Customer.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  },

  async getById(id: string) {
    try {
      const { data } = await client.models.Customer.get({ id });
      return data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
  },

  async create(input: {
    name: string;
    email?: string;
    mobile?: string;
    address?: string;
    status?: 'active' | 'inactive' | 'suspended';
  }) {
    try {
      const { data } = await client.models.Customer.create({
        ...input,
        status: input.status || 'active',
      });
      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    name: string;
    email: string;
    mobile: string;
    address: string;
    status: 'active' | 'inactive' | 'suspended';
  }>) {
    try {
      const { data } = await client.models.Customer.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { data } = await client.models.Customer.delete({ id });
      return data;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },
};

// Vehicle Operations
export const vehicleService = {
  async getAll() {
    try {
      const { data } = await client.models.Vehicle.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
  },

  async getByCustomerId(customerId: string) {
    try {
      const { data } = await client.models.Vehicle.list({
        filter: { customerId: { eq: customerId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
  },

  async getById(id: string) {
    try {
      const { data } = await client.models.Vehicle.get({ id });
      return data;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return null;
    }
  },

  async create(input: {
    customerId: string;
    make: string;
    model: string;
    year: string;
    color?: string;
    plateNumber?: string;
    vin?: string;
    vehicleType?: string;
    status?: 'active' | 'inactive' | 'retired';
  }) {
    try {
      const { data } = await client.models.Vehicle.create({
        ...input,
        status: input.status || 'active',
      });
      return data;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    make: string;
    model: string;
    year: string;
    color: string;
    plateNumber: string;
    vin: string;
    vehicleType: string;
    status: 'active' | 'inactive' | 'retired';
  }>) {
    try {
      const { data } = await client.models.Vehicle.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { data } = await client.models.Vehicle.delete({ id });
      return data;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  },
};

// ==================== JOB ORDER MANAGEMENT ====================

// Job Order Operations
export const jobOrderService = {
  async getAll() {
    try {
      const { data } = await client.models.JobOrder.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching job orders:', error);
      return [];
    }
  },

  async getByCustomerId(customerId: string) {
    try {
      const { data } = await client.models.JobOrder.list({
        filter: { customerId: { eq: customerId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching job orders:', error);
      return [];
    }
  },

  async getById(id: string) {
    try {
      const { data } = await client.models.JobOrder.get({ id });
      return data;
    } catch (error) {
      console.error('Error fetching job order:', error);
      return null;
    }
  },

  async create(input: {
    orderNumber: string;
    customerId: string;
    vehicleId: string;
    workStatus?: string;
    paymentStatus?: string;
    totalAmount?: number;
    paidAmount?: number;
    createdByUserId?: string;
    assignedToUserId?: string;
  }) {
    try {
      const { data } = await client.models.JobOrder.create({
        ...input,
        workStatus: input.workStatus || 'New Request',
        paymentStatus: input.paymentStatus || 'Unpaid',
      });
      return data;
    } catch (error) {
      console.error('Error creating job order:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    orderNumber: string;
    workStatus: string;
    paymentStatus: string;
    totalAmount: number;
    paidAmount: number;
    completionDate: Date;
    assignedToUserId: string;
  }>) {
    try {
      const { data } = await client.models.JobOrder.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating job order:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { data } = await client.models.JobOrder.delete({ id });
      return data;
    } catch (error) {
      console.error('Error deleting job order:', error);
      throw error;
    }
  },
};

// Service Request Operations
export const serviceRequestService = {
  async getByJobOrderId(jobOrderId: string) {
    try {
      const { data } = await client.models.ServiceRequest.list({
        filter: { jobOrderId: { eq: jobOrderId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching service requests:', error);
      return [];
    }
  },

  async create(input: {
    jobOrderId: string;
    serviceName: string;
    status?: string;
    assignedTechnician?: string;
    notes?: string;
  }) {
    try {
      const { data } = await client.models.ServiceRequest.create({
        ...input,
        status: input.status || 'Pending',
      });
      return data;
    } catch (error) {
      console.error('Error creating service request:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    serviceName: string;
    status: string;
    startTime: Date;
    endTime: Date;
    duration: string;
    assignedTechnician: string;
    notes: string;
  }>) {
    try {
      const { data } = await client.models.ServiceRequest.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating service request:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { data } = await client.models.ServiceRequest.delete({ id });
      return data;
    } catch (error) {
      console.error('Error deleting service request:', error);
      throw error;
    }
  },
};

// Additional Service Request Operations
export const additionalServiceRequestService = {
  async getByJobOrderId(jobOrderId: string) {
    try {
      const { data } = await client.models.AdditionalServiceRequest.list({
        filter: { jobOrderId: { eq: jobOrderId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching additional service requests:', error);
      return [];
    }
  },

  async create(input: {
    jobOrderId: string;
    serviceName: string;
    description?: string;
    estimatedCost?: number;
    status?: string;
    requestedBy?: string;
  }) {
    try {
      const { data } = await client.models.AdditionalServiceRequest.create({
        ...input,
        status: input.status || 'Requested',
      });
      return data;
    } catch (error) {
      console.error('Error creating additional service request:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    serviceName: string;
    description: string;
    estimatedCost: number;
    status: string;
  }>) {
    try {
      const { data } = await client.models.AdditionalServiceRequest.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating additional service request:', error);
      throw error;
    }
  },
};

// Payment Operations
export const paymentService = {
  async getByJobOrderId(jobOrderId: string) {
    try {
      const { data } = await client.models.Payment.list({
        filter: { jobOrderId: { eq: jobOrderId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  },

  async create(input: {
    jobOrderId: string;
    amount: number;
    paymentMethod?: string;
    paymentStatus?: string;
    referenceNumber?: string;
    notes?: string;
  }) {
    try {
      const { data } = await client.models.Payment.create({
        ...input,
        paymentStatus: input.paymentStatus || 'Pending',
      });
      return data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    referenceNumber: string;
    notes: string;
  }>) {
    try {
      const { data } = await client.models.Payment.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },
};

// Exit Permit Operations
export const exitPermitService = {
  async getByJobOrderId(jobOrderId: string) {
    try {
      const { data } = await client.models.ExitPermit.list({
        filter: { jobOrderId: { eq: jobOrderId } },
      });
      return data ? data[0] : null;
    } catch (error) {
      console.error('Error fetching exit permit:', error);
      return null;
    }
  },

  async create(input: {
    jobOrderId: string;
    permitNumber?: string;
    status?: string;
    createdByUserId?: string;
  }) {
    try {
      const { data } = await client.models.ExitPermit.create({
        ...input,
        status: input.status || 'Not Created',
      });
      return data;
    } catch (error) {
      console.error('Error creating exit permit:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    permitNumber: string;
    status: string;
    createdDate: Date;
    collectedDate: Date;
    nextServiceDate: Date;
    collectedByUserId: string;
  }>) {
    try {
      const { data } = await client.models.ExitPermit.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating exit permit:', error);
      throw error;
    }
  },
};

// ==================== INSPECTION & QUALITY ====================

// Inspection Operations
export const inspectionService = {
  async getByJobOrderId(jobOrderId: string) {
    try {
      const { data } = await client.models.Inspection.list({
        filter: { jobOrderId: { eq: jobOrderId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching inspections:', error);
      return [];
    }
  },

  async getByVehicleId(vehicleId: string) {
    try {
      const { data } = await client.models.Inspection.list({
        filter: { vehicleId: { eq: vehicleId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching inspections:', error);
      return [];
    }
  },

  async create(input: {
    jobOrderId?: string;
    vehicleId?: string;
    inspectionType: string;
    status?: string;
    inspectorId?: string;
    findings?: string;
    checklist?: any;
  }) {
    try {
      const { data } = await client.models.Inspection.create({
        ...input,
        status: input.status || 'Pending',
      });
      return data;
    } catch (error) {
      console.error('Error creating inspection:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    inspectionType: string;
    status: string;
    inspectorId: string;
    findings: string;
    checklist: any;
  }>) {
    try {
      const { data } = await client.models.Inspection.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating inspection:', error);
      throw error;
    }
  },
};

// Quality Check Operations
export const qualityCheckService = {
  async getByJobOrderId(jobOrderId: string) {
    try {
      const { data } = await client.models.QualityCheck.list({
        filter: { jobOrderId: { eq: jobOrderId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching quality checks:', error);
      return [];
    }
  },

  async create(input: {
    jobOrderId: string;
    status?: string;
    inspectorId?: string;
    checklist?: any;
    issues?: string;
    approvalStatus?: string;
  }) {
    try {
      const { data } = await client.models.QualityCheck.create({
        ...input,
        status: input.status || 'Pending',
        approvalStatus: input.approvalStatus || 'Not Required',
      });
      return data;
    } catch (error) {
      console.error('Error creating quality check:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    status: string;
    inspectorId: string;
    checklist: any;
    issues: string;
    approvalStatus: string;
  }>) {
    try {
      const { data } = await client.models.QualityCheck.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating quality check:', error);
      throw error;
    }
  },
};

// ==================== SALES MANAGEMENT ====================

// Sales Lead Operations
export const salesLeadService = {
  async getAll() {
    try {
      const { data } = await client.models.SalesLead.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching sales leads:', error);
      return [];
    }
  },

  async getById(id: string) {
    try {
      const { data } = await client.models.SalesLead.get({ id });
      return data;
    } catch (error) {
      console.error('Error fetching sales lead:', error);
      return null;
    }
  },

  async create(input: {
    dealName: string;
    amount?: number;
    stage?: string;
    customerId?: string;
    ownerId?: string;
    probability?: number;
    expectedCloseDate?: Date;
    notes?: string;
  }) {
    try {
      const { data } = await client.models.SalesLead.create({
        ...input,
        stage: input.stage || 'Lead',
      });
      return data;
    } catch (error) {
      console.error('Error creating sales lead:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    dealName: string;
    amount: number;
    stage: string;
    customerId: string;
    ownerId: string;
    probability: number;
    expectedCloseDate: Date;
    notes: string;
  }>) {
    try {
      const { data } = await client.models.SalesLead.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating sales lead:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { data } = await client.models.SalesLead.delete({ id });
      return data;
    } catch (error) {
      console.error('Error deleting sales lead:', error);
      throw error;
    }
  },
};

// ==================== PRODUCT MANAGEMENT ====================

// Product Operations
export const productService = {
  async getAll() {
    try {
      const { data } = await client.models.Product.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  async create(input: {
    name: string;
    description?: string;
    suvPrice?: number;
    sedanPrice?: number;
    otherPrice?: number;
    category?: string;
    status?: 'active' | 'inactive';
  }) {
    try {
      const { data } = await client.models.Product.create({
        ...input,
        status: input.status || 'active',
      });
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    name: string;
    description: string;
    suvPrice: number;
    sedanPrice: number;
    otherPrice: number;
    category: string;
    status: 'active' | 'inactive';
  }>) {
    try {
      const { data } = await client.models.Product.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { data } = await client.models.Product.delete({ id });
      return data;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },
};

// ==================== PURCHASE MANAGEMENT ====================

// Purchase Order Operations
export const purchaseOrderService = {
  async getAll() {
    try {
      const { data } = await client.models.PurchaseOrder.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      return [];
    }
  },

  async create(input: {
    orderNumber: string;
    supplierName: string;
    status?: string;
    totalAmount?: number;
    deliveryDate?: Date;
    items?: any;
    notes?: string;
  }) {
    try {
      const { data } = await client.models.PurchaseOrder.create({
        ...input,
        status: input.status || 'Draft',
      });
      return data;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    orderNumber: string;
    supplierName: string;
    status: string;
    totalAmount: number;
    deliveryDate: Date;
    items: any;
    notes: string;
  }>) {
    try {
      const { data } = await client.models.PurchaseOrder.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { data } = await client.models.PurchaseOrder.delete({ id });
      return data;
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  },
};

// ==================== SERVICE EXECUTION ====================

// Service Execution Operations
export const serviceExecutionService = {
  async getAll() {
    try {
      const { data } = await client.models.ServiceExecution.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching service executions:', error);
      return [];
    }
  },

  async create(input: {
    jobOrderId?: string;
    serviceType: string;
    status?: string;
    executorId?: string;
    startTime?: Date;
    endTime?: Date;
    notes?: string;
  }) {
    try {
      const { data } = await client.models.ServiceExecution.create({
        ...input,
        status: input.status || 'Scheduled',
      });
      return data;
    } catch (error) {
      console.error('Error creating service execution:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{
    serviceType: string;
    status: string;
    executorId: string;
    startTime: Date;
    endTime: Date;
    notes: string;
  }>) {
    try {
      const { data } = await client.models.ServiceExecution.update({
        id,
        ...input,
      });
      return data;
    } catch (error) {
      console.error('Error updating service execution:', error);
      throw error;
    }
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Sync local data to backend
 * Use this to migrate data from localStorage to Amplify
 */
export const syncDataToBackend = async (dataType: string, items: any[]) => {
  try {
    console.log(`Syncing ${items.length} ${dataType} items to backend...`);
    const results = [];
    
    switch (dataType) {
      case 'customers':
        for (const item of items) {
          const result = await customerService.create(item);
          results.push(result);
        }
        break;
      case 'vehicles':
        for (const item of items) {
          const result = await vehicleService.create(item);
          results.push(result);
        }
        break;
      case 'jobOrders':
        for (const item of items) {
          const result = await jobOrderService.create(item);
          results.push(result);
        }
        break;
      default:
        console.warn(`Unknown data type: ${dataType}`);
    }
    
    console.log(`Successfully synced ${results.length} items`);
    return results;
  } catch (error) {
    console.error(`Error syncing ${dataType}:`, error);
    throw error;
  }
};

export default {
  // User Management
  departmentService,
  roleService,
  userService,
  permissionService,
  
  // Customer Management
  customerService,
  vehicleService,
  
  // Job Order Management
  jobOrderService,
  serviceRequestService,
  additionalServiceRequestService,
  paymentService,
  exitPermitService,
  
  // Inspection & Quality
  inspectionService,
  qualityCheckService,
  
  // Sales Management
  salesLeadService,
  
  // Product Management
  productService,
  
  // Purchase Management
  purchaseOrderService,
  
  // Service Execution
  serviceExecutionService,
};
