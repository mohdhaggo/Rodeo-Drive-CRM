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

// ==================== ADMIN SETUP ====================

export const adminSetupService = {
  async setupAdminUser(input: {
    email: string;
    firstName: string;
    lastName: string;
  }) {
    try {
      console.log('Setting up admin user...', input);

      // Step 1: Create or get Admin Department
      let department = (await client.models.Department.list({
        filter: { name: { eq: 'Administration' } },
      })).data?.[0];

      if (!department) {
        const result = await client.models.Department.create({
          name: 'Administration',
          description: 'System Administration Department',
          status: 'active',
        });
        if (result.data) {
          department = result.data;
        } else {
          throw new Error('Failed to create Department');
        }
      }

      console.log('✅ Department ready:', department?.id);

      // Step 2: Create or get Admin Role
      let role = (await client.models.Role.list({
        filter: { name: { eq: 'Administrator' } },
      })).data?.[0];

      if (!role) {
        const result = await client.models.Role.create({
          name: 'Administrator',
          description: 'Full system access with all permissions',
          departmentId: department?.id,
          status: 'active',
        });
        if (result.data) {
          role = result.data;
        } else {
          throw new Error('Failed to create Role');
        }
      }

      console.log('✅ Role ready:', role?.id);

      // Step 3: Create User
      const userResult = await client.models.User.create({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        departmentId: department?.id || '',
        roleId: role?.id || '',
        status: 'active',
      });
      const user = userResult.data;

      console.log('✅ User created:', user?.id);

      // Step 4: Create Full Permissions for Admin Role
      const modules = [
        'overview',
        'joborder',
        'customer',
        'vehicle',
        'payment',
        'inspection',
        'exit-permit',
        'quality-check',
        'sales-leads',
        'purchase',
        'reports',
      ];

      for (const moduleName of modules) {
        await client.models.Permission.create({
          roleId: role?.id || '',
          moduleName: moduleName,
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
        });
      }

      console.log('✅ All permissions created for admin role');

      return {
        success: true,
        user,
        role,
        department,
        message: `Admin user ${input.email} created successfully with full access`,
      };
    } catch (error) {
      console.error('Error setting up admin user:', error);
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
        workStatus: (input.workStatus || 'New Request') as 'Inspection' | 'Cancelled' | 'Inprogress' | 'Completed' | 'New Request' | 'Quality Check' | 'Ready',
        paymentStatus: (input.paymentStatus || 'Unpaid') as 'Cancelled' | 'Fully Paid' | 'Partially Paid' | 'Unpaid',
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
      const { workStatus, paymentStatus, completionDate, ...rest } = input;
      const updateData: any = {
        id,
        ...rest,
      };
      if (workStatus) {
        updateData.workStatus = workStatus as 'Inspection' | 'Cancelled' | 'Inprogress' | 'Completed' | 'New Request' | 'Quality Check' | 'Ready';
      }
      if (paymentStatus) {
        updateData.paymentStatus = paymentStatus as 'Cancelled' | 'Fully Paid' | 'Partially Paid' | 'Unpaid';
      }
      if (completionDate) {
        updateData.completionDate = completionDate.toISOString();
      }
      const { data } = await client.models.JobOrder.update(updateData);
      return data;
    } catch (error: any) {
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
        status: (input.status || 'Pending') as 'Cancelled' | 'Inprogress' | 'Completed' | 'Pending',
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
      const { status, startTime, endTime, ...rest } = input;
      const updateData: any = {
        id,
        ...rest,
      };
      if (status) {
        updateData.status = status as 'Cancelled' | 'Inprogress' | 'Completed' | 'Pending';
      }
      if (startTime) {
        updateData.startTime = startTime.toISOString();
      }
      if (endTime) {
        updateData.endTime = endTime.toISOString();
      }
      const { data } = await client.models.ServiceRequest.update(updateData);
      return data;
    } catch (error: any) {
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
        status: (input.status || 'Requested') as 'Completed' | 'Requested' | 'Approved' | 'Rejected',
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
      const { status, ...rest } = input;
      const { data } = await client.models.AdditionalServiceRequest.update({
        id,
        ...rest,
        ...(status && { status: status as 'Completed' | 'Requested' | 'Approved' | 'Rejected' }),
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
      const { paymentMethod, paymentStatus, ...rest } = input;
      const { data } = await client.models.Payment.create({
        ...rest,
        paymentStatus: (paymentStatus || 'Pending') as 'Completed' | 'Pending' | 'Failed' | 'Refunded',
        ...(paymentMethod && { paymentMethod: paymentMethod as 'Cash' | 'Card' | 'Check' | 'Bank Transfer' | 'Online' }),
      });
      return data;
    } catch (error: any) {
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
      const { paymentStatus, paymentMethod, ...rest } = input;
      const { data } = await client.models.Payment.update({
        id,
        ...rest,
        ...(paymentStatus && { paymentStatus: paymentStatus as 'Completed' | 'Pending' | 'Failed' | 'Refunded' }),
        ...(paymentMethod && { paymentMethod: paymentMethod as 'Cash' | 'Card' | 'Check' | 'Bank Transfer' | 'Online' }),
      });
      return data;
    } catch (error: any) {
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
        status: (input.status || 'Not Created') as 'Created' | 'Not Created' | 'Collected',
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
      const { status, createdDate, collectedDate, nextServiceDate, permitNumber, collectedByUserId } = input;
      const updateData: any = {
        id,
      };
      if (permitNumber) {
        updateData.permitNumber = permitNumber;
      }
      if (collectedByUserId) {
        updateData.collectedByUserId = collectedByUserId;
      }
      if (status) {
        updateData.status = status as 'Created' | 'Not Created' | 'Collected';
      }
      if (createdDate) {
        updateData.createdDate = createdDate.toISOString();
      }
      if (collectedDate) {
        updateData.collectedDate = collectedDate.toISOString();
      }
      if (nextServiceDate) {
        updateData.nextServiceDate = nextServiceDate.toISOString();
      }
      const { data } = await client.models.ExitPermit.update(updateData);
      return data;
    } catch (error: any) {
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
        status: (input.status || 'Pending') as 'Completed' | 'Pending' | 'In Progress' | 'Failed',
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
      const { status, ...rest } = input;
      const { data } = await client.models.Inspection.update({
        id,
        ...rest,
        ...(status && { status: status as 'Completed' | 'Pending' | 'In Progress' | 'Failed' }),
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
        status: (input.status || 'Pending') as 'Pending' | 'In Progress' | 'Failed' | 'Passed',
        approvalStatus: (input.approvalStatus || 'Not Required') as 'Pending' | 'Approved' | 'Rejected' | 'Not Required',
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
      const { status, approvalStatus, ...rest } = input;
      const { data } = await client.models.QualityCheck.update({
        id,
        ...rest,
        ...(status && { status: status as 'Pending' | 'In Progress' | 'Failed' | 'Passed' }),
        ...(approvalStatus && { approvalStatus: approvalStatus as 'Pending' | 'Approved' | 'Rejected' | 'Not Required' }),
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
      const { stage, expectedCloseDate, ...rest } = input;
      const { data } = await client.models.SalesLead.create({
        ...rest,
        stage: (stage || 'Lead') as 'Lead' | 'Prospect' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost',
        ...(expectedCloseDate && { expectedCloseDate: expectedCloseDate.toISOString() }),
      });
      return data;
    } catch (error: any) {
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
      const { stage, expectedCloseDate, ...rest } = input;
      const { data } = await client.models.SalesLead.update({
        id,
        ...rest,
        ...(stage && { stage: stage as 'Lead' | 'Prospect' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost' }),
        ...(expectedCloseDate && { expectedCloseDate: expectedCloseDate.toISOString() }),
      });
      return data;
    } catch (error: any) {
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
      const { status, deliveryDate, ...rest } = input;
      const { data } = await client.models.PurchaseOrder.create({
        ...rest,
        status: (status || 'Draft') as 'Cancelled' | 'Approved' | 'Draft' | 'Submitted' | 'Received',
        ...(deliveryDate && { deliveryDate: deliveryDate.toISOString() }),
      });
      return data;
    } catch (error: any) {
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
      const { status, deliveryDate, ...rest } = input;
      const { data } = await client.models.PurchaseOrder.update({
        id,
        ...rest,
        ...(status && { status: status as 'Cancelled' | 'Approved' | 'Draft' | 'Submitted' | 'Received' }),
        ...(deliveryDate && { deliveryDate: deliveryDate.toISOString() }),
      });
      return data;
    } catch (error: any) {
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
      const { status, startTime, endTime, ...rest } = input;
      const createData: any = {
        ...rest,
        status: (status || 'Scheduled') as 'Cancelled' | 'Completed' | 'In Progress' | 'Scheduled' | 'On Hold',
      };
      if (startTime) {
        createData.startTime = startTime.toISOString();
      }
      if (endTime) {
        createData.endTime = endTime.toISOString();
      }
      const { data } = await client.models.ServiceExecution.create(createData);
      return data;
    } catch (error: any) {
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
      const { status, startTime, endTime, ...rest } = input;
      const updateData: any = {
        id,
        ...rest,
      };
      if (status) {
        updateData.status = status as 'Cancelled' | 'Completed' | 'In Progress' | 'Scheduled' | 'On Hold';
      }
      if (startTime) {
        updateData.startTime = startTime.toISOString();
      }
      if (endTime) {
        updateData.endTime = endTime.toISOString();
      }
      const { data } = await client.models.ServiceExecution.update(updateData);
      return data;
    } catch (error: any) {
      console.error('Error updating service execution:', error);
      throw error;
    }
  },
};

// ==================== Contact Management ====================
export const contactService = {
  async getAll() {
    try {
      const { data } = await client.models.Contact.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  },

  async getByCustomerId(customerId: string) {
    try {
      const { data } = await client.models.Contact.list({
        filter: { customerId: { eq: customerId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching contacts for customer:', error);
      return [];
    }
  },

  async create(input: { firstName: string; lastName: string; email: string; phone?: string; customerId: string }) {
    try {
      const { data } = await client.models.Contact.create(input);
      return data;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<{ firstName: string; lastName: string; email: string; phone: string }>) {
    try {
      const { data } = await client.models.Contact.update({ id, ...input });
      return data;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { data } = await client.models.Contact.delete({ id });
      return data;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  },
};

// ==================== Invoice Management ====================
export const invoiceService = {
  async getAll() {
    try {
      const { data } = await client.models.Invoice.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  },

  async getByJobOrderId(jobOrderId: string) {
    try {
      const { data } = await client.models.Invoice.list({
        filter: { jobOrderId: { eq: jobOrderId } },
      });
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching invoice for job order:', error);
      return null;
    }
  },

  async create(input: {
    invoiceNumber: string;
    jobOrderId: string;
    customerId: string;
    invoiceDate: Date;
    dueDate?: Date;
    subtotal: number;
    taxAmount?: number;
    totalAmount: number;
    status?: string;
    notes?: string;
  }) {
    try {
      const { invoiceDate, dueDate, ...rest } = input;
      const createData: any = {
        ...rest,
        invoiceDate: invoiceDate.toISOString(),
        status: input.status || 'Draft',
      };
      if (dueDate) {
        createData.dueDate = dueDate.toISOString();
      }
      const { data } = await client.models.Invoice.create(createData);
      return data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<any>) {
    try {
      const { data } = await client.models.Invoice.update({ id, ...input });
      return data;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },
};

// ==================== Supplier Management ====================
export const supplierService = {
  async getAll() {
    try {
      const { data } = await client.models.Supplier.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  },

  async create(input: any) {
    try {
      const { data } = await client.models.Supplier.create(input);
      return data;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<any>) {
    try {
      const { data } = await client.models.Supplier.update({ id, ...input });
      return data;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  },
};

// ==================== Approval Requests ====================
export const approvalRequestService = {
  async getAll() {
    try {
      const { data } = await client.models.ApprovalRequest.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      return [];
    }
  },

  async getByApprover(approverUserId: string) {
    try {
      const { data } = await client.models.ApprovalRequest.list({
        filter: { approverUserId: { eq: approverUserId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
  },

  async create(input: any) {
    try {
      const { requestDate, responseDate, dueDate, ...rest } = input;
      const createData: any = {
        ...rest,
        requestDate: requestDate?.toISOString() || new Date().toISOString(),
      };
      if (responseDate) createData.responseDate = responseDate.toISOString();
      if (dueDate) createData.dueDate = dueDate.toISOString();
      const { data } = await client.models.ApprovalRequest.create(createData);
      return data;
    } catch (error) {
      console.error('Error creating approval request:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<any>) {
    try {
      const { data } = await client.models.ApprovalRequest.update({ id, ...input });
      return data;
    } catch (error) {
      console.error('Error updating approval request:', error);
      throw error;
    }
  },
};

// ==================== Service Approval ====================
export const serviceApprovalRequestService = {
  async getAll() {
    try {
      const { data } = await client.models.ServiceApprovalRequest.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching service approvals:', error);
      return [];
    }
  },

  async getByJobOrderId(jobOrderId: string) {
    try {
      const { data } = await client.models.ServiceApprovalRequest.list({
        filter: { jobOrderId: { eq: jobOrderId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching service approvals for job order:', error);
      return [];
    }
  },

  async create(input: any) {
    try {
      const { requestDate, approvalDate, ...rest } = input;
      const createData: any = {
        ...rest,
        requestDate: requestDate?.toISOString() || new Date().toISOString(),
      };
      if (approvalDate) createData.approvalDate = approvalDate.toISOString();
      const { data } = await client.models.ServiceApprovalRequest.create(createData);
      return data;
    } catch (error) {
      console.error('Error creating service approval:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<any>) {
    try {
      const { data } = await client.models.ServiceApprovalRequest.update({ id, ...input });
      return data;
    } catch (error) {
      console.error('Error updating service approval:', error);
      throw error;
    }
  },
};

// ==================== Quotation Management ====================
export const quotationService = {
  async getAll() {
    try {
      const { data } = await client.models.Quotation.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching quotations:', error);
      return [];
    }
  },

  async getByCustomerId(customerId: string) {
    try {
      const { data } = await client.models.Quotation.list({
        filter: { customerId: { eq: customerId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching quotations for customer:', error);
      return [];
    }
  },

  async create(input: any) {
    try {
      const { validUntil, ...rest } = input;
      const createData: any = rest;
      if (validUntil) createData.validUntil = validUntil.toISOString();
      const { data } = await client.models.Quotation.create(createData);
      return data;
    } catch (error) {
      console.error('Error creating quotation:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<any>) {
    try {
      const { data } = await client.models.Quotation.update({ id, ...input });
      return data;
    } catch (error) {
      console.error('Error updating quotation:', error);
      throw error;
    }
  },
};

// ==================== Activity Log ====================
export const activityLogService = {
  async getAll() {
    try {
      const { data } = await client.models.ActivityLog.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }
  },

  async getByUserId(userId: string) {
    try {
      const { data } = await client.models.ActivityLog.list({
        filter: { userId: { eq: userId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching logs for user:', error);
      return [];
    }
  },

  async log(input: any) {
    try {
      const { data } = await client.models.ActivityLog.create(input);
      return data;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  },
};

// ==================== Work Log ====================
export const workLogService = {
  async getAll() {
    try {
      const { data } = await client.models.WorkLog.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching work logs:', error);
      return [];
    }
  },

  async getByJobOrderId(jobOrderId: string) {
    try {
      const { data } = await client.models.WorkLog.list({
        filter: { jobOrderId: { eq: jobOrderId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching work logs for job order:', error);
      return [];
    }
  },

  async create(input: any) {
    try {
      const { startTime, endTime, ...rest } = input;
      const createData: any = {
        ...rest,
        startTime: startTime.toISOString(),
      };
      if (endTime) {
        createData.endTime = endTime.toISOString();
        // Calculate duration in hours
        const start = new Date(startTime);
        const end = new Date(endTime);
        createData.duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
      const { data } = await client.models.WorkLog.create(createData);
      return data;
    } catch (error) {
      console.error('Error creating work log:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<any>) {
    try {
      const { data } = await client.models.WorkLog.update({ id, ...input });
      return data;
    } catch (error) {
      console.error('Error updating work log:', error);
      throw error;
    }
  },
};

// ==================== Notifications ====================
export const notificationService = {
  async getAll() {
    try {
      const { data } = await client.models.Notification.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  async getByUserId(userId: string) {
    try {
      const { data } = await client.models.Notification.list({
        filter: { userId: { eq: userId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications for user:', error);
      return [];
    }
  },

  async getUnread(userId: string) {
    try {
      const { data } = await client.models.Notification.list({
        filter: { userId: { eq: userId }, isRead: { eq: false } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }
  },

  async create(input: any) {
    try {
      const { expiresAt, readAt, ...rest } = input;
      const createData: any = {
        ...rest,
        isRead: false,
      };
      if (expiresAt) createData.expiresAt = expiresAt.toISOString();
      const { data } = await client.models.Notification.create(createData);
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  async markAsRead(id: string) {
    try {
      const { data } = await client.models.Notification.update({
        id,
        isRead: true,
        readAt: new Date().toISOString(),
      });
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },
};

// ==================== Sales Approval ====================
export const salesApprovalService = {
  async getAll() {
    try {
      const { data } = await client.models.SalesApproval.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching sales approvals:', error);
      return [];
    }
  },

  async getByLeadId(leadId: string) {
    try {
      const { data } = await client.models.SalesApproval.list({
        filter: { leadId: { eq: leadId } },
      });
      return data || [];
    } catch (error) {
      console.error('Error fetching approvals for lead:', error);
      return [];
    }
  },

  async create(input: any) {
    try {
      const { data } = await client.models.SalesApproval.create(input);
      return data;
    } catch (error) {
      console.error('Error creating sales approval:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<any>) {
    try {
      const { data } = await client.models.SalesApproval.update({ id, ...input });
      return data;
    } catch (error) {
      console.error('Error updating sales approval:', error);
      throw error;
    }
  },
};

// ==================== Company Management ====================
export const companyService = {
  async getAll() {
    try {
      const { data } = await client.models.Company.list();
      return data || [];
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  },

  async create(input: any) {
    try {
      const { data } = await client.models.Company.create(input);
      return data;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  },

  async update(id: string, input: Partial<any>) {
    try {
      const { data } = await client.models.Company.update({ id, ...input });
      return data;
    } catch (error) {
      console.error('Error updating company:', error);
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
  contactService,
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
  salesApprovalService,

  // Product Management
  productService,
  quotationService,

  // Purchase Management
  purchaseOrderService,
  supplierService,

  // Service Execution
  serviceExecutionService,

  // Invoice Management
  invoiceService,

  // Approvals & Workflows
  approvalRequestService,
  serviceApprovalRequestService,

  // Activity & Notifications
  activityLogService,
  workLogService,
  notificationService,

  // Company Management
  companyService,
};
