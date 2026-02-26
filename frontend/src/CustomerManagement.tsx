import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './CustomerManagement.css';
import { getCustomers, getStoredJobOrders } from './demoData';
import { customerService, vehicleService } from './amplifyService';
import PermissionGate from './PermissionGate';

// Types
interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string | null;
  registeredVehiclesCount: number;
  completedServicesCount: number;
  customerSince: string;
  vehicles?: Vehicle[];
}

interface Vehicle {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  vehicleType?: string;
  color: string;
  plateNumber: string;
  vin?: string;
  completedServices?: number;
}

interface JobOrder {
  workStatus?: string;
  customerDetails?: {
    name?: string;
    mobile?: string;
    customerId?: string;
    id?: string;
  };
  customerName?: string;
  mobile?: string;
  customerId?: string;
  customer?: {
    id?: string;
    customerId?: string;
  };
  vehicleDetails?: {
    vehicleId?: string;
    id?: string;
  };
}

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  showCancel: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
}

interface FormData {
  name: string;
  mobile: string;
  email: string;
  address: string;
}

interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  type: string;
  color: string;
  plate: string;
  vin: string;
}

interface FormErrors {
  name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  vehicle?: string;
}

// Utility function to build completed service counts
const buildCompletedServiceCounts = (orders: JobOrder[], customers: Customer[]) => {
  const customerCounts: Record<string, number> = {};
  const vehicleCounts: Record<string, number> = {};
  const customerByNameMobile: Record<string, string> = {};

  (customers || []).forEach((customer) => {
    const nameKey = (customer.name || '').trim().toLowerCase();
    const mobileKey = (customer.mobile || '').trim().toLowerCase();
    if (!nameKey || !mobileKey) return;
    customerByNameMobile[`${nameKey}|${mobileKey}`] = customer.id;
  });

  orders.forEach((order) => {
    const workStatus = (order.workStatus || '').toLowerCase();
    if (workStatus !== 'completed') return;

    const orderName = (order.customerDetails?.name || order.customerName || '').trim().toLowerCase();
    const orderMobile = (order.customerDetails?.mobile || order.mobile || '').trim().toLowerCase();
    const customerId = order.customerDetails?.customerId
      || order.customerDetails?.id
      || order.customerId
      || order.customer?.id
      || order.customer?.customerId
      || customerByNameMobile[`${orderName}|${orderMobile}`];
    const vehicleId = order.vehicleDetails?.vehicleId || order.vehicleDetails?.id;

    if (customerId) {
      customerCounts[customerId] = (customerCounts[customerId] || 0) + 1;
    }

    if (vehicleId) {
      vehicleCounts[vehicleId] = (vehicleCounts[vehicleId] || 0) + 1;
    }
  });

  return { customerCounts, vehicleCounts };
};

// Alert Popup Component
interface AlertPopupProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  showCancel?: boolean;
  onConfirm?: () => void;
}

const AlertPopup: React.FC<AlertPopupProps> = ({ 
  isOpen, 
  title, 
  message, 
  type, 
  onClose, 
  showCancel = false, 
  onConfirm 
}) => {
  if (!isOpen) return null;

  const getIcon = (): string => {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-info-circle';
    }
  };

  return (
    <div className="alert-popup-overlay show" onClick={onClose}>
      <div className={`alert-popup alert-${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="alert-popup-header">
          <div className="alert-popup-title">
            <i className={getIcon()}></i>
            <span>{title}</span>
          </div>
        </div>
        <div className="alert-popup-body">
          <div className="alert-popup-message">{message}</div>
        </div>
        <div className="alert-popup-footer">
          {!showCancel ? (
            <button className="alert-popup-btn ok" onClick={onClose}>OK</button>
          ) : (
            <>
              <button className="alert-popup-btn cancel" onClick={onClose}>Cancel</button>
              <button className="alert-popup-btn confirm" onClick={onConfirm}>Confirm</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal Component
interface ModalProps {
  isOpen: boolean;
  title: string;
  icon: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave: () => void;
  isEdit?: boolean;
  saving?: boolean;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  title, 
  icon, 
  children, 
  onClose, 
  onSave, 
  isEdit = false, 
  saving = false 
}) => {
  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className={icon}></i> {title}
          </h3>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <button 
            className="btn-save" 
            onClick={onSave} 
            disabled={saving}
            aria-label={saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Customer')}
          >
            <i className="fas fa-save"></i> {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Customer')}
          </button>
          <button className="btn-cancel" onClick={onClose} disabled={saving}>
            <i className="fas fa-times"></i> Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Form Field Component
interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<string | { value: string; label: string }>;
}

const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  id, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  placeholder, 
  required = false, 
  disabled = false, 
  options = null 
}) => {
  const isSelect = type === 'select';

  return (
    <div className="form-group">
      <label htmlFor={id}>
        {label}
        {required && <span className="required">*</span>}
        {!required && <span className="form-optional">(optional)</span>}
      </label>
      {isSelect ? (
        <select
          id={id}
          className={`form-control ${error ? 'error' : ''}`}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
        >
          {options && options.map((opt) => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={optValue} value={optValue}>{optLabel}</option>
            );
          })}
        </select>
      ) : (
        <input
          type={type}
          id={id}
          className={`form-control ${error ? 'error' : ''}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
        />
      )}
      {error && <div className="error-message show">{error}</div>}
    </div>
  );
};

// Table Component
interface CustomersTableProps {
  data: Customer[];
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (customer: Customer | string) => void;
  currentPage: number;
  pageSize: number;
  searchQuery: string;
}

const CustomersTable: React.FC<CustomersTableProps> = ({ 
  data, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  currentPage: _, // eslint-disable-line @typescript-eslint/no-unused-vars
  pageSize: __, // eslint-disable-line @typescript-eslint/no-unused-vars
  searchQuery: ___ // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeDropdownCustomer, setActiveDropdownCustomer] = useState<Customer | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isDropdownButton = target.closest('.btn-action-dropdown');
      const isDropdownMenu = target.closest('.action-dropdown-menu');
      if (!isDropdownButton && !isDropdownMenu) {
        setActiveDropdown(null);
        setActiveDropdownCustomer(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [activeDropdown]);

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <i className="fas fa-search"></i>
        </div>
        <div className="empty-text">No matching customers found</div>
        <div className="empty-subtext">Try adjusting your search terms or clear the search to see all records</div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="customers-table">
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Customer Name</th>
            <th>Mobile Number</th>
            <th>Count of Registered Vehicles</th>
            <th>Count of Completed Services</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.id}</td>
              <td>{customer.name}</td>
              <td>{customer.mobile}</td>
              <td><span className="count-badge">{customer.registeredVehiclesCount} vehicles</span></td>
              <td><span className="count-badge">{customer.completedServicesCount} services</span></td>
              <td>
                <PermissionGate moduleId="customer" optionId="customer_actions">
                  <div className="action-dropdown-container">
                    <button
                      type="button"
                      className={`btn-action-dropdown ${activeDropdown === customer.id ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const isActive = activeDropdown === customer.id;
                        if (isActive) {
                          setActiveDropdown(null);
                          setActiveDropdownCustomer(null);
                          return;
                        }
                        const rect = e.currentTarget.getBoundingClientRect();
                        const menuHeight = 160;
                        const menuWidth = 200;
                        const spaceBelow = window.innerHeight - rect.bottom;
                        const top = spaceBelow < menuHeight ? rect.top - menuHeight - 6 : rect.bottom + 6;
                        const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
                        setDropdownPosition({ top, left });
                        setActiveDropdown(customer.id);
                        setActiveDropdownCustomer(customer);
                      }}
                      aria-label={`Actions for ${customer.name}`}
                    >
                      <i className="fas fa-cogs"></i> Actions <i className="fas fa-chevron-down"></i>
                    </button>
                  </div>
                </PermissionGate>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {activeDropdown && typeof document !== 'undefined' && createPortal(
        <PermissionGate moduleId="customer" optionId="customer_actions">
          <div
            className="action-dropdown-menu show action-dropdown-menu-fixed"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
          >
            <button 
              type="button" 
              className="dropdown-item view" 
              onClick={() => { 
                onViewDetails(activeDropdown); 
                setActiveDropdown(null); 
                setActiveDropdownCustomer(null); 
              }}
            >
              <i className="fas fa-eye"></i> View Details
            </button>
            <div className="dropdown-divider"></div>
            <button 
              type="button" 
              className="dropdown-item edit" 
              onClick={() => { 
                onEdit(activeDropdown); 
                setActiveDropdown(null); 
                setActiveDropdownCustomer(null); 
              }}
            >
              <i className="fas fa-edit"></i> Edit Customer
            </button>
            <div className="dropdown-divider"></div>
            <button 
              type="button" 
              className="dropdown-item delete" 
              onClick={() => { 
                const cust = activeDropdownCustomer || data.find(c => c.id === activeDropdown); 
                if (cust) {
                  onDelete(cust); 
                }
                setActiveDropdown(null); 
                setActiveDropdownCustomer(null); 
              }}
            >
              <i className="fas fa-trash"></i> Delete Customer
            </button>
          </div>
        </PermissionGate>,
        document.body
      )}
    </div>
  );
};

// Details View Component
interface DetailsViewProps {
  customer: Customer;
  onClose: () => void;
  onEdit: (id: string) => void;
  onAddVehicle: (customerId: string) => void;
  onDeleteVehicle: (customerId: string, vehicleId: string) => void;
  onViewVehicleDetails: (customerId: string, vehicle: Vehicle) => void;
  getVehicleCompletedCount: (vehicleId: string) => number;
}

const DetailsView: React.FC<DetailsViewProps> = ({ 
  customer, 
  onClose, 
  onEdit, 
  onAddVehicle, 
  onDeleteVehicle, 
  onViewVehicleDetails, 
  getVehicleCompletedCount 
}) => {
  const [activeVehicleDropdown, setActiveVehicleDropdown] = useState<string | null>(null);
  const [vehicleDropdownPosition, setVehicleDropdownPosition] = useState({ top: 0, left: 0 });
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isDropdownButton = target.closest('.btn-action-dropdown');
      const isDropdownMenu = target.closest('.action-dropdown-menu');
      
      if (!isDropdownButton && !isDropdownMenu) {
        setActiveVehicleDropdown(null);
      }
    };

    if (activeVehicleDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [activeVehicleDropdown]);

  if (!customer) return null;

  return (
    <div className="pim-details-screen">
      <div className="pim-details-header">
        <div className="pim-details-title-container">
          <h2>
            <i className="fas fa-user-circle"></i> Customer Details - <span>{customer.id}</span>
          </h2>
        </div>
        <button className="pim-btn-close-details" onClick={onClose}>
          <i className="fas fa-times"></i> Close Details
        </button>
      </div>

      <div className="pim-details-body">
        <div className="pim-details-grid">
          {/* Customer Info Card */}
          <div className="pim-detail-card">
            <div className="details-card-header">
              <h3><i className="fas fa-user"></i> Customer Information</h3>
              <button className="btn-action btn-edit" onClick={() => onEdit(customer.id)}>
                <i className="fas fa-edit"></i> Edit Customer
              </button>
            </div>
            <div className="pim-card-content">
              <div className="pim-info-item">
                <span className="pim-info-label">Customer ID</span>
                <span className="pim-info-value">{customer.id}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Customer Name</span>
                <span className="pim-info-value">{customer.name}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Mobile Number</span>
                <span className="pim-info-value">{customer.mobile}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Email Address</span>
                <span className="pim-info-value">{customer.email || 'Not provided'}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Home Address</span>
                <span className="pim-info-value">{customer.address || 'Not provided'}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Registered Vehicles</span>
                <span className="pim-info-value">
                  <span className="count-badge">{customer.registeredVehiclesCount} vehicles</span>
                </span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Completed Services</span>
                <span className="pim-info-value">
                  <span className="count-badge">{customer.completedServicesCount} services</span>
                </span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Customer Since</span>
                <span className="pim-info-value">{customer.customerSince}</span>
              </div>
            </div>
          </div>

          {/* Vehicles Card */}
          <div className="pim-detail-card">
            <div className="details-card-header">
              <h3><i className="fas fa-car"></i> Registered Vehicles</h3>
              <button className="btn-add-vehicle" onClick={() => onAddVehicle(customer.id)}>
                <i className="fas fa-plus-circle"></i> Add New Vehicle
              </button>
            </div>
            <div className="table-wrapper details-table-wrapper">
              <table className="vehicles-table">
                <thead>
                  <tr>
                    <th>Vehicle ID</th>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Year</th>
                    <th>Type</th>
                    <th>Color</th>
                    <th>Plate Number</th>
                    <th>VIN</th>
                    <th>Completed Services</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.vehicles && customer.vehicles.length > 0 ? (
                    customer.vehicles.map((vehicle) => (
                      <tr key={vehicle.vehicleId}>
                        <td>{vehicle.vehicleId}</td>
                        <td>{vehicle.make}</td>
                        <td>{vehicle.model}</td>
                        <td>{vehicle.year}</td>
                        <td>{vehicle.vehicleType || 'N/A'}</td>
                        <td>{vehicle.color}</td>
                        <td>{vehicle.plateNumber}</td>
                        <td>{vehicle.vin || 'N/A'}</td>
                        <td><span className="service-count-badge">{getVehicleCompletedCount(vehicle.vehicleId)} services</span></td>
                        <td>
                          <div className="action-dropdown-container">
                            <button
                              className={`btn-action-dropdown ${activeVehicleDropdown === vehicle.vehicleId ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const isActive = activeVehicleDropdown === vehicle.vehicleId;
                                if (isActive) {
                                  setActiveVehicleDropdown(null);
                                  return;
                                }
                                const rect = e.currentTarget.getBoundingClientRect();
                                const menuHeight = 140;
                                const menuWidth = 200;
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const top = spaceBelow < menuHeight ? rect.top - menuHeight - 6 : rect.bottom + 6;
                                const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
                                setVehicleDropdownPosition({ top, left });
                                setActiveVehicleDropdown(vehicle.vehicleId);
                              }}
                              aria-label={`Actions for ${vehicle.make} ${vehicle.model}`}
                            >
                              <i className="fas fa-cogs"></i> Actions <i className="fas fa-chevron-down"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '30px' }}>
                        No vehicles registered
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {activeVehicleDropdown && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="action-dropdown-menu show action-dropdown-menu-fixed"
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              top: `${vehicleDropdownPosition.top}px`,
              left: `${vehicleDropdownPosition.left}px`
            }}
          >
            <button
              className="dropdown-item view"
              onClick={() => {
                const vehicle = customer.vehicles?.find(v => v.vehicleId === activeVehicleDropdown);
                if (vehicle) {
                  onViewVehicleDetails(customer.id, vehicle);
                }
                setActiveVehicleDropdown(null);
              }}
            >
              <i className="fas fa-eye"></i> View Details
            </button>
            <div className="dropdown-divider"></div>
            <button
              className="dropdown-item delete"
              onClick={() => {
                const vehicle = customer.vehicles?.find(v => v.vehicleId === activeVehicleDropdown);
                if (vehicle) {
                  setDeleteVehicle(vehicle);
                }
                setActiveVehicleDropdown(null);
              }}
            >
              <i className="fas fa-trash"></i> Delete Vehicle
            </button>
          </div>,
          document.body
        )}

      {/* Delete Vehicle Confirmation Modal */}
      {deleteVehicle && (
        <div className="delete-modal-overlay" onClick={() => setDeleteVehicle(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h3><i className="fas fa-exclamation-triangle"></i> Confirm Deletion</h3>
            </div>
            <div className="delete-modal-body">
              <div className="delete-warning">
                <i className="fas fa-exclamation-circle"></i>
                <div className="delete-warning-text">
                  <p>You are about to delete the vehicle <strong>{deleteVehicle.make} {deleteVehicle.model}</strong> (ID: <strong>{deleteVehicle.vehicleId}</strong>).</p>
                  <p>This action cannot be undone. All vehicle records and service history will be permanently removed from the system.</p>
                </div>
              </div>
              
              <div className="delete-modal-actions">
                <button className="btn-confirm-delete" onClick={() => {
                  onDeleteVehicle(customer.id, deleteVehicle.vehicleId);
                  setDeleteVehicle(null);
                }}>
                  <i className="fas fa-trash"></i> Delete Vehicle
                </button>
                <button className="btn-cancel" onClick={() => setDeleteVehicle(null)}>
                  <i className="fas fa-times"></i> Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
interface CustomerManagementProps {
  onNavigate?: (module: string, params?: any) => void;
  returnToCustomer?: string | null;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ onNavigate, returnToCustomer }) => {
  // Load initial customers from Amplify backend
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>(customers);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(() => getStoredJobOrders() || []);
  const [handledReturnToCustomer, setHandledReturnToCustomer] = useState(false);
  const customersRef = useRef<Customer[]>(customers);

  // Load customers from Amplify on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const amplifyCustomers = await customerService.getAll();
        console.log('✅ Loaded customers from Amplify:', amplifyCustomers);
        
        // Map Amplify data to Customer interface
        const mappedCustomers = (amplifyCustomers || []).map((cust: any): Customer => {
          const vehicles: Vehicle[] = (cust.vehicles || []).map((v: any) => ({
            vehicleId: v.id,
            make: v.make,
            model: v.model,
            year: parseInt(v.year) || new Date().getFullYear(),
            vehicleType: v.vehicleType || '',
            color: v.color || '',
            plateNumber: v.plateNumber || '',
            vin: v.vin || '',
            completedServices: v.jobOrders?.filter((jo: any) => jo.workStatus === 'Completed').length || 0
          }));
          
          return {
            id: cust.id,
            name: cust.name,
            email: cust.email,
            mobile: cust.mobile || '',
            address: cust.address || null,
            registeredVehiclesCount: vehicles.length,
            completedServicesCount: cust.jobOrders?.filter((jo: any) => jo.workStatus === 'Completed').length || 0,
            customerSince: cust.createdAt ? new Date(cust.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            vehicles: vehicles
          };
        });
        
        // Also merge with any locally saved customers that might not be in the cloud yet
        const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]') as Customer[];
        const allCustomers: Customer[] = [...mappedCustomers];
        savedCustomers.forEach((saved: Customer) => {
          if (!allCustomers.some(customer => customer.id === saved.id)) {
            allCustomers.push(saved);
          }
        });
        
        setCustomers(allCustomers);
      } catch (error) {
        console.error('❌ Error loading customers from Amplify:', error);
        // Fall back to demo data if Amplify fails
        const demoCustomersRaw = getCustomers() || [];
        const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]') as Customer[];
        const allCustomers: Customer[] = [...demoCustomersRaw as unknown as Customer[], ...savedCustomers];
        setCustomers(allCustomers);
      }
    };
    
    loadCustomers();
  }, []);

  // Modal states
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [addVehicleCustomerId, setAddVehicleCustomerId] = useState<string | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingCustomer, setPendingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  // Alert state
  const [alert, setAlert] = useState<AlertState>({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info', 
    showCancel: false 
  });

  // Form states
  const [formData, setFormData] = useState<FormData>({
    name: '', mobile: '', email: '', address: ''
  });
  
  const [vehicleData, setVehicleData] = useState<VehicleFormData>({
    make: '', model: '', year: new Date().getFullYear(), type: '', color: '', plate: '', vin: ''
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const handleCancelDelete = () => {
    setDeleteCustomer(null);
  };

  // Handle return from vehicle details
  useEffect(() => {
    if (returnToCustomer && !handledReturnToCustomer) {
      const customer = customers.find(c => c.id === returnToCustomer);
      if (customer) {
        setSelectedCustomer(customer);
        setViewMode('details');
        setHandledReturnToCustomer(true);
      }
    }
  }, [returnToCustomer, customers, handledReturnToCustomer]);

  useEffect(() => {
    if (returnToCustomer) {
      setHandledReturnToCustomer(false);
    }
  }, [returnToCustomer]);

  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  const refreshCompletedServiceCounts = useCallback(() => {
    try {
      const jobOrders = getStoredJobOrders() || [];
      const currentCustomers = customersRef.current || [];
      const { customerCounts, vehicleCounts } = buildCompletedServiceCounts(jobOrders, currentCustomers);

      const updatedCustomers = currentCustomers.map((customer) => {
        const updatedVehicles = (customer.vehicles || []).map((vehicle) => {
          const updatedCount = vehicleCounts[vehicle.vehicleId];
          if (updatedCount === undefined) return vehicle;
          return { ...vehicle, completedServices: updatedCount };
        });

        const completedServicesCount = customerCounts[customer.id];

        return {
          ...customer,
          vehicles: updatedVehicles,
          registeredVehiclesCount: updatedVehicles.length || customer.registeredVehiclesCount || 0,
          completedServicesCount: completedServicesCount !== undefined
            ? completedServicesCount
            : customer.completedServicesCount || 0
        };
      });

      setCustomers(updatedCustomers);

      if (typeof localStorage === 'undefined') return;
      const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
      if (savedCustomers.length === 0) return;

      const updatedSaved = savedCustomers.map((customer: Customer) => {
        const updatedVehicles = (customer.vehicles || []).map((vehicle) => {
          const updatedCount = vehicleCounts[vehicle.vehicleId];
          if (updatedCount === undefined) return vehicle;
          return { ...vehicle, completedServices: updatedCount };
        });

        const completedServicesCount = customerCounts[customer.id];

        return {
          ...customer,
          vehicles: updatedVehicles,
          registeredVehiclesCount: updatedVehicles.length || customer.registeredVehiclesCount || 0,
          completedServicesCount: completedServicesCount !== undefined
            ? completedServicesCount
            : customer.completedServicesCount || 0
        };
      });

      localStorage.setItem('jobOrderCustomers', JSON.stringify(updatedSaved));
    } catch (error) {
      console.error('Error refreshing service counts:', error);
    }
  }, []);

  useEffect(() => {
    refreshCompletedServiceCounts();
  }, [refreshCompletedServiceCounts]);

  useEffect(() => {
    const handleCompletedServicesUpdate = () => {
      refreshCompletedServiceCounts();
      setJobOrders(getStoredJobOrders() || []);
    };

    window.addEventListener('completed-services-updated', handleCompletedServicesUpdate);
    return () => window.removeEventListener('completed-services-updated', handleCompletedServicesUpdate);
  }, [refreshCompletedServiceCounts]);

  const getVehicleCompletedCount = useCallback((vehicleId: string): number => {
    if (!vehicleId) return 0;
    return jobOrders.filter(order =>
      order.vehicleDetails?.vehicleId === vehicleId &&
      order.workStatus?.toLowerCase() === 'completed'
    ).length;
  }, [jobOrders]);

  // Search function
  const performSmartSearch = useCallback((query: string): Customer[] => {
    if (!query.trim()) {
      return customers;
    }

    const terms = query.toLowerCase().split(' ').filter(term => term.trim());
    let results = [...customers];

    terms.forEach(term => {
      results = results.filter(customer =>
        customer.id.toLowerCase().includes(term) ||
        customer.name.toLowerCase().includes(term) ||
        customer.mobile.toLowerCase().includes(term) ||
        (customer.email || '').toLowerCase().includes(term)
      );
    });

    return results;
  }, [customers]);

  useEffect(() => {
    setSearchResults(performSmartSearch(searchQuery));
  }, [customers, searchQuery, performSmartSearch]);

  useEffect(() => {
    if (!selectedCustomer) return;
    const updatedCustomer = customers.find(c => c.id === selectedCustomer.id);
    if (updatedCustomer && updatedCustomer !== selectedCustomer) {
      setSelectedCustomer(updatedCustomer);
    }
  }, [customers, selectedCustomer]);

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSearchResults(performSmartSearch(query));
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = useMemo(() => Math.ceil(searchResults.length / pageSize), [searchResults.length, pageSize]);
  const paginatedData = useMemo(() => 
    searchResults.slice((currentPage - 1) * pageSize, currentPage * pageSize), 
    [searchResults, currentPage, pageSize]
  );

  // Show alert
  const showAlert = (title: string, message: string, type: AlertState['type'] = 'info', showCancel = false): Promise<boolean> => {
    return new Promise((resolve) => {
      setAlert({
        isOpen: true,
        title,
        message,
        type,
        showCancel,
        onClose: () => {
          setAlert(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        },
        onConfirm: () => {
          setAlert(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        }
      });
    });
  };

  // Customer management functions
  const validateCustomerForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\d{10,}$/.test(formData.mobile.replace(/\D/g, ''))) {
      errors.mobile = 'Please enter a valid mobile number';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCustomer = async () => {
    if (saving) return;
    
    if (!validateCustomerForm()) {
      return;
    }

    setSaving(true);

    try {
      // Check if customer with same name or mobile already exists in local state
      const existingCustomer = customers.find(
        customer => 
          customer.mobile.toLowerCase() === formData.mobile.toLowerCase() ||
          customer.name.toLowerCase() === formData.name.toLowerCase()
      );

      const newCustomer: Customer = {
        id: `CUST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        registeredVehiclesCount: 0,
        completedServicesCount: 0,
        customerSince: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        vehicles: []
      };

      if (existingCustomer) {
        setPendingCustomer(newCustomer);
        setShowDuplicateWarning(true);
        setSaving(false);
      } else {
        // Save customer to Amplify backend
        try {
          const createdCustomer = await customerService.create({
            name: newCustomer.name,
            mobile: newCustomer.mobile,
            email: newCustomer.email || undefined,
            address: newCustomer.address || undefined,
            status: 'active'
          });
          
          if (!createdCustomer) {
            throw new Error('Failed to create customer');
          }
          
          console.log('✅ Customer created in Amplify:', createdCustomer);
          
          // Map the response back to Customer interface
          const mappedCustomer: Customer = {
            id: createdCustomer.id,
            name: createdCustomer.name,
            mobile: createdCustomer.mobile || '',
            email: createdCustomer.email || undefined,
            address: createdCustomer.address || null,
            registeredVehiclesCount: 0,
            completedServicesCount: 0,
            customerSince: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            vehicles: []
          };
          
          const updatedCustomers = [mappedCustomer, ...customers];
          setCustomers(updatedCustomers);
          setSearchResults(prev => [mappedCustomer, ...prev]);
          
          setShowAddCustomerModal(false);
          setFormData({ name: '', mobile: '', email: '', address: '' });
          setFormErrors({});
          setSaving(false);
          await showAlert('Success', `Customer "${mappedCustomer.name}" added successfully!`, 'success');
        } catch (error) {
          console.error('Error creating customer in Amplify:', error);
          // Fall back to local storage if Amplify fails
          const updatedCustomers = [newCustomer, ...customers];
          setCustomers(updatedCustomers);
          setSearchResults(prev => [newCustomer, ...prev]);
          
          const currentSaved = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
          currentSaved.push(newCustomer);
          localStorage.setItem('jobOrderCustomers', JSON.stringify(currentSaved));
          
          setShowAddCustomerModal(false);
          setFormData({ name: '', mobile: '', email: '', address: '' });
          setFormErrors({});
          setSaving(false);
          await showAlert('Success', `Customer "${newCustomer.name}" added successfully (offline)!`, 'success');
        }
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      setSaving(false);
      await showAlert('Error', 'Failed to add customer. Please try again.', 'error');
    }
  };

  const handleConfirmDuplicate = async () => {
    if (pendingCustomer && !saving) {
      setSaving(true);
      try {
        // Try to save to Amplify, but allow duplicate
        try {
          const createdCustomer = await customerService.create({
            name: pendingCustomer.name,
            mobile: pendingCustomer.mobile,
            email: pendingCustomer.email || undefined,
            address: pendingCustomer.address || undefined,
            status: 'active'
          });
          
          if (createdCustomer) {
            const mappedCustomer: Customer = {
              id: createdCustomer.id,
              name: createdCustomer.name,
              mobile: createdCustomer.mobile || '',
              email: createdCustomer.email || undefined,
              address: createdCustomer.address || null,
              registeredVehiclesCount: 0,
              completedServicesCount: 0,
              customerSince: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
              vehicles: []
            };
            
            const updatedCustomers = [mappedCustomer, ...customers];
            setCustomers(updatedCustomers);
            setSearchResults(prev => [mappedCustomer, ...prev]);
          } else {
            throw new Error('Failed to create customer');
          }
        } catch (error) {
          console.error('Error creating customer in Amplify:', error);
          // Fall back to local storage
          const updatedCustomers = [pendingCustomer, ...customers];
          setCustomers(updatedCustomers);
          setSearchResults(prev => [pendingCustomer, ...prev]);
          
          const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
          savedCustomers.push(pendingCustomer);
          localStorage.setItem('jobOrderCustomers', JSON.stringify(savedCustomers));
        }
        
        setShowAddCustomerModal(false);
        setFormData({ name: '', mobile: '', email: '', address: '' });
        setFormErrors({});
        setShowDuplicateWarning(false);
        setPendingCustomer(null);
        setSaving(false);
        await showAlert('Success', `Customer "${pendingCustomer.name}" added successfully!`, 'success');
      } catch (error) {
        console.error('Error adding duplicate customer:', error);
        setSaving(false);
        await showAlert('Error', 'Failed to add customer. Please try again.', 'error');
      }
    }
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateWarning(false);
    setPendingCustomer(null);
    setSaving(false);
  };

  const handleEditCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setEditingCustomerId(customerId);
      setFormData({ 
        name: customer.name, 
        mobile: customer.mobile, 
        email: customer.email || '', 
        address: customer.address || '' 
      });
      setShowEditCustomerModal(true);
      setFormErrors({});
    }
  };

  const handleSaveCustomer = async () => {
    if (!validateCustomerForm()) {
      return;
    }

    try {
      // Try to update in Amplify backend
      try {
        await customerService.update(editingCustomerId || '', {
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email || undefined,
          address: formData.address || undefined
        });
        console.log('✅ Customer updated in Amplify');
      } catch (error) {
        console.error('Error updating customer in Amplify:', error);
        // Fall back to local update
      }
      
      // Update in component state
      setCustomers(prev => prev.map(c => c.id === editingCustomerId ? { ...c, ...formData } : c));
      setSearchResults(prev => prev.map(c => c.id === editingCustomerId ? { ...c, ...formData } : c));
      
      if (selectedCustomer?.id === editingCustomerId) {
        setSelectedCustomer(prev => prev ? { ...prev, ...formData } : null);
      }
      
      // Update in localStorage if it's a saved customer
      const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
      const customerIndex = savedCustomers.findIndex((c: Customer) => c.id === editingCustomerId);
      if (customerIndex !== -1) {
        savedCustomers[customerIndex] = { ...savedCustomers[customerIndex], ...formData };
        localStorage.setItem('jobOrderCustomers', JSON.stringify(savedCustomers));
      }
      
      setShowEditCustomerModal(false);
      setFormData({ name: '', mobile: '', email: '', address: '' });
      setFormErrors({});
      await showAlert('Success', 'Customer updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving customer:', error);
      await showAlert('Error', 'Failed to update customer. Please try again.', 'error');
    }
  };

  const handleDeleteCustomer = (customerOrId: Customer | string) => {
    const customer = typeof customerOrId === 'object'
      ? customerOrId
      : customers.find(c => c.id === customerOrId);

    if (customer) {
      setDeleteCustomer(customer);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCustomer) return;
    
    try {
      const customerToDelete = deleteCustomer;
      
      // Try to delete from Amplify backend
      try {
        await customerService.delete(customerToDelete.id);
        console.log('✅ Customer deleted from Amplify');
      } catch (error) {
        console.error('Error deleting customer from Amplify:', error);
        // Fall back to local deletion
      }
      
      // Remove from component state
      setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
      setSearchResults(prev => prev.filter(c => c.id !== customerToDelete.id));
      
      // Remove from localStorage if it was a saved customer
      const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
      const updatedSaved = savedCustomers.filter((c: Customer) => c.id !== customerToDelete.id);
      if (savedCustomers.length !== updatedSaved.length) {
        localStorage.setItem('jobOrderCustomers', JSON.stringify(updatedSaved));
      }

      // Remove any vehicles owned by this customer
      const vehicleManagementVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]');
      const updatedVehicles = vehicleManagementVehicles.filter((v: any) => v.customerId !== customerToDelete.id);
      if (vehicleManagementVehicles.length !== updatedVehicles.length) {
        localStorage.setItem('vehicleManagementVehicles', JSON.stringify(updatedVehicles));
      }
      
      if (selectedCustomer?.id === customerToDelete.id) {
        setViewMode('list');
        setSelectedCustomer(null);
      }
      
      handleCancelDelete();
      await showAlert('Success', 'Customer deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting customer:', error);
      await showAlert('Error', 'Failed to delete customer. Please try again.', 'error');
      handleCancelDelete();
    }
  };

  const validateVehicleForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!vehicleData.make.trim()) {
      errors.vehicle = 'Make is required';
    } else if (!vehicleData.model.trim()) {
      errors.vehicle = 'Model is required';
    } else if (!vehicleData.type) {
      errors.vehicle = 'Vehicle type is required';
    } else if (!vehicleData.color.trim()) {
      errors.vehicle = 'Color is required';
    } else if (!vehicleData.plate.trim()) {
      errors.vehicle = 'Plate number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddVehicle = async () => {
    if (!validateVehicleForm()) {
      return;
    }

    try {
      const newVehicle: Vehicle = {
        vehicleId: `VEH-${Date.now().toString().slice(-8)}`,
        make: vehicleData.make.trim(),
        model: vehicleData.model.trim(),
        year: Number(vehicleData.year),
        vehicleType: vehicleData.type,
        color: vehicleData.color.trim(),
        plateNumber: vehicleData.plate.trim(),
        vin: vehicleData.vin.trim() || undefined,
        completedServices: 0
      };

      // Try to create vehicle in Amplify
      try {
        await vehicleService.create({
          customerId: addVehicleCustomerId || '',
          make: newVehicle.make,
          model: newVehicle.model,
          year: newVehicle.year.toString(),
          color: newVehicle.color || undefined,
          plateNumber: newVehicle.plateNumber || undefined,
          vin: newVehicle.vin || undefined,
          vehicleType: newVehicle.vehicleType || undefined,
          status: 'active'
        });
        console.log('✅ Vehicle created in Amplify');
      } catch (error) {
        console.error('Error creating vehicle in Amplify:', error);
        // Fall back to local storage
      }

      // Update in component state
      setCustomers(prev => prev.map(c => {
        if (c.id === addVehicleCustomerId) {
          return {
            ...c,
            vehicles: [...(c.vehicles || []), newVehicle],
            registeredVehiclesCount: (c.vehicles?.length || 0) + 1
          };
        }
        return c;
      }));

      // Update in localStorage if it's a saved customer
      const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
      const customerIndex = savedCustomers.findIndex((c: Customer) => c.id === addVehicleCustomerId);
      if (customerIndex !== -1) {
        savedCustomers[customerIndex].vehicles = [...(savedCustomers[customerIndex].vehicles || []), newVehicle];
        savedCustomers[customerIndex].registeredVehiclesCount = savedCustomers[customerIndex].vehicles.length;
        localStorage.setItem('jobOrderCustomers', JSON.stringify(savedCustomers));
      }

      // Also add to Vehicle Management's localStorage
      const customer = customers.find(c => c.id === addVehicleCustomerId);
      if (customer) {
        const vehicleManagementVehicle = {
          vehicleId: newVehicle.vehicleId,
          ownedBy: customer.name,
          customerId: customer.id,
          make: newVehicle.make,
          model: newVehicle.model,
          year: newVehicle.year,
          color: newVehicle.color,
          plateNumber: newVehicle.plateNumber,
          completedServices: 0,
          customerDetails: {
            customerId: customer.id,
            name: customer.name,
            email: customer.email,
            mobile: customer.mobile,
            address: customer.address || null,
            registeredVehiclesCount: (customer.vehicles?.length || 0) + 1,
            registeredVehicles: `${(customer.vehicles?.length || 0) + 1} vehicle${(customer.vehicles?.length || 0) + 1 !== 1 ? 's' : ''}`,
            completedServicesCount: customer.completedServicesCount || 0,
            customerSince: customer.customerSince
          },
          vehicleDetails: {
            vehicleId: newVehicle.vehicleId,
            ownedBy: customer.name,
            make: newVehicle.make,
            model: newVehicle.model,
            year: newVehicle.year,
            color: newVehicle.color,
            plateNumber: newVehicle.plateNumber,
            vin: newVehicle.vin || '',
            registrationDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            type: newVehicle.vehicleType,
            lastServiceDate: null
          },
          services: []
        };
        
        const vehicleManagementVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]');
        vehicleManagementVehicles.push(vehicleManagementVehicle);
        localStorage.setItem('vehicleManagementVehicles', JSON.stringify(vehicleManagementVehicles));
      }

      if (selectedCustomer?.id === addVehicleCustomerId) {
        const updatedCustomer = customers.find(c => c.id === addVehicleCustomerId);
        if (updatedCustomer) {
          setSelectedCustomer(updatedCustomer);
        }
      }

      setShowAddVehicleModal(false);
      setVehicleData({ make: '', model: '', year: new Date().getFullYear(), type: '', color: '', plate: '', vin: '' });
      setFormErrors({});
      await showAlert('Success', 'Vehicle added successfully!', 'success');
    } catch (error) {
      console.error('Error adding vehicle:', error);
      await showAlert('Error', 'Failed to add vehicle. Please try again.', 'error');
    }
  };

  const handleDeleteVehicle = async (customerId: string, vehicleId: string) => {
    try {
      // Update in component state
      setCustomers(prev => prev.map(c => {
        if (c.id === customerId) {
          return {
            ...c,
            vehicles: c.vehicles?.filter(v => v.vehicleId !== vehicleId) || [],
            registeredVehiclesCount: (c.vehicles?.length || 0) - 1
          };
        }
        return c;
      }));

      // Update in localStorage if it's a saved customer
      const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
      const customerIndex = savedCustomers.findIndex((c: Customer) => c.id === customerId);
      if (customerIndex !== -1) {
        savedCustomers[customerIndex].vehicles = savedCustomers[customerIndex].vehicles?.filter((v: Vehicle) => v.vehicleId !== vehicleId) || [];
        savedCustomers[customerIndex].registeredVehiclesCount = savedCustomers[customerIndex].vehicles.length;
        localStorage.setItem('jobOrderCustomers', JSON.stringify(savedCustomers));
      }

      // Also remove from Vehicle Management's localStorage
      const vehicleManagementVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]');
      const filteredVehicles = vehicleManagementVehicles.filter((v: any) => v.vehicleId !== vehicleId);
      if (vehicleManagementVehicles.length !== filteredVehicles.length) {
        localStorage.setItem('vehicleManagementVehicles', JSON.stringify(filteredVehicles));
      }

      if (selectedCustomer?.id === customerId) {
        const updatedCustomer = customers.find(c => c.id === customerId);
        if (updatedCustomer) {
          setSelectedCustomer(updatedCustomer);
        }
      }
      await showAlert('Success', 'Vehicle deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      await showAlert('Error', 'Failed to delete vehicle. Please try again.', 'error');
    }
  };

  const openDetailsView = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setViewMode('details');
    }
  };

  const handleViewVehicleDetails = (customerId: string, vehicle: Vehicle) => {
    // Get customer details
    const customer = customers.find(c => c.id === customerId);
    
    if (onNavigate) {
      onNavigate('Vehicles Management', {
        openDetails: true,
        source: 'Customers Management',
        returnToCustomer: customerId,
        vehicle: {
          vehicleId: vehicle.vehicleId,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          plateNumber: vehicle.plateNumber,
          vin: vehicle.vin,
          vehicleType: vehicle.vehicleType,
          completedServices: vehicle.completedServices || 0,
          ownedBy: customer?.name || 'Unknown',
          customerId: customerId,
          customerDetails: {
            customerId: customerId,
            name: customer?.name || 'Unknown',
            email: customer?.email || 'Not provided',
            mobile: customer?.mobile || 'Not provided',
            address: customer?.address || null,
            registeredVehiclesCount: customer?.registeredVehiclesCount || 0,
            completedServicesCount: customer?.completedServicesCount || 0
          }
        }
      });
    }
  };

  const closeDetailsView = () => {
    setViewMode('list');
    setSelectedCustomer(null);
    setHandledReturnToCustomer(true);
  };

  const vehicleTypeOptions = [
    { value: '', label: 'Select type' },
    { value: 'SUV', label: 'SUV' },
    { value: 'Sedan', label: 'Sedan' },
    { value: 'Hatchback', label: 'Hatchback' },
    { value: 'Coupe', label: 'Coupe' },
    { value: 'Convertible', label: 'Convertible' },
    { value: 'Truck', label: 'Truck' },
    { value: 'Van', label: 'Van' },
    { value: 'Motorcycle', label: 'Motorcycle' }
  ];

  if (viewMode === 'details' && selectedCustomer) {
    return (
      <>
        <DetailsView
          customer={selectedCustomer}
          onClose={closeDetailsView}
          onEdit={handleEditCustomer}
          getVehicleCompletedCount={getVehicleCompletedCount}
          onAddVehicle={(customerId) => {
            setAddVehicleCustomerId(customerId);
            setShowAddVehicleModal(true);
          }}
          onDeleteVehicle={handleDeleteVehicle}
          onViewVehicleDetails={handleViewVehicleDetails}
        />

        {/* Edit Modal */}
        <Modal
          isOpen={showEditCustomerModal}
          title="Edit Customer"
          icon="fas fa-user-edit"
          onClose={() => setShowEditCustomerModal(false)}
          onSave={handleSaveCustomer}
          isEdit
        >
          <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
            <FormField
              label="Customer Name"
              id="editCustomerName"
              placeholder="Enter customer full name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              required
            />
            <FormField
              label="Mobile Number"
              id="editCustomerMobile"
              type="tel"
              placeholder="Enter mobile number"
              value={formData.mobile}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
              error={formErrors.mobile}
              required
            />
            <FormField
              label="Email Address"
              id="editCustomerEmail"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              error={formErrors.email}
            />
            <FormField
              label="Home Address"
              id="editCustomerAddress"
              placeholder="Enter home address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              error={formErrors.address}
            />
          </form>
        </Modal>

        {/* Add Vehicle Modal */}
        <Modal
          isOpen={showAddVehicleModal}
          title="Add New Vehicle"
          icon="fas fa-car"
          onClose={() => {
            setShowAddVehicleModal(false);
            setFormErrors({});
          }}
          onSave={handleAddVehicle}
        >
          <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
            <FormField
              label="Make"
              id="vehicleMake"
              placeholder="Enter vehicle make"
              value={vehicleData.make}
              onChange={(e) => setVehicleData(prev => ({ ...prev, make: e.target.value }))}
              error={formErrors.vehicle}
              required
            />
            <FormField
              label="Model"
              id="vehicleModel"
              placeholder="Enter vehicle model"
              value={vehicleData.model}
              onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
              required
            />
            <FormField
              label="Year"
              id="vehicleYear"
              type="number"
              value={vehicleData.year}
              onChange={(e) => setVehicleData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
              required
            />
            <FormField
              label="Vehicle Type"
              id="vehicleType"
              type="select"
              value={vehicleData.type}
              onChange={(e) => setVehicleData(prev => ({ ...prev, type: e.target.value }))}
              options={vehicleTypeOptions}
              required
            />
            <FormField
              label="Color"
              id="vehicleColor"
              placeholder="Enter vehicle color"
              value={vehicleData.color}
              onChange={(e) => setVehicleData(prev => ({ ...prev, color: e.target.value }))}
              required
            />
            <FormField
              label="Plate Number"
              id="vehiclePlate"
              placeholder="Enter plate number"
              value={vehicleData.plate}
              onChange={(e) => setVehicleData(prev => ({ ...prev, plate: e.target.value }))}
              required
            />
            <FormField
              label="VIN"
              id="vehicleVin"
              placeholder="Enter VIN (17 characters)"
              value={vehicleData.vin}
              onChange={(e) => setVehicleData(prev => ({ ...prev, vin: e.target.value }))}
            />
          </form>
        </Modal>

        {/* Alert */}
        <AlertPopup
          isOpen={alert.isOpen}
          title={alert.title}
          message={alert.message}
          type={alert.type}
          onClose={alert.onClose || (() => setAlert(prev => ({ ...prev, isOpen: false })))}
          showCancel={alert.showCancel}
          onConfirm={alert.onConfirm}
        />
      </>
    );
  }

  return (
    <div className="app-container" id="mainScreen">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1><i className="fas fa-users"></i> Customers Management</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Search Section */}
        <section className="search-section">
          <div className="search-container">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              id="customerSearch"
              name="customerSearch"
              className="smart-search-input"
              placeholder="Search by any customer details"
              value={searchQuery}
              onChange={handleSearch}
              autoComplete="off"
            />
          </div>
          <div className="search-stats">
            {searchResults.length === 0 ? 'No customers found' :
             searchResults.length === customers.length && !searchQuery ? 
             `Showing ${Math.min((currentPage - 1) * pageSize + 1, searchResults.length)}-${Math.min(currentPage * pageSize, searchResults.length)} of ${searchResults.length} customers` :
             <>
                Showing {Math.min((currentPage - 1) * pageSize + 1, searchResults.length)}-{Math.min(currentPage * pageSize, searchResults.length)} of {searchResults.length} customers
                {searchQuery && <span style={{color: 'var(--secondary-color)'}}> (Filtered by: "{searchQuery}")</span>}
             </>
            }
          </div>
        </section>

        {/* Results Section */}
        <section className="results-section">
          <div className="section-header">
            <h2><i className="fas fa-list"></i> Customers Records</h2>
            <div className="pagination-controls">
              <div className="records-per-page">
                <label htmlFor="pageSizeSelect">Records per page:</label>
                <select
                  id="pageSizeSelect"
                  className="page-size-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <button
                className="btn-new-customer"
                onClick={() => {
                  setFormData({ name: '', mobile: '', email: '', address: '' });
                  setFormErrors({});
                  setShowAddCustomerModal(true);
                }}
              >
                <i className="fas fa-plus-circle"></i> Add New Customer
              </button>
            </div>
          </div>

          {/* Table */}
          <CustomersTable
            data={paginatedData}
            onViewDetails={openDetailsView}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            currentPage={currentPage}
            pageSize={pageSize}
            searchQuery={searchQuery}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else {
                    const start = Math.max(1, currentPage - 2);
                    const end = Math.min(totalPages, start + 4);
                    const adjustedStart = Math.max(1, end - 4);
                    pageNum = adjustedStart + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Service Management System © 2023 | Customers Management Module</p>
      </footer>

      {/* Modals */}
      <Modal
        isOpen={showAddCustomerModal}
        title="Add New Customer"
        icon="fas fa-user-plus"
        onClose={() => {
          setShowAddCustomerModal(false);
          setFormErrors({});
        }}
        onSave={handleAddCustomer}
        saving={saving}
      >
        <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
          <FormField
            label="Customer Name"
            id="newCustomerName"
            placeholder="Enter customer full name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={formErrors.name}
            required
          />
          <FormField
            label="Mobile Number"
            id="newCustomerMobile"
            type="tel"
            placeholder="Enter mobile number"
            value={formData.mobile}
            onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
            error={formErrors.mobile}
            required
          />
          <FormField
            label="Email Address"
            id="newCustomerEmail"
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            error={formErrors.email}
          />
          <FormField
            label="Home Address"
            id="newCustomerAddress"
            placeholder="Enter home address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            error={formErrors.address}
          />
        </form>
      </Modal>

      <Modal
        isOpen={showEditCustomerModal}
        title="Edit Customer"
        icon="fas fa-user-edit"
        onClose={() => {
          setShowEditCustomerModal(false);
          setFormErrors({});
        }}
        onSave={handleSaveCustomer}
        isEdit
      >
        <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
          <FormField
            label="Customer Name"
            id="editCustomerName"
            placeholder="Enter customer full name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={formErrors.name}
            required
          />
          <FormField
            label="Mobile Number"
            id="editCustomerMobile"
            type="tel"
            placeholder="Enter mobile number"
            value={formData.mobile}
            onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
            error={formErrors.mobile}
            required
          />
          <FormField
            label="Email Address"
            id="editCustomerEmail"
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            error={formErrors.email}
          />
          <FormField
            label="Home Address"
            id="editCustomerAddress"
            placeholder="Enter home address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            error={formErrors.address}
          />
        </form>
      </Modal>

      <Modal
        isOpen={showAddVehicleModal}
        title="Add New Vehicle"
        icon="fas fa-car"
        onClose={() => {
          setShowAddVehicleModal(false);
          setFormErrors({});
        }}
        onSave={handleAddVehicle}
      >
        <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
          <FormField
            label="Make"
            id="vehicleMake"
            placeholder="Enter vehicle make"
            value={vehicleData.make}
            onChange={(e) => setVehicleData(prev => ({ ...prev, make: e.target.value }))}
            error={formErrors.vehicle}
            required
          />
          <FormField
            label="Model"
            id="vehicleModel"
            placeholder="Enter vehicle model"
            value={vehicleData.model}
            onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
            required
          />
          <FormField
            label="Year"
            id="vehicleYear"
            type="number"
            value={vehicleData.year}
            onChange={(e) => setVehicleData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
            required
          />
          <FormField
            label="Vehicle Type"
            id="vehicleType"
            type="select"
            value={vehicleData.type}
            onChange={(e) => setVehicleData(prev => ({ ...prev, type: e.target.value }))}
            options={vehicleTypeOptions}
            required
          />
          <FormField
            label="Color"
            id="vehicleColor"
            placeholder="Enter vehicle color"
            value={vehicleData.color}
            onChange={(e) => setVehicleData(prev => ({ ...prev, color: e.target.value }))}
            required
          />
          <FormField
            label="Plate Number"
            id="vehiclePlate"
            placeholder="Enter plate number"
            value={vehicleData.plate}
            onChange={(e) => setVehicleData(prev => ({ ...prev, plate: e.target.value }))}
            required
          />
          <FormField
            label="VIN"
            id="vehicleVin"
            placeholder="Enter VIN (17 characters)"
            value={vehicleData.vin}
            onChange={(e) => setVehicleData(prev => ({ ...prev, vin: e.target.value }))}
          />
        </form>
      </Modal>

      {/* Alert */}
      <AlertPopup
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={alert.onClose || (() => setAlert(prev => ({ ...prev, isOpen: false })))}
        showCancel={alert.showCancel}
        onConfirm={alert.onConfirm}
      />

      {/* Delete Confirmation Modal */}
      {deleteCustomer && typeof document !== 'undefined' && createPortal(
        <div className="delete-modal-overlay" onClick={handleCancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h3><i className="fas fa-exclamation-triangle"></i> Confirm Deletion</h3>
            </div>
            <div className="delete-modal-body">
              <div className="delete-warning">
                <i className="fas fa-exclamation-circle"></i>
                <div className="delete-warning-text">
                  <p>You are about to delete the customer <strong>{deleteCustomer.name}</strong> (ID: <strong>{deleteCustomer.id}</strong>).</p>
                  <p>This action cannot be undone. All customer records and associated vehicle information will be permanently removed from the system.</p>
                </div>
              </div>
              
              <div className="delete-modal-actions">
                <button className="btn-confirm-delete" onClick={handleConfirmDelete}>
                  <i className="fas fa-trash"></i> Delete Customer
                </button>
                <button className="btn-cancel" onClick={handleCancelDelete}>
                  <i className="fas fa-times"></i> Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Duplicate Customer Warning Dialog */}
      {showDuplicateWarning && (
        <div className="warning-dialog-overlay" onClick={handleCancelDuplicate}>
          <div className="warning-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="warning-dialog-header">
              <i className="fas fa-exclamation-circle"></i>
              <span>Duplicate Customer Warning</span>
            </div>
            <div className="warning-dialog-body">
              <p>This customer already exists in the system.</p>
              <p><strong>Name:</strong> {pendingCustomer?.name}</p>
              <p><strong>Mobile:</strong> {pendingCustomer?.mobile}</p>
              <p className="warning-message">Are you sure you want to save as a new customer?</p>
            </div>
            <div className="warning-dialog-footer">
              <button 
                className="btn btn-danger" 
                onClick={handleConfirmDuplicate}
                disabled={saving}
              >
                <i className="fas fa-check"></i> Yes, Save Anyway
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleCancelDuplicate}
                disabled={saving}
              >
                <i className="fas fa-times"></i> No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;