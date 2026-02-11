import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './CustomerManagement.css';
import { getCustomers } from './demoData';

// Alert Popup Component
const AlertPopup = ({ isOpen, title, message, type, onClose, showCancel, onConfirm }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-info-circle';
    }
  };

  return (
    <div className={`alert-popup-overlay show`}>
      <div className={`alert-popup alert-${type}`}>
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
const Modal = ({ isOpen, title, icon, children, onClose, onSave, isEdit = false, saving = false }) => {
  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-overlay show">
      <div className="modal">
        <div className="modal-header">
          <h3>
            <i className={icon}></i> {title}
          </h3>
          <button className="btn-close-modal" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <button className="btn-save" onClick={onSave} disabled={saving}>
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
const FormField = ({ label, id, type = 'text', value, onChange, error, placeholder, required = false, disabled = false, options = null }) => {
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
          {options && options.map(opt => {
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
const CustomersTable = ({ data, onViewDetails, onEdit, onDelete, currentPage, pageSize, searchQuery }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isDropdownButton = event.target.closest('.btn-action-dropdown');
      const isDropdownMenu = event.target.closest('.action-dropdown-menu');
      
      if (!isDropdownButton && !isDropdownMenu) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [activeDropdown]);

  const highlightSearchMatches = (text, query) => {
    if (!query || query.startsWith('!') || query.includes(':')) {
      return text;
    }

    const terms = query.toLowerCase().split(' ')
      .filter(term => !term.startsWith('!') && !term.includes(':'));

    if (terms.length === 0) {
      return text;
    }

    let result = text.toString();
    const textLower = result.toLowerCase();

    terms.forEach(term => {
      if (term && textLower.includes(term)) {
        const regex = new RegExp(`(${term})`, 'gi');
        result = result.replace(regex, (match) => `<mark class="search-highlight">${match}</mark>`);
      }
    });

    return result;
  };

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
          {data.map((customer, index) => (
            <tr key={customer.id}>
              <td>{customer.id}</td>
              <td>{customer.name}</td>
              <td>{customer.mobile}</td>
              <td><span className="count-badge">{customer.registeredVehiclesCount} vehicles</span></td>
              <td><span className="count-badge">{customer.completedServicesCount} services</span></td>
              <td>
                <div className="action-dropdown-container">
                  <button
                    className={`btn-action-dropdown ${activeDropdown === customer.id ? 'active' : ''}`}
                    onClick={(e) => {
                      const isActive = activeDropdown === customer.id;
                      if (isActive) {
                        setActiveDropdown(null);
                        return;
                      }
                      const rect = e.currentTarget.getBoundingClientRect();
                      const menuHeight = 160;
                      const menuWidth = 200;
                      const spaceBelow = window.innerHeight - rect.bottom;
                      const top = spaceBelow < menuHeight ? rect.top - menuHeight - 6 : rect.bottom + 6;
                      const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
                      setDropdownPosition({
                        top,
                        left
                      });
                      setActiveDropdown(customer.id);
                    }}
                  >
                    <i className="fas fa-cogs"></i> Actions <i className="fas fa-chevron-down"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {activeDropdown && typeof document !== 'undefined' && createPortal(
        <div
          className="action-dropdown-menu show action-dropdown-menu-fixed"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          <button className="dropdown-item view" onClick={() => { onViewDetails(activeDropdown); setActiveDropdown(null); }}>
            <i className="fas fa-eye"></i> View Details
          </button>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item edit" onClick={() => { onEdit(activeDropdown); setActiveDropdown(null); }}>
            <i className="fas fa-edit"></i> Edit Customer
          </button>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item delete" onClick={() => { onDelete(activeDropdown); setActiveDropdown(null); }}>
            <i className="fas fa-trash"></i> Delete Customer
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

// Details View Component
const DetailsView = ({ customer, onClose, onEdit, onAddVehicle, onDeleteVehicle, onViewVehicleDetails }) => {
  const [activeVehicleDropdown, setActiveVehicleDropdown] = useState(null);
  const [vehicleDropdownPosition, setVehicleDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [deleteVehicle, setDeleteVehicle] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isDropdownButton = event.target.closest('.btn-action-dropdown');
      const isDropdownMenu = event.target.closest('.action-dropdown-menu');
      
      if (!isDropdownButton && !isDropdownMenu) {
        setActiveVehicleDropdown(null);
      }
    };

    if (activeVehicleDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
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
                    customer.vehicles.map((vehicle, index) => (
                      <tr key={vehicle.vehicleId}>
                        <td>{vehicle.vehicleId}</td>
                        <td>{vehicle.make}</td>
                        <td>{vehicle.model}</td>
                        <td>{vehicle.year}</td>
                        <td>{vehicle.vehicleType || 'N/A'}</td>
                        <td>{vehicle.color}</td>
                        <td>{vehicle.plateNumber}</td>
                        <td>{vehicle.vin || 'N/A'}</td>
                        <td><span className="service-count-badge">{vehicle.completedServices} services</span></td>
                        <td>
                          <div className="action-dropdown-container">
                            <button
                              className={`btn-action-dropdown ${activeVehicleDropdown === vehicle.vehicleId ? 'active' : ''}`}
                              onClick={(e) => {
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
                                setVehicleDropdownPosition({
                                  top,
                                  left,
                                  width: rect.width
                                });
                                setActiveVehicleDropdown(vehicle.vehicleId);
                              }}
                            >
                              <i className="fas fa-cogs"></i> Actions <i className="fas fa-chevron-down"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '30px' }}>
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
export default function CustomerManagement({ onNavigate, returnToCustomer }) {
  // Load initial customers from demo data and localStorage
  const [customers, setCustomers] = useState(() => {
    const demoCustomers = getCustomers();
    const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
    // Merge saved customers with demo customers (avoiding duplicates)
    const allCustomers = [...demoCustomers];
    savedCustomers.forEach(saved => {
      if (!allCustomers.some(customer => customer.id === saved.id)) {
        allCustomers.push(saved);
      }
    });
    return allCustomers;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(customers);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'details'

  // Modal states
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [addVehicleCustomerId, setAddVehicleCustomerId] = useState(null);
  const [deleteCustomer, setDeleteCustomer] = useState(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingCustomer, setPendingCustomer] = useState(null);
  const [saving, setSaving] = useState(false);

  // Alert state
  const [alert, setAlert] = useState({ isOpen: false, title: '', message: '', type: 'info', showCancel: false });

  // Form states
  const [formData, setFormData] = useState({
    name: '', mobile: '', email: '', address: ''
  });
  const [vehicleData, setVehicleData] = useState({
    make: '', model: '', year: new Date().getFullYear(), type: '', color: '', plate: '', vin: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Handle return from vehicle details
  useEffect(() => {
    if (returnToCustomer) {
      const customer = customers.find(c => c.id === returnToCustomer);
      if (customer) {
        setSelectedCustomer(customer);
        setViewMode('details');
      }
    }
  }, [returnToCustomer, customers]);

  // Search function
  const performSmartSearch = useCallback((query) => {
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
        customer.email.toLowerCase().includes(term)
      );
    });

    return results;
  }, [customers]);

  // Handle search input
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSearchResults(performSmartSearch(query));
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(searchResults.length / pageSize);
  const paginatedData = searchResults.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Show alert
  const showAlert = (title, message, type = 'info', showCancel = false) => {
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
  const handleAddCustomer = async () => {
    if (saving) return; // Prevent multiple clicks
    
    if (!formData.name.trim() || !formData.mobile.trim()) {
      setFormErrors({ name: !formData.name.trim() ? 'Name required' : '', mobile: !formData.mobile.trim() ? 'Mobile required' : '' });
      return;
    }

    setSaving(true);

    // Check if customer with same name or mobile already exists - check localStorage directly
    const demoCustomers = getCustomers();
    const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
    const allCustomers = [...demoCustomers, ...savedCustomers];
    
    const existingCustomer = allCustomers.find(
      customer => 
        customer.mobile.toLowerCase() === formData.mobile.toLowerCase() ||
        customer.name.toLowerCase() === formData.name.toLowerCase()
    );

    const newCustomer = {
      id: `CUST-2023-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
      address: formData.address,
      registeredVehiclesCount: 0,
      completedServicesCount: 0,
      customerSince: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      vehicles: []
    };

    if (existingCustomer) {
      // Show warning dialog
      setPendingCustomer(newCustomer);
      setShowDuplicateWarning(true);
      setSaving(false);
    } else {
      // Save customer directly if no duplicate
      const updatedCustomers = [newCustomer, ...customers];
      setCustomers(updatedCustomers);
      setSearchResults(prev => [newCustomer, ...prev]);
      
      // Persist to localStorage with final check
      const currentSaved = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
      // Final check if customer was just added
      const alreadySaved = currentSaved.find(c => 
        c.mobile.toLowerCase() === formData.mobile.toLowerCase() ||
        c.name.toLowerCase() === formData.name.toLowerCase()
      );
      if (!alreadySaved) {
        currentSaved.push(newCustomer);
        localStorage.setItem('jobOrderCustomers', JSON.stringify(currentSaved));
      }
      
      setShowAddCustomerModal(false);
      setFormData({ name: '', mobile: '', email: '', address: '' });
      setFormErrors({});
      setSaving(false);
      await showAlert('Success', `Customer "${newCustomer.name}" added successfully!`, 'success');
    }
  };

  const handleConfirmDuplicate = async () => {
    if (pendingCustomer && !saving) {
      setSaving(true);
      const updatedCustomers = [pendingCustomer, ...customers];
      setCustomers(updatedCustomers);
      setSearchResults(prev => [pendingCustomer, ...prev]);
      
      // Persist to localStorage despite duplicate
      const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
      // Check if this exact customer was already added (prevent double save)
      const alreadySaved = savedCustomers.find(c => c.id === pendingCustomer.id);
      if (!alreadySaved) {
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
    }
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateWarning(false);
    setPendingCustomer(null);
  };

  const handleEditCustomer = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setEditingCustomerId(customerId);
      setFormData({ name: customer.name, mobile: customer.mobile, email: customer.email, address: customer.address || '' });
      setShowEditCustomerModal(true);
      setFormErrors({});
    }
  };

  const handleSaveCustomer = async () => {
    if (!formData.name.trim() || !formData.mobile.trim()) {
      setFormErrors({ name: !formData.name.trim() ? 'Name required' : '', mobile: !formData.mobile.trim() ? 'Mobile required' : '' });
      return;
    }

    // Update in component state
    setCustomers(prev => prev.map(c => c.id === editingCustomerId ? { ...c, ...formData } : c));
    setSearchResults(prev => prev.map(c => c.id === editingCustomerId ? { ...c, ...formData } : c));
    if (selectedCustomer?.id === editingCustomerId) {
      setSelectedCustomer(prev => ({ ...prev, ...formData }));
    }
    
    // Update in localStorage if it's a saved customer
    const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
    const customerIndex = savedCustomers.findIndex(c => c.id === editingCustomerId);
    if (customerIndex !== -1) {
      // Customer exists in localStorage, update it
      savedCustomers[customerIndex] = { ...savedCustomers[customerIndex], ...formData };
      localStorage.setItem('jobOrderCustomers', JSON.stringify(savedCustomers));
    }
    
    setShowEditCustomerModal(false);
    setFormData({ name: '', mobile: '', email: '', address: '' });
    setFormErrors({});
    await showAlert('Success', 'Customer updated successfully!', 'success');
  };

  const handleDeleteCustomer = async (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setDeleteCustomer(customer);
  };

  const handleConfirmDelete = async () => {
    if (deleteCustomer) {
      // Remove from component state
      setCustomers(prev => prev.filter(c => c.id !== deleteCustomer.id));
      setSearchResults(prev => prev.filter(c => c.id !== deleteCustomer.id));
      
      // Remove from localStorage if it was a saved customer (not a demo customer)
      const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
      const updatedSaved = savedCustomers.filter(c => c.id !== deleteCustomer.id);
      if (savedCustomers.length !== updatedSaved.length) {
        // Customer was in localStorage, save the updated list
        localStorage.setItem('jobOrderCustomers', JSON.stringify(updatedSaved));
      }
      
      if (selectedCustomer?.id === deleteCustomer.id) {
        setViewMode('list');
        setSelectedCustomer(null);
      }
      await showAlert('Success', 'Customer deleted successfully!', 'success');
      setDeleteCustomer(null);
    }
  };

  // Vehicle management
  const handleAddVehicle = async () => {
    if (!vehicleData.make.trim() || !vehicleData.model.trim() || !vehicleData.type) {
      setFormErrors({ vehicle: 'All required fields must be filled' });
      return;
    }

    const newVehicle = {
      vehicleId: `VEH-${String(Math.random()).substring(2, 8)}`,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      vehicleType: vehicleData.type,
      color: vehicleData.color,
      plateNumber: vehicleData.plate,
      vin: vehicleData.vin,
      completedServices: 0
    };

    // Update in component state
    setCustomers(prev => prev.map(c => {
      if (c.id === addVehicleCustomerId) {
        return {
          ...c,
          vehicles: [...(c.vehicles || []), newVehicle],
          registeredVehiclesCount: (c.vehicles || []).length + 1
        };
      }
      return c;
    }));

    // Update in localStorage if it's a saved customer
    const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
    const customerIndex = savedCustomers.findIndex(c => c.id === addVehicleCustomerId);
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
          registeredVehiclesCount: (customer.vehicles || []).length + 1,
          registeredVehicles: `${(customer.vehicles || []).length + 1} vehicle${(customer.vehicles || []).length + 1 !== 1 ? 's' : ''}`,
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
  };

  const handleDeleteVehicle = async (customerId, vehicleId) => {
    // Update in component state
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          vehicles: c.vehicles.filter(v => v.vehicleId !== vehicleId),
          registeredVehiclesCount: (c.vehicles || []).length - 1
        };
      }
      return c;
    }));

    // Update in localStorage if it's a saved customer
    const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
    const customerIndex = savedCustomers.findIndex(c => c.id === customerId);
    if (customerIndex !== -1) {
      savedCustomers[customerIndex].vehicles = savedCustomers[customerIndex].vehicles.filter(v => v.vehicleId !== vehicleId);
      savedCustomers[customerIndex].registeredVehiclesCount = savedCustomers[customerIndex].vehicles.length;
      localStorage.setItem('jobOrderCustomers', JSON.stringify(savedCustomers));
    }

    // Also remove from Vehicle Management's localStorage
    const vehicleManagementVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]');
    const filteredVehicles = vehicleManagementVehicles.filter(v => v.vehicleId !== vehicleId);
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
  };

  const openDetailsView = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setViewMode('details');
    }
  };

  const handleViewVehicleDetails = async (customerId, vehicle) => {
    // Get customer details
    const customer = customers.find(c => c.id === customerId);
    
    if (onNavigate) {
      // Navigate directly to Vehicle Management with complete vehicle and customer details
      onNavigate('Vehicles Management', {
        openDetails: true,
        source: 'Customers Management',
        returnToCustomer: customerId, // Store which customer to return to
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
  };

  console.log('CustomerManagement render - viewMode:', viewMode, 'selectedCustomer:', selectedCustomer);

  if (viewMode === 'details' && selectedCustomer) {
    return (
      <>
        <DetailsView
          customer={selectedCustomer}
          onClose={closeDetailsView}
          onEdit={handleEditCustomer}
          onAddVehicle={(customerId) => {
            setAddVehicleCustomerId(customerId);
            setShowAddVehicleModal(true);
          }}
          onDeleteVehicle={handleDeleteVehicle}
          onViewVehicleDetails={handleViewVehicleDetails}
        />

        {/* Modals need to be rendered even in details view */}
        <Modal
          isOpen={showEditCustomerModal}
          title={editingCustomerId ? 'Edit Customer' : 'Add New Customer'}
          icon="fas fa-user"
          onClose={() => setShowEditCustomerModal(false)}
          onSave={handleSaveCustomer}
          isEdit={editingCustomerId !== null}
        >
          <form className="modal-form">
            <FormField
              label="Customer Name"
              id="editCustomerName"
              placeholder="Enter customer name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              required
            />
            <FormField
              label="Mobile Number"
              id="editCustomerMobile"
              placeholder="Enter mobile number"
              value={formData.mobile}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
              error={formErrors.mobile}
              required
            />
            <FormField
              label="Email Address"
              id="editCustomerEmail"
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
          onClose={() => setShowAddVehicleModal(false)}
          onSave={handleAddVehicle}
        >
          <form className="modal-form">
            <div className="form-group">
              <label htmlFor="vehicleCustomerId">
                Customer ID
                <span className="verified-badge"><i className="fas fa-check-circle"></i> Verified</span>
              </label>
              <input
                type="text"
                id="vehicleCustomerId"
                className="form-control"
                value={addVehicleCustomerId || ''}
                disabled
                readOnly
              />
            </div>
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
              type="select"
              value={vehicleData.year}
              onChange={(e) => setVehicleData(prev => ({ ...prev, year: e.target.value }))}
              options={Array.from({ length: 30 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return { value: year, label: year };
              })}
              required
            />
            <FormField
              label="Type"
              id="vehicleType"
              type="select"
              value={vehicleData.type}
              onChange={(e) => setVehicleData(prev => ({ ...prev, type: e.target.value }))}
              options={[
                { value: '', label: 'Select type' },
                { value: 'Sedan', label: 'Sedan' },
                { value: 'SUV', label: 'SUV' },
                { value: 'Truck', label: 'Truck' },
                { value: 'Hatchback', label: 'Hatchback' },
                { value: 'Coupe', label: 'Coupe' }
              ]}
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
          onClose={alert.onClose}
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
        onClose={() => setShowAddCustomerModal(false)}
        onSave={handleAddCustomer}
        saving={saving}
      >
        <form className="modal-form">
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
        onClose={() => setShowEditCustomerModal(false)}
        onSave={handleSaveCustomer}
        isEdit
      >
        <form className="modal-form">
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
        onClose={() => setShowAddVehicleModal(false)}
        onSave={handleAddVehicle}
      >
        <form className="modal-form">
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
            onChange={(e) => setVehicleData(prev => ({ ...prev, year: e.target.value }))}
            required
          />
          <FormField
            label="Vehicle Type"
            id="vehicleType"
            type="select"
            value={vehicleData.type}
            onChange={(e) => setVehicleData(prev => ({ ...prev, type: e.target.value }))}
            options={['SUV', 'Sedan', 'Hatchback', 'Coupe', 'Convertible', 'Truck', 'Van', 'Motorcycle']}
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
        onClose={alert.onClose}
        showCancel={alert.showCancel}
        onConfirm={alert.onConfirm}
      />

      {/* Delete Confirmation Modal */}
      {deleteCustomer && (
        <div className="delete-modal-overlay" onClick={() => setDeleteCustomer(null)}>
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
                <button className="btn-cancel" onClick={() => setDeleteCustomer(null)}>
                  <i className="fas fa-times"></i> Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Customer Warning Dialog */}
      {showDuplicateWarning && (
        <div className="warning-dialog-overlay">
          <div className="warning-dialog">
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
              >
                <i className="fas fa-check"></i> Yes, Save Anyway
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleCancelDuplicate}
              >
                <i className="fas fa-times"></i> No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
