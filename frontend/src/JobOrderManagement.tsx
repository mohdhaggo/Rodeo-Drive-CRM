import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './JobOrderManagement.css';
import { getCustomers } from './demoData';
import { jobOrderService } from './amplifyService';
import SuccessPopup from './SuccessPopup';
import PermissionGate from './PermissionGate';
import AddServiceScreen from './AddServiceScreen';
import { PRODUCT_CATALOG } from './productCatalog';
import { clampDiscountPercent, getDiscountAllowance, parseCurrencyValue } from './discountLimits';

// ============================================
// DEMO DATA
// ============================================
// Get customers from shared demo data and merge with saved customers
interface CustomerRecord {
  id?: string | number;
  [key: string]: any;
}

const getDemoAndSavedCustomers = () => {
  const demoCustomersRaw = getCustomers() as unknown;
  const demoCustomers: CustomerRecord[] = Array.isArray(demoCustomersRaw)
    ? (demoCustomersRaw as CustomerRecord[])
    : [];

  const savedCustomersRaw: unknown = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
  const savedCustomers: CustomerRecord[] = Array.isArray(savedCustomersRaw)
    ? (savedCustomersRaw as CustomerRecord[])
    : [];

  // Merge saved customers with demo customers (avoiding duplicates)
  const allCustomers: CustomerRecord[] = [...demoCustomers];
  savedCustomers.forEach((saved: CustomerRecord) => {
    if (!allCustomers.some((customer: CustomerRecord) => customer.id === saved.id)) {
      allCustomers.push(saved);
    }
  });
  return allCustomers;
};

const getLocalJobOrders = (): any[] => {
  try {
    const raw = JSON.parse(localStorage.getItem('jobOrders') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const mergeJobOrders = (localOrders: any[], amplifyOrders: any[]): any[] => {
  const orderMap = new Map<string, any>();

  [...localOrders, ...amplifyOrders].forEach((order: any) => {
    if (!order?.id) {
      return;
    }

    if (!orderMap.has(order.id)) {
      orderMap.set(order.id, order);
    }
  });

  return Array.from(orderMap.values());
};

// ============================================
// MAIN COMPONENT
// ============================================
interface JobOrderManagementProps {
  currentUser: any;
  navigationData: any;
  onClearNavigation: () => void;
  onNavigateBack: (source?: any, vehicleId?: any) => void;
}

function JobOrderManagement({ currentUser, navigationData, onClearNavigation, onNavigateBack }: JobOrderManagementProps) {
  const [screenState, setScreenState] = useState<string>('main'); // main, details, newJob, addService
  const [currentDetailsOrder, setCurrentDetailsOrder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [demoOrders, setDemoOrders] = useState<any[]>([]);
  const [currentAddServiceOrder, setCurrentAddServiceOrder] = useState<any>(null);
  const [inspectionModalOpen, setInspectionModalOpen] = useState<boolean>(false);
  const [currentInspectionItem, setCurrentInspectionItem] = useState<any>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<string>('');
  const [showAddServiceSuccessPopup, setShowAddServiceSuccessPopup] = useState<boolean>(false);
  const [addServiceSuccessData, setAddServiceSuccessData] = useState<{ orderId: string; invoiceId: string }>({ orderId: '', invoiceId: '' });
  const [newJobPrefill, setNewJobPrefill] = useState<any>(null);
  const [navigationSource, setNavigationSource] = useState<any>(null);
  const [returnToVehicleId, setReturnToVehicleId] = useState<any>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState<boolean>(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState('create'); // 'create' or 'cancel'

  // Initialize demo data on mount
  useEffect(() => {
    const loadJobOrders = async () => {
      const localOrders = getLocalJobOrders();

      try {
        const amplifyJobOrders = await jobOrderService.getAll();
        const mergedOrders = mergeJobOrders(localOrders, amplifyJobOrders || []);
        console.log('✅ Loaded job orders from Amplify:', amplifyJobOrders);
        setDemoOrders(mergedOrders);
      } catch (error) {
        console.error('❌ Error loading job orders from Amplify:', error);
        setDemoOrders(localOrders);
      }
    };
    
    loadJobOrders();
  }, []);

  // Reload data from Amplify when returning to main screen
  useEffect(() => {
    if (screenState === 'main') {
      const loadJobOrders = async () => {
        const localOrders = getLocalJobOrders();

        try {
          const amplifyJobOrders = await jobOrderService.getAll();
          const mergedOrders = mergeJobOrders(localOrders, amplifyJobOrders || []);
          console.log('✅ Reloaded job orders from Amplify');
          setDemoOrders(mergedOrders);
        } catch (error) {
          console.error('Error reloading job orders:', error);
          setDemoOrders(localOrders);
        }
      };
      
      loadJobOrders();
    }
  }, [screenState]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Reset to page 1 when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (navigationData?.openNewJob) {
      const prefillData: any = {
        startStep: navigationData.startStep || 1,
        customerData: navigationData.customerData || null,
        vehicleData: navigationData.vehicleData || null
      };
      setNewJobPrefill(prefillData);
      if (navigationData.source) {
        setNavigationSource(navigationData.source);
      }
      if (navigationData.returnToVehicle) {
        setReturnToVehicleId(navigationData.returnToVehicle);
      }
      setScreenState('newJob');

      const timer = setTimeout(() => {
        if (onClearNavigation) {
          onClearNavigation();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [navigationData, onClearNavigation]);

  const parseAmount = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const formatAmount = (value: any): string => `QAR ${Number(value || 0).toLocaleString()}`;

  const handleAddServiceSubmit = ({ selectedServices, discountPercent }: { selectedServices: any[]; discountPercent: number }) => {
    if (!currentAddServiceOrder || !selectedServices || selectedServices.length === 0) {
      setScreenState('details');
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const invoiceNumber = `INV-${year}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    const billId = currentAddServiceOrder.billing?.billId || `BILL-${year}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

    const existingTotal = parseAmount(currentAddServiceOrder.billing?.totalAmount);
    const existingDiscount = parseAmount(currentAddServiceOrder.billing?.discount);
    const subtotal = selectedServices.reduce((sum: number, s: any) => sum + (s.price || 0), 0);
    const addServiceDiscountAllowance = getDiscountAllowance({
      optionId: 'joborder_servicediscount_percent',
      totalAmount: existingTotal + subtotal,
      existingDiscountAmount: existingDiscount,
      currentDiscountBaseAmount: subtotal,
      fallbackPercent: 100,
    });
    const safeDiscountPercent = clampDiscountPercent(discountPercent || 0, addServiceDiscountAllowance.maxAdditionalPercent);
    const discount = (subtotal * safeDiscountPercent) / 100;
    const netAmount = subtotal - discount;

    const existingNet = parseAmount(currentAddServiceOrder.billing?.netAmount);
    const existingPaid = parseAmount(currentAddServiceOrder.billing?.amountPaid);

    const updatedBilling = {
      billId,
      totalAmount: formatAmount(existingTotal + subtotal),
      discount: formatAmount(existingDiscount + discount),
      netAmount: formatAmount(existingNet + netAmount),
      amountPaid: formatAmount(existingPaid),
      balanceDue: formatAmount((existingNet + netAmount) - existingPaid),
      paymentMethod: currentAddServiceOrder.billing?.paymentMethod || null,
      invoices: [
        ...(currentAddServiceOrder.billing?.invoices || []),
        {
          number: invoiceNumber,
          amount: formatAmount(netAmount),
          discount: formatAmount(discount),
          status: 'Unpaid',
          paymentMethod: null,
          services: selectedServices.map((s: any) => s.name)
        }
      ]
    };

    const newServiceEntries = selectedServices.map((service: any) => ({
      name: service.name,
      price: service.price || 0,
      status: 'New',
      started: 'Not started',
      ended: 'Not completed',
      duration: 'Not started',
      technician: 'Not assigned',
      notes: 'Added from Job Order details'
    }));

    const updatedOrder = {
      ...(currentAddServiceOrder as any),
      services: [...(currentAddServiceOrder?.services || []), ...newServiceEntries],
      billing: updatedBilling
    };

    const updatedOrders = demoOrders.map((order: any) =>
      order.id === currentAddServiceOrder?.id ? updatedOrder : order
    );

    localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
    setDemoOrders(updatedOrders);
    setCurrentDetailsOrder(updatedOrder);
    setCurrentAddServiceOrder(updatedOrder);
    
    // Set popup data first
    setAddServiceSuccessData({ orderId: currentAddServiceOrder?.id || '', invoiceId: invoiceNumber });
    setShowAddServiceSuccessPopup(true);
    
    // Then close the add service screen
    setTimeout(() => {
      setScreenState('details');
    }, 100);
  };

  const handleCancelOrder = () => {
    if (!cancelOrderId) return;

    // Find the order to cancel
    const orderToCancel = demoOrders.find((order: any) => order.id === cancelOrderId);
    if (!orderToCancel) return;

    // Check if order is already cancelled
    if ((orderToCancel as any).workStatus === 'Cancelled') {
      alert(`Job Order ${cancelOrderId} is already cancelled.`);
      setShowCancelConfirmation(false);
      setCancelOrderId(null);
      return;
    }

    // Create a cancelled version of the order
    const cancelledOrder = {
      ...(orderToCancel as any),
      workStatus: 'Cancelled'
    };

    // Update the order status in jobOrders storage
    const savedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]');
    const updatedSavedOrders = savedOrders.map((order: any) => 
      order.id === cancelOrderId ? cancelledOrder : order
    );
    localStorage.setItem('jobOrders', JSON.stringify(updatedSavedOrders));

    // Remove from current active orders display
    const updatedOrders = demoOrders.filter(order => order.id !== cancelOrderId);
    
    setDemoOrders(updatedOrders);
    setSubmittedOrderId(cancelOrderId);
    setLastAction('cancel');
    setShowSuccessPopup(true);
    setShowCancelConfirmation(false);
    setCancelOrderId(null);
  };

  const filteredOrders = demoOrders.filter((order: any) => {
    // Filter out Completed and Cancelled orders
    const allowedStatuses = ['New Request', 'Inspection', 'Inprogress', 'Quality Check', 'Ready'];
    if (!allowedStatuses.includes(order.workStatus)) {
      return false;
    }
    
    // Then apply search query filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.mobile.toLowerCase().includes(query) ||
      order.vehiclePlate.toLowerCase().includes(query) ||
      order.workStatus.toLowerCase().includes(query)
    );
  });

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="job-order-management">
      {screenState === 'main' && (
        <MainScreen
          orders={paginatedOrders}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onViewDetails={(order: any) => {
            // Reload from localStorage to get the latest data
            const freshOrders = mergeJobOrders(getLocalJobOrders(), demoOrders);
            const freshOrder = freshOrders.find((o: any) => o.id === order.id) || order;
            setCurrentDetailsOrder(freshOrder);
            setScreenState('details');
          }}
          onNewJob={() => setScreenState('newJob')}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalCount={filteredOrders.length}
          onCancelOrder={(orderId: string) => {
            setCancelOrderId(orderId);
            setShowCancelConfirmation(true);
          }}
        />
      )}
      {screenState === 'details' && currentDetailsOrder && (
        <DetailsScreen
          order={currentDetailsOrder}
          onClose={() => setScreenState('main')}
          onAddService={() => {
            setCurrentAddServiceOrder(currentDetailsOrder);
            setScreenState('addService');
          }}
        />
      )}
      {screenState === 'newJob' && (
        <NewJobScreen
          currentUser={currentUser}
          onClose={() => {
            setScreenState('main');
            setNewJobPrefill(null);
            if (navigationSource && onNavigateBack) {
              const vehicleId = returnToVehicleId;
              setNavigationSource(null);
              setReturnToVehicleId(null);
              onNavigateBack(navigationSource, vehicleId);
            }
          }}
          prefill={newJobPrefill}
          onSubmit={(newOrder: any) => {
            const savedOrders = getLocalJobOrders();
            const updatedOrders = mergeJobOrders([newOrder], savedOrders);
            localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
            setDemoOrders((prevOrders: any[]) => mergeJobOrders([newOrder], prevOrders));
            
            // Set popup data first
            setSubmittedOrderId(newOrder.id);
            setShowSuccessPopup(true);
            setNewJobPrefill(null);
            setNavigationSource(null);
            setReturnToVehicleId(null);
            
            // Then close the new job screen
            setTimeout(() => {
              setScreenState('main');
            }, 100);
          }}
        />
      )}
      {screenState === 'addService' && currentAddServiceOrder && (
        <AddServiceScreen
          order={currentAddServiceOrder}
          onClose={() => setScreenState('details')}
          onSubmit={handleAddServiceSubmit}
          products={PRODUCT_CATALOG}
          moduleId="joborder"
          permissionId="joborder_pricesummary"
          discountOptionId="joborder_servicediscount_percent"
          existingTotalAmount={parseCurrencyValue(currentAddServiceOrder?.billing?.totalAmount)}
          existingDiscountAmount={parseCurrencyValue(currentAddServiceOrder?.billing?.discount)}
        />
      )}
      {inspectionModalOpen && currentInspectionItem && (
        <InspectionModal
          item={currentInspectionItem}
          onClose={() => {
            setInspectionModalOpen(false);
            setCurrentInspectionItem(null);
          }}
        />
      )}
      
      {/* Success Popup */}
      {showSuccessPopup && (
        <SuccessPopup 
          isVisible={true}
          onClose={() => {
            setShowSuccessPopup(false);
            setLastAction('create');
          }}
          message={
            lastAction === 'cancel' ? (
              <>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4CAF50', display: 'block', marginBottom: '15px' }}>
                  <i className="fas fa-check-circle"></i> Order ID Cancelled Successfully!
                </span>
                <span style={{ fontSize: '1.1rem', color: '#333', display: 'block', marginTop: '10px' }}>
                  <strong>Job Order ID:</strong> <span style={{ color: '#2196F3', fontWeight: '600' }}>{submittedOrderId}</span>
                </span>
                <span style={{ fontSize: '0.95rem', color: '#666', display: 'block', marginTop: '8px' }}>
                  This order has been moved to Job Order History
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4CAF50', display: 'block', marginBottom: '15px' }}>
                  <i className="fas fa-check-circle"></i> Order Created Successfully!
                </span>
                <span style={{ fontSize: '1.1rem', color: '#333', display: 'block', marginTop: '10px' }}>
                  <strong>Job Order ID:</strong> <span style={{ color: '#2196F3', fontWeight: '600' }}>{submittedOrderId}</span>
                </span>
              </>
            )
          }
        />
      )}
      
      {/* Cancel Confirmation Modal */}
      <div className={`cancel-modal-overlay ${showCancelConfirmation && cancelOrderId ? 'active' : ''}`}>
        <div className="cancel-modal">
          <div className="cancel-modal-header">
            <h3>
              <i className="fas fa-exclamation-triangle"></i> Confirm Cancellation
            </h3>
          </div>
          <div className="cancel-modal-body">
            <div className="cancel-warning">
              <i className="fas fa-exclamation-circle"></i>
              <div className="cancel-warning-text">
                <p>
                  You are about to cancel order{' '}
                  <strong>{cancelOrderId}</strong>.
                </p>
                <p>This action cannot be undone.</p>
              </div>
            </div>
            <div className="cancel-modal-actions">
              <button className="btn-cancel" onClick={() => {
                setShowCancelConfirmation(false);
                setCancelOrderId(null);
              }}>
                <i className="fas fa-times"></i> Keep Order
              </button>
              <button className="btn-confirm-cancel" onClick={handleCancelOrder}>
                <i className="fas fa-ban"></i> Cancel Order
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Service Success Popup */}
      {showAddServiceSuccessPopup && (
        <SuccessPopup 
          isVisible={true}
          onClose={() => {
            setShowAddServiceSuccessPopup(false);
          }}
          message={
            <>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4CAF50', display: 'block', marginBottom: '15px' }}>
                <i className="fas fa-check-circle"></i> Services Added Successfully!
              </span>
              <span style={{ fontSize: '1.05rem', color: '#333', display: 'block', marginTop: '10px' }}>
                <strong>Job Order ID:</strong> <span style={{ color: '#2196F3', fontWeight: '600' }}>{addServiceSuccessData.orderId}</span>
              </span>
              <span style={{ fontSize: '1.05rem', color: '#333', display: 'block', marginTop: '8px' }}>
                <strong>New Invoice ID:</strong> <span style={{ color: '#27ae60', fontWeight: '600' }}>{addServiceSuccessData.invoiceId}</span>
              </span>
            </>
          }
        />
      )}
    </div>
  );
}

// ============================================
// SCREEN COMPONENTS
// ============================================

interface MainScreenProps {
  orders: any[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onViewDetails: (order: any) => void;
  onNewJob: () => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalCount: number;
  onCancelOrder: (orderId: string) => void;
}

function MainScreen({
  orders,
  searchQuery,
  onSearchChange,
  onViewDetails,
  onNewJob,
  currentPage,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalCount,
  onCancelOrder
}: MainScreenProps) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isDropdownButton = (event.target as HTMLElement).closest('.btn-action-dropdown');
      const isDropdownMenu = (event.target as HTMLElement).closest('.action-dropdown-menu');
      
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

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1><i className="fas fa-tools"></i> Job Order Management</h1>
        </div>
      </header>

      <main className="main-content">
        <section className="search-section">
          <div className="search-container">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              className="smart-search-input"
              placeholder="Search by any details"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="search-stats">
            {totalCount === 0 ? 'No job orders found' : `Showing ${orders.length} of ${totalCount} job orders`}
          </div>
        </section>

        <section className="results-section">
          <div className="section-header">
            <h2><i className="fas fa-list"></i> Job Order Records</h2>
            <div className="pagination-controls">
              <div className="records-per-page">
                <label htmlFor="pageSizeSelect">Records per page:</label>
                <select
                  id="pageSizeSelect"
                  className="page-size-select"
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                >
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <PermissionGate moduleId="joborder" optionId="joborder_add">
                <button className="btn-new-job" onClick={onNewJob}>
                  <i className="fas fa-plus-circle"></i> New Job Order
                </button>
              </PermissionGate>
            </div>
          </div>

          {orders.length > 0 ? (
            <div className="table-wrapper">
              <table className="job-order-table">
                <thead>
                  <tr>
                    <th>Create Date</th>
                    <th>Job Card ID</th>
                    <th>Order Type</th>
                    <th>Customer Name</th>
                    <th>Mobile Number</th>
                    <th>Vehicle Plate</th>
                    <th>Work Status</th>
                    <th>Payment Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="date-column">{order.createDate}</td>
                      <td>{order.id}</td>
                      <td>
                        <span className={`order-type-badge ${order.orderType === 'New Job Order' ? 'order-type-new-job' : 'order-type-service'}`}>
                          {order.orderType}
                        </span>
                      </td>
                      <td>{order.customerName}</td>
                      <td>{order.mobile}</td>
                      <td>{order.vehiclePlate}</td>
                      <td>
                        <span className={`status-badge ${getWorkStatusClass(order.workStatus)}`}>
                          {order.workStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getPaymentStatusClass(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <PermissionGate moduleId="joborder" optionId="joborder_actions">
                          <div className="action-dropdown-container">
                            <button
                              className={`btn-action-dropdown ${activeDropdown === order.id ? 'active' : ''}`}
                              onClick={(e) => {
                                const isActive = activeDropdown === order.id;
                                if (isActive) {
                                  setActiveDropdown(null);
                                  return;
                                }
                                const rect = e.currentTarget.getBoundingClientRect();
                                const menuHeight = 140;
                                const menuWidth = 200;
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const top = spaceBelow < menuHeight ? rect.top - menuHeight - 6 : rect.bottom + 6;
                                const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
                                setDropdownPosition({
                                  top,
                                  left
                                });
                                setActiveDropdown(order.id);
                              }}
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
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-search"></i>
              </div>
              <div className="empty-text">No matching job orders found</div>
              <div className="empty-subtext">Try adjusting your search terms or click "New Job Order" to create one</div>
            </div>
          )}
        </section>

        {orders.length > 0 && totalPages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn" 
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
                    onClick={() => onPageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button 
              className="pagination-btn" 
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Service Management System © 2023 | Job Order Management Module</p>
      </footer>
      {activeDropdown && typeof document !== 'undefined' && createPortal(
        <div
          className="action-dropdown-menu show action-dropdown-menu-fixed"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          <PermissionGate moduleId="joborder" optionId="joborder_viewdetails">
            <button className="dropdown-item view" onClick={() => { onViewDetails(orders.find((o: any) => o.id === activeDropdown)); setActiveDropdown(null); }}>
              <i className="fas fa-eye"></i> View Details
            </button>
          </PermissionGate>
          <PermissionGate moduleId="joborder" optionId="joborder_cancel">
            <>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item delete" onClick={() => { onCancelOrder(activeDropdown); setActiveDropdown(null); }}>
                <i className="fas fa-times-circle"></i> Cancel Order
              </button>
            </>
          </PermissionGate>
        </div>,
        document.body
      )}
    </div>
  );
}

interface DetailsScreenProps {
  order: any;
  onClose: () => void;
  onAddService: () => void;
}

function DetailsScreen({ order, onClose, onAddService }: DetailsScreenProps) {
  return (
    <div className="pim-details-screen">
      <div className="pim-details-header">
        <div className="pim-details-title-container">
          <h2><i className="fas fa-clipboard-list"></i> Job Order Details - {order.id}</h2>
        </div>
        <button className="pim-btn-close-details" onClick={onClose}>
          <i className="fas fa-times"></i> Close Details
        </button>
      </div>

      <div className="pim-details-body">
        <div className="pim-details-grid">
          <PermissionGate moduleId="joborder" optionId="joborder_summary">
            <JobOrderSummaryCard order={order} />
          </PermissionGate>
          <PermissionGate moduleId="joborder" optionId="joborder_roadmap">
            <RoadmapCard order={order} />
          </PermissionGate>
          {order.inspectionResult && <InspectionSummaryCard order={order} />}
          <PermissionGate moduleId="joborder" optionId="joborder_customer">
            <CustomerDetailsCard order={order} />
          </PermissionGate>
          <PermissionGate moduleId="joborder" optionId="joborder_vehicle">
            <VehicleDetailsCard order={order} />
          </PermissionGate>
          <PermissionGate moduleId="joborder" optionId="joborder_services">
            <ServicesCard order={order} onAddService={onAddService} />
          </PermissionGate>
          <PermissionGate moduleId="joborder" optionId="joborder_notes">
            {order.customerNotes && <CustomerNotesCard order={order} />}
          </PermissionGate>
          <PermissionGate moduleId="joborder" optionId="joborder_quality">
            <QualityCheckListCard order={order} />
          </PermissionGate>
          {order.deliveryQualityCheck && <DeliveryQualityCheckCard order={order} />}
          <PermissionGate moduleId="joborder" optionId="joborder_billing">
            <BillingCard order={order} />
          </PermissionGate>
          <PermissionGate moduleId="joborder" optionId="joborder_paymentlog">
            <PaymentActivityLogCard order={order} />
          </PermissionGate>
          <PermissionGate moduleId="joborder" optionId="joborder_exitpermit">
            <ExitPermitDetailsCard order={order} />
          </PermissionGate>
          <PermissionGate moduleId="joborder" optionId="joborder_documents">
            <DocumentsCard order={order} />
          </PermissionGate>
        </div>
      </div>
    </div>
  );
}

interface NewJobScreenProps {
  currentUser: any;
  onClose: () => void;
  onSubmit: (order: any) => void;
  prefill: any;
}

function NewJobScreen({ currentUser, onClose, onSubmit, prefill }: NewJobScreenProps) {
  const [step, setStep] = useState<number>(1);
  const [orderType, setOrderType] = useState<string | null>(null); // 'new' or 'service'
  const [customerType, setCustomerType] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedCompletedServices, setSelectedCompletedServices] = useState<any[]>([]);
  const [additionalServices, setAdditionalServices] = useState<any[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
  const [expectedDeliveryTime, setExpectedDeliveryTime] = useState<string>('');
  const [vehicleCompletedServices, setVehicleCompletedServices] = useState<any[]>([]);

  const activeServiceOrder = selectedCompletedServices.length > 0 ? selectedCompletedServices[0] : null;
  const servicesToBillForCurrentStep = orderType === 'service' ? additionalServices : selectedServices;
  const currentStepSubtotal = servicesToBillForCurrentStep.reduce((sum: number, service: any) => sum + (service.price || 0), 0);
  const priorOrderTotal = orderType === 'service' ? parseCurrencyValue(activeServiceOrder?.billing?.totalAmount) : 0;
  const priorOrderDiscount = orderType === 'service' ? parseCurrencyValue(activeServiceOrder?.billing?.discount) : 0;
  const discountOptionId = orderType === 'service' ? 'joborder_servicediscount_percent' : 'joborder_discount_percent';
  const discountAllowance = getDiscountAllowance({
    optionId: discountOptionId,
    totalAmount: priorOrderTotal + currentStepSubtotal,
    existingDiscountAmount: priorOrderDiscount,
    currentDiscountBaseAmount: currentStepSubtotal,
    fallbackPercent: 100,
    user: currentUser,
  });
  const maxDiscountPercent = discountAllowance.maxAdditionalPercent;

  const handleDiscountPercentChange = (value: number) => {
    setDiscountPercent(clampDiscountPercent(value, maxDiscountPercent));
  };

  useEffect(() => {
    setDiscountPercent((prev) => clampDiscountPercent(prev, maxDiscountPercent));
  }, [maxDiscountPercent]);

  const formatAmount = (value: any): string => `QAR ${Number(value || 0).toLocaleString()}`;

  const handleVehicleSelected = (vehicleInfo: any) => {
    setVehicleData(vehicleInfo);
    
    // Get completed services for this vehicle from demoOrders
    const jobOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]');
    
    const completedServices = jobOrders.filter(
      (order: any) => {
        const matches = order.vehicleDetails?.vehicleId === vehicleInfo.vehicleId && order.workStatus === 'Completed';
        return matches;
      }
    );
    
    setVehicleCompletedServices(completedServices);
    
    // If Service Order is selected and vehicle has no completed services, force New Order
    if (orderType === 'service' && completedServices.length === 0) {
      setOrderType('new');
    }
  };

  useEffect(() => {
    if (!prefill) {
      return;
    }

    if (prefill.customerData) {
      setCustomerType('existing');
      setCustomerData(prefill.customerData);
    }

    if (prefill.vehicleData) {
      handleVehicleSelected(prefill.vehicleData);
    }

    if (prefill.startStep) {
      setStep(Math.max(1, prefill.startStep));
    }
  }, [prefill]);

  const handleSubmit = () => {
    const now = new Date();
    const year = now.getFullYear();
    const jobOrderId = `JO-${year}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

    const selectedOrder = orderType === 'service' && selectedCompletedServices.length > 0
      ? selectedCompletedServices[0]
      : null;
    const originalServices = (selectedOrder as any)?.services || [];
    const normalizedOriginalServices = originalServices.map((service: any) => (
      typeof service === 'string' ? { name: service, status: 'Completed' } : service
    ));
    
    // Calculate billing amounts
    const isServiceOrder = orderType === 'service';
    const servicesToBill = isServiceOrder ? additionalServices : selectedServices;
    const subtotal = servicesToBill.reduce((sum: number, s: any) => sum + (s.price || 0), 0);
    const submitDiscountAllowance = getDiscountAllowance({
      optionId: isServiceOrder ? 'joborder_servicediscount_percent' : 'joborder_discount_percent',
      totalAmount: (isServiceOrder ? parseCurrencyValue(selectedOrder?.billing?.totalAmount) : 0) + subtotal,
      existingDiscountAmount: isServiceOrder ? parseCurrencyValue(selectedOrder?.billing?.discount) : 0,
      currentDiscountBaseAmount: subtotal,
      fallbackPercent: 100,
      user: currentUser,
    });
    const safeDiscountPercent = clampDiscountPercent(discountPercent || 0, submitDiscountAllowance.maxAdditionalPercent);
    const discount = (subtotal * safeDiscountPercent) / 100;
    const netAmount = subtotal - discount;
    
    // Generate master billing ID and first invoice
    const billId = `BILL-${year}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    const invoiceNumber = `INV-${year}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    
    const newOrder = {
      id: jobOrderId,
      orderType: orderType === 'service' ? 'Service Order' : 'New Job Order',
      customerName: customerData?.name || '',
      mobile: customerData?.mobile || customerData?.phone || '',
      vehiclePlate: vehicleData?.plateNumber || vehicleData?.license || '',
      workStatus: 'New Request',
      paymentStatus: 'Unpaid',
      createDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      jobOrderSummary: {
        createDate: new Date().toLocaleString(),
        createdBy: currentUser?.name || 'System User',
        expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleString()
      },
      customerDetails: {
        customerId: customerData.id,
        email: customerData.email,
        address: customerData.address || null,
        registeredVehicles: (() => {
          const count = customerData.registeredVehiclesCount ?? customerData.vehicles?.length ?? 1;
          return `${count} ${count === 1 ? 'vehicle' : 'vehicles'}`;
        })(),
        registeredVehiclesCount: customerData.registeredVehiclesCount ?? customerData.vehicles?.length ?? 1,
        completedServicesCount: customerData.completedServicesCount ?? 0,
        customerSince: customerData.customerSince || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      },
      vehicleDetails: {
        vehicleId: vehicleData.vehicleId || 'VEH-' + Math.floor(Math.random() * 10000),
        ownedBy: customerData.name,
        make: vehicleData.make || vehicleData.factory,
        model: vehicleData.model,
        year: vehicleData.year,
        type: vehicleData.vehicleType || vehicleData.carType,
        color: vehicleData.color,
        plateNumber: vehicleData.plateNumber || vehicleData.license,
        vin: vehicleData.vin || 'N/A',
        registrationDate: vehicleData.registrationDate || 'N/A'
      },
      serviceOrderReference: selectedOrder ? {
        orderId: selectedOrder.id,
        createDate: selectedOrder.createDate,
        services: normalizedOriginalServices
      } : null,
      services: orderType === 'service' ? additionalServices.map(s => ({
        name: s.name,
        price: s.price || 0,
        status: 'New',
        started: 'Not started',
        ended: 'Not completed',
        duration: 'Not started',
        technician: 'Not assigned',
        notes: 'Additional service for completed order'
      })) : selectedServices.map(s => ({
        name: s.name,
        price: s.price || 0,
        status: 'New',
        started: 'Not started',
        ended: 'Not completed',
        duration: 'Not started',
        technician: 'Not assigned',
        notes: 'New service request'
      })),
      billing: {
        billId: billId,
        totalAmount: formatAmount(subtotal),
        discount: formatAmount(discount),
        netAmount: formatAmount(netAmount),
        amountPaid: formatAmount(0),
        balanceDue: formatAmount(netAmount),
        paymentMethod: null,
        invoices: [
          {
            number: invoiceNumber,
            amount: formatAmount(netAmount),
            discount: formatAmount(discount),
            status: 'Unpaid',
            paymentMethod: null,
            services: servicesToBill.map(s => s.name)
          }
        ]
      },
      roadmap: [
        {
          step: 'New Request',
          stepStatus: 'Active',
          startTimestamp: new Date().toLocaleString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          endTimestamp: null,
          actionBy: currentUser?.name || 'System User',
          status: 'InProgress'
        },
        {
          step: 'Inspection',
          stepStatus: 'Upcoming',
          startTimestamp: null,
          endTimestamp: null,
          actionBy: 'Not assigned',
          status: 'Upcoming'
        },
        {
          step: 'Inprogress',
          stepStatus: 'Upcoming',
          startTimestamp: null,
          endTimestamp: null,
          actionBy: 'Not assigned',
          status: 'Upcoming'
        },
        {
          step: 'Quality Check',
          stepStatus: 'Upcoming',
          startTimestamp: null,
          endTimestamp: null,
          actionBy: 'Not assigned',
          status: 'Upcoming'
        },
        {
          step: 'Ready',
          stepStatus: 'Upcoming',
          startTimestamp: null,
          endTimestamp: null,
          actionBy: 'Not assigned',
          status: 'Upcoming'
        }
      ],
      inspectionResult: null,
      deliveryQualityCheck: null,
      exitPermit: null,
      additionalServiceRequests: [],
      documents: [],
      customerNotes: orderNotes || null
    };

    onSubmit(newOrder);
  };

  return (
    <div className="pim-details-screen">
      <div className="pim-details-header">
        <div className="pim-details-title-container">
          <h2><i className="fas fa-plus-circle"></i> Create New Job Order</h2>
        </div>
        <button className="pim-btn-close-details" onClick={onClose}>
          <i className="fas fa-times"></i> Cancel
        </button>
      </div>

      <div className="pim-details-body">
        <div className="progress-bar">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`progress-step ${s < step ? 'completed' : s === step ? 'active' : ''}`}>
              <span>{s}</span>
              <div className="step-label">{['Customer', 'Vehicle', 'Order Type', orderType === 'service' ? 'Services' : 'Services', 'Confirm'][s - 1]}</div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <StepOneCustomer
            customerType={customerType}
            setCustomerType={setCustomerType}
            customerData={customerData}
            setCustomerData={setCustomerData}
            onNext={() => setStep(2)}
            onCancel={onClose}
          />
        )}

        {step === 2 && (
          <StepTwoVehicle
            vehicleData={vehicleData}
            setVehicleData={setVehicleData}
            customerData={customerData}
            setCustomerData={setCustomerData}
            onVehicleSelected={handleVehicleSelected}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && vehicleCompletedServices.length > 0 && (
          <OrderTypeSelection
            vehicleCompletedServices={vehicleCompletedServices}
            orderType={orderType}
            onSelectOrderType={(type: string) => {
              setOrderType(type);
              setStep(4);
            }}
            onBack={() => setStep(2)}
          />
        )}

        {step === 3 && vehicleCompletedServices.length === 0 && (
          <NoCompletedServicesMessage
            onNext={() => {
              setOrderType('new');
              setStep(4);
            }}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && orderType === 'new' && (
          <OrderTypeHeader orderType="new" vehicleData={vehicleData} onChangeType={() => setStep(3)} />
        )}
        {step === 4 && orderType === 'new' && (
          <StepThreeServices
            selectedServices={selectedServices}
            setSelectedServices={setSelectedServices}
            vehicleType={vehicleData?.carType || vehicleData?.vehicleType || 'SUV'}
            discountPercent={discountPercent}
            setDiscountPercent={handleDiscountPercentChange}
            maxDiscountPercent={maxDiscountPercent}
            orderNotes={orderNotes}
            setOrderNotes={setOrderNotes}
            expectedDeliveryDate={expectedDeliveryDate}
            setExpectedDeliveryDate={setExpectedDeliveryDate}
            expectedDeliveryTime={expectedDeliveryTime}
            setExpectedDeliveryTime={setExpectedDeliveryTime}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}

        {step === 4 && orderType === 'service' && (
          <OrderTypeHeader orderType="service" vehicleData={vehicleData} onChangeType={() => setStep(3)} />
        )}
        {step === 4 && orderType === 'service' && (
          <StepThreeCompletedServices
            vehicleData={vehicleData}
            completedServices={vehicleCompletedServices}
            selectedCompletedServices={selectedCompletedServices}
            setSelectedCompletedServices={setSelectedCompletedServices}
            additionalServices={additionalServices}
            setAdditionalServices={setAdditionalServices}
            discountPercent={discountPercent}
            setDiscountPercent={handleDiscountPercentChange}
            maxDiscountPercent={maxDiscountPercent}
            orderNotes={orderNotes}
            setOrderNotes={setOrderNotes}
            expectedDeliveryDate={expectedDeliveryDate}
            setExpectedDeliveryDate={setExpectedDeliveryDate}
            expectedDeliveryTime={expectedDeliveryTime}
            setExpectedDeliveryTime={setExpectedDeliveryTime}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}

        {step === 5 && (
          <OrderTypeHeader orderType={orderType} vehicleData={vehicleData} onChangeType={() => setStep(3)} />
        )}
        {step === 5 && (
          <StepFourConfirm
            customerData={customerData}
            vehicleData={vehicleData}
            orderType={orderType || 'New Job Order'}
            selectedCompletedServices={selectedCompletedServices}
            selectedServices={orderType === 'service' ? additionalServices : selectedServices}
            discountPercent={discountPercent}
            orderNotes={orderNotes}
            expectedDeliveryDate={expectedDeliveryDate}
            expectedDeliveryTime={expectedDeliveryTime}
            onBack={() => setStep(4)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// ORDER TYPE HEADER (Shows selected type in step 4)
// ============================================
interface OrderTypeHeaderProps {
  orderType: any;
  vehicleData: any;
  onChangeType: () => void;
}

function OrderTypeHeader({ orderType, vehicleData, onChangeType }: OrderTypeHeaderProps) {
  return (
    <div style={{ 
      marginBottom: '15px', 
      padding: '12px 20px', 
      backgroundColor: orderType === 'new' ? '#e3f2fd' : '#e8f5e9', 
      borderRadius: '8px', 
      border: orderType === 'new' ? '2px solid #2196f3' : '2px solid #27ae60',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <i className={`fas ${orderType === 'new' ? 'fa-file-alt' : 'fa-tools'}`} style={{ 
          fontSize: '20px', 
          color: orderType === 'new' ? '#2196f3' : '#27ae60' 
        }}></i>
        <div>
          <div style={{ fontWeight: '600', color: '#333', fontSize: '15px' }}>
            {orderType === 'new' ? 'New Job Order' : 'Service Order'}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            {vehicleData.make} {vehicleData.model} • {vehicleData.license}
          </div>
        </div>
      </div>
      <button 
        onClick={onChangeType}
        style={{
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '6px',
          cursor: 'pointer',
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e: React.MouseEvent) => {
          const button = e.currentTarget as HTMLButtonElement;
          button.style.borderColor = '#999';
          button.style.color = '#333';
        }}
        onMouseOut={(e: React.MouseEvent) => {
          const button = e.currentTarget as HTMLButtonElement;
          button.style.borderColor = '#ddd';
          button.style.color = '#666';
        }}
      >
        <i className="fas fa-exchange-alt"></i>
        Change Type
      </button>
    </div>
  );
}

// ============================================
// ORDER TYPE SELECTION
// ============================================
interface OrderTypeSelectionProps {
  vehicleCompletedServices: any[];
  onSelectOrderType: (type: string) => void;
  onBack: () => void;
  orderType: any;
}

function OrderTypeSelection({ vehicleCompletedServices, onSelectOrderType, onBack, orderType }: OrderTypeSelectionProps) {
  return (
    <div className="form-card">
      <div className="form-card-title">
        <i className="fas fa-list-check"></i>
        <h2>Select Order Type</h2>
      </div>
      <div className="form-card-content">
        <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>This vehicle has {vehicleCompletedServices.length} completed service(s). Choose the type of order you want to create:</p>
        
        <div className="option-selector">
          <div 
            className={`option-btn ${orderType === 'new' ? 'selected' : ''}`} 
            onClick={() => onSelectOrderType('new')}
          >
            <i className="fas fa-file-alt" style={{ marginRight: '8px' }}></i>
            New Job Order
          </div>
          <div 
            className={`option-btn ${orderType === 'service' ? 'selected' : ''}`} 
            onClick={() => onSelectOrderType('service')}
          >
            <i className="fas fa-tools" style={{ marginRight: '8px' }}></i>
            Service Order
          </div>
        </div>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6', fontSize: '13px', color: '#666' }}>
          <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#6c757d' }}></i>
          <strong>New Job Order:</strong> Create a new service order with services from our catalog<br/>
          <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#6c757d', marginTop: '8px', display: 'inline-block' }}></i>
          <strong>Service Order:</strong> Add services to the {vehicleCompletedServices.length} completed order(s)
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onBack}>
          <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
          Back
        </button>
      </div>
    </div>
  );
}

// ============================================
// NO COMPLETED SERVICES MESSAGE
// ============================================
interface NoCompletedServicesMessageProps {
  onNext: () => void;
  onBack: () => void;
}

function NoCompletedServicesMessage({ onNext, onBack }: NoCompletedServicesMessageProps) {
  return (
    <div className="form-card">
      <div className="form-card-title">
        <i className="fas fa-info-circle"></i>
        <h2>Order Type</h2>
      </div>
      <div className="form-card-content">
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
          <i className="fas fa-exclamation-circle" style={{ color: '#ff9800', marginRight: '8px' }}></i>
          <span style={{ color: '#ff9800', fontWeight: '500' }}>This vehicle has no completed services yet. Proceeding with New Job Order.</span>
        </div>
        
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
          <i className="fas fa-file-alt" style={{ fontSize: '48px', color: '#2c3e50', marginBottom: '15px', display: 'block' }}></i>
          <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>New Job Order</h3>
          <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Create a new service order with selected services</p>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onBack}>Back</button>
        <button className="btn btn-primary" onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}

interface OrderTypeSelectionOldProps {
  onSelectOrderType: (type: string) => void;
  onBack?: () => void;
}

// @ts-ignore - This is an old component kept for reference but not actively used
function _OrderTypeSelectionOld({ onSelectOrderType, onBack }: OrderTypeSelectionOldProps) {
  return (
    <div className="form-card">
      <div className="form-card-title">
        <i className="fas fa-list-check"></i>
        <h2>Select Order Type</h2>
      </div>
      <div className="form-card-content">
        <p style={{ marginBottom: '20px', color: '#333', fontSize: '15px' }}>Choose the type of order you want to create:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div
            className="order-type-card"
            onClick={() => onSelectOrderType('new')}
            style={{
              padding: '30px',
              border: '2px solid #2c3e50',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              backgroundColor: '#f9f9f9'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3498db';
              e.currentTarget.style.backgroundColor = '#e3f2fd';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2c3e50';
              e.currentTarget.style.backgroundColor = '#f9f9f9';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <i className="fas fa-file-alt" style={{ fontSize: '48px', color: '#2c3e50', marginBottom: '15px', display: 'block' }}></i>
            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>New Job Order</h3>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Create a new service order with selected services</p>
          </div>
          
          <div
            className="order-type-card"
            onClick={() => onSelectOrderType('service')}
            style={{
              padding: '30px',
              border: '2px solid #27ae60',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              backgroundColor: '#f9f9f9'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2ecc71';
              e.currentTarget.style.backgroundColor = '#e8f5e9';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#27ae60';
              e.currentTarget.style.backgroundColor = '#f9f9f9';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <i className="fas fa-tools" style={{ fontSize: '48px', color: '#27ae60', marginBottom: '15px', display: 'block' }}></i>
            <h3 style={{ margin: '0 0 10px 0', color: '#27ae60' }}>Service Order</h3>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Add services to previously completed work</p>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

// ============================================
// COMPLETED SERVICES SELECTION (SERVICE ORDER)
// ============================================
interface StepThreeCompletedServicesProps {
  vehicleData?: any;
  completedServices: any[];
  selectedCompletedServices: any[];
  setSelectedCompletedServices: (services: any[]) => void;
  additionalServices: any[];
  setAdditionalServices: (services: any[]) => void;
  discountPercent: number;
  setDiscountPercent: (percent: number) => void;
  maxDiscountPercent: number;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  expectedDeliveryDate: string;
  setExpectedDeliveryDate: (date: string) => void;
  expectedDeliveryTime: string;
  setExpectedDeliveryTime: (time: string) => void;
  onNext: () => void;
  onBack: () => void;
}

function StepThreeCompletedServices({
  completedServices,
  selectedCompletedServices,
  setSelectedCompletedServices,
  additionalServices,
  setAdditionalServices,
  discountPercent,
  setDiscountPercent,
  maxDiscountPercent,
  orderNotes,
  setOrderNotes,
  expectedDeliveryDate,
  setExpectedDeliveryDate,
  expectedDeliveryTime,
  setExpectedDeliveryTime,
  onNext,
  onBack
}: StepThreeCompletedServicesProps) {
  const [showAddServices, setShowAddServices] = useState(false);

  const formatPrice = (price: any): string => {
    return `QAR ${price.toLocaleString()}`;
  };

  const parseQARAmount = (amountStr: any): number => {
    if (typeof amountStr === 'number') return amountStr;
    if (typeof amountStr === 'string') {
      return parseFloat(amountStr.replace(/QAR|,|\s/g, '')) || 0;
    }
    return 0;
  };

  // Get the selected completed order (single selection)
  const selectedOrder = selectedCompletedServices.length > 0 ? selectedCompletedServices[0] : null;

  // Calculate original order price
  const originalOrderPrice = selectedOrder ? parseQARAmount(selectedOrder.billing?.netAmount) : 0;

  // Calculate additional services price
  const additionalServicesPrice = additionalServices.reduce((sum: number, service: any) => {
    const price = typeof service.price === 'number' ? service.price : parseQARAmount(service.price);
    return sum + price;
  }, 0);

  // For Service Orders: Original order is already completed and paid
  // Only NEW services added are charged
  const subtotal = additionalServicesPrice;
  const discount = (subtotal * discountPercent) / 100;
  const total = subtotal - discount;

  if (showAddServices) {
    return (
      <StepThreeServicesForServiceOrder
        additionalServices={additionalServices}
        setAdditionalServices={setAdditionalServices}
        onBack={() => setShowAddServices(false)}
      />
    );
  }

  return (
    <div className="form-card">
      <div className="form-card-title">
        <i className="fas fa-history"></i>
        <h2>Service Order - Select Completed Order</h2>
      </div>
      <div className="form-card-content">
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px', border: '1px solid #27ae60' }}>
          <i className="fas fa-info-circle" style={{ color: '#27ae60', marginRight: '8px' }}></i>
          <span style={{ color: '#27ae60', fontWeight: '500' }}>
            Select one completed order to add services to it ({completedServices.length} available)
          </span>
        </div>

        {/* Completed Orders Selection */}
        {!selectedOrder ? (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#333' }}>
              <i className="fas fa-list" style={{ marginRight: '8px' }}></i>
              Completed Orders
            </label>
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              {completedServices.length > 0 ? (
                completedServices.map((service: any, index: any) => (
                  <div
                    key={index}
                    onClick={() => setSelectedCompletedServices([service])}
                    style={{
                      padding: '15px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      transition: 'all 0.2s',
                      border: '2px solid transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                      e.currentTarget.style.borderColor = '#27ae60';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div style={{ flex: '1' }}>
                      <div style={{ fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                        <i className="fas fa-check-circle" style={{ color: '#27ae60', marginRight: '8px' }}></i>
                        Job Order: {service.id}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                        Created: {service.createDate}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {service.services?.length || 0} service(s) - Total: {typeof service.billing?.netAmount === 'number' ? formatPrice(service.billing.netAmount) : service.billing?.netAmount || 'N/A'}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '5px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCompletedServices([service]);
                      }}
                    >
                      <i className="fas fa-arrow-right" style={{ marginRight: '4px' }}></i>
                      Select
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                  <i className="fas fa-inbox" style={{ fontSize: '32px', marginBottom: '10px', display: 'block' }}></i>
                  No completed orders found for this vehicle
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Selected Order Details */}
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '2px solid #27ae60' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#333' }}>
                    <i className="fas fa-check-circle" style={{ color: '#27ae60', marginRight: '8px' }}></i>
                    Selected Order: {selectedOrder.id}
                  </h4>
                  <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>Created: {selectedOrder.createDate}</p>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSelectedCompletedServices([]);
                    setAdditionalServices([]);
                  }}
                >
                  <i className="fas fa-exchange-alt" style={{ marginRight: '4px' }}></i>
                  Change Order
                </button>
              </div>

              {/* Services in Selected Order */}
              <div style={{ marginTop: '12px', borderTop: '1px solid #dee2e6', paddingTop: '12px' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px' }}>
                  <i className="fas fa-tools" style={{ marginRight: '8px', color: '#27ae60' }}></i>
                  Services in this order:
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrder.services?.length > 0 ? (
                    selectedOrder.services.map((svc: any, idx: any) => (
                      <div key={idx} style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '13px' }}>
                        <div style={{ fontWeight: '500', color: '#333', marginBottom: '2px' }}>
                          {svc.name}
                        </div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          Status: <span style={{ fontWeight: '500' }}>{svc.status || 'Completed'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#999', fontSize: '12px' }}>No services in this order</div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Services Section */}
            {additionalServices.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '1px solid #2196f3' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#1976d2', fontSize: '14px' }}>
                  <i className="fas fa-plus-circle" style={{ marginRight: '8px' }}></i>
                  Additional Services to Add:
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {additionalServices.map((svc: any, idx: any) => (
                    <div key={idx} style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #bbdefb', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#333', marginBottom: '2px' }}>
                          {svc.name}
                        </div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          Price:{' '}
                          <PermissionGate moduleId="joborder" optionId="joborder_serviceprice">
                            <span style={{ fontWeight: '500' }}>
                              {typeof svc.price === 'number' ? formatPrice(svc.price) : svc.price}
                            </span>
                          </PermissionGate>
                        </div>
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setAdditionalServices(additionalServices.filter((_: any, i: any) => i !== idx))}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Service Button */}
            <PermissionGate moduleId="joborder" optionId="joborder_addservice">
              <div style={{ marginBottom: '20px' }}>
                <button
                  className="btn btn-info"
                  onClick={() => setShowAddServices(true)}
                  style={{ width: '100%' }}
                >
                  <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
                  Add Service
                </button>
              </div>
            </PermissionGate>

            {/* Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                <i className="fas fa-sticky-note" style={{ marginRight: '8px' }}></i>
                Notes / Comments (Optional)
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Add any additional notes or comments..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Expected Delivery */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                <i className="fas fa-calendar-check" style={{ marginRight: '8px' }}></i>
                Expected Delivery Date & Time
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: '1' }}>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    placeholder="Select date"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ flex: '1' }}>
                  <input
                    type="time"
                    value={expectedDeliveryTime}
                    onChange={(e) => setExpectedDeliveryTime(e.target.value)}
                    placeholder="Select time"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#7f8c8d', fontStyle: 'italic' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '4px' }}></i>
                Please select today or a future date
              </div>
            </div>

            {/* Price Summary */}
            <div className="price-summary-box">
              <h4>Price Summary</h4>
              <div className="price-row" style={{ opacity: 0.6, fontStyle: 'italic' }}>
                <span>Original Order (Completed & Paid):</span>
                <span>{formatPrice(originalOrderPrice)}</span>
              </div>
              {additionalServicesPrice > 0 && (
                <div className="price-row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '10px' }}>
                  <span style={{ fontWeight: '600' }}><i className="fas fa-plus-circle" style={{ marginRight: '8px', color: '#3498db' }}></i>New Services to Add:</span>
                  <span style={{ fontWeight: '600', color: '#3498db' }}>{formatPrice(additionalServicesPrice)}</span>
                </div>
              )}
              <div className="price-row">
                <span>Subtotal (New Services Only):</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <PermissionGate moduleId="joborder" optionId="joborder_servicediscount">
                <div className="price-row">
                  <span>Apply Discount:</span>
                  <div>
                    <PermissionGate moduleId="joborder" optionId="joborder_servicediscount_percent">
                      <input
                        type="number"
                        min="0"
                        max={maxDiscountPercent}
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                        style={{ width: '80px' }}
                      />
                      <span> %</span>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>
                        Max allowed now: {maxDiscountPercent.toFixed(2)}%
                      </div>
                    </PermissionGate>
                  </div>
                </div>
              </PermissionGate>
              <div className="price-row discount-amount">
                <span>Discount Amount:</span>
                <span>{formatPrice(discount)}</span>
              </div>
              <div className="price-row total">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onBack}>Back</button>
        <button className="btn btn-primary" onClick={onNext} disabled={!selectedOrder}>
          Next: Confirm
        </button>
      </div>
    </div>
  );
}

interface InspectionModalProps {
  item: any;
  onClose: () => void;
}

function InspectionModal({ item, onClose }: InspectionModalProps) {
  if (!item) return null;
  
  return (
    <div className="inspection-modal" style={{ display: 'flex' }} onClick={onClose}>
      <div className="inspection-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="inspection-modal-header">
          <h3><i className="fas fa-search"></i> {item.name}</h3>
          <button className="inspection-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="inspection-modal-body">
          <div className="inspection-detail-section">
            <h4>Details</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value">{item.status}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Notes</span>
                <span className="detail-value">{item.notes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS FOR FORMS
// ============================================

interface StepOneCustomerProps {
  customerType: any;
  setCustomerType: (type: any) => void;
  customerData: any;
  setCustomerData: (data: any) => void;
  onNext: () => void;
  onCancel: () => void;
}

function StepOneCustomer({ customerType, setCustomerType, customerData, setCustomerData, onNext, onCancel }: StepOneCustomerProps) {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [smartSearch, setSmartSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [verifiedCustomer, setVerifiedCustomer] = useState<any>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState<boolean>(false);
  const [pendingCustomer, setPendingCustomer] = useState<any>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    setCustomerData(null);
    setSmartSearch('');
    setSearchResults([]);
    setShowResults(false);
    setVerifiedCustomer(null);
  }, [customerType, setCustomerData]);

  const handleSave = () => {
    if (saving) return; // Prevent multiple clicks
    
    if (fullName && phone) {
      setSaving(true);
      
      // Get fresh customer list directly from localStorage + demo data
      const demoCustomers = getCustomers();
      const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
      const allCustomers = [...demoCustomers, ...savedCustomers];
      
      // Check if customer with same name or mobile already exists
      const existingCustomer = allCustomers.find(
        customer => 
          customer.mobile.toLowerCase() === phone.toLowerCase() ||
          customer.name.toLowerCase() === fullName.toLowerCase()
      );

      if (existingCustomer) {
        // Show warning dialog
        const newCustomer = {
          id: 'CUST-2024-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
          name: fullName,
          email,
          mobile: phone,
          address: address || null,
          registeredVehiclesCount: 0,
          completedServicesCount: 0,
          customerSince: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          vehicles: []
        };
        setPendingCustomer(newCustomer);
        setShowDuplicateWarning(true);
        setSaving(false);
      } else {
        // Save customer directly if no duplicate
        const newCustomer = {
          id: 'CUST-2024-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
          name: fullName,
          email,
          mobile: phone,
          address: address || null,
          registeredVehiclesCount: 0,
          completedServicesCount: 0,
          customerSince: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          vehicles: []
        };
        
        // Save customer to localStorage with final check
        const currentSaved = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
        // Check once more if customer was just added
        const finalCheck = currentSaved.find(
          (customer: any) =>  
            customer.mobile.toLowerCase() === phone.toLowerCase() ||
            customer.name.toLowerCase() === fullName.toLowerCase()
        );
        if (!finalCheck) {
          currentSaved.push(newCustomer);
          localStorage.setItem('jobOrderCustomers', JSON.stringify(currentSaved));
          setCustomerData(newCustomer);
          setVerifiedCustomer(newCustomer);
        }
        setSaving(false);
      }
    }
  };

  const handleConfirmDuplicate = () => {
    if (pendingCustomer && !saving) {
      setSaving(true);
      // Save customer to localStorage despite duplicate
      const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
      // Check if this exact customer was already added (prevent double save)
      const alreadyExists = savedCustomers.find((c: any) => c.id === pendingCustomer.id);
      if (!alreadyExists) {
        savedCustomers.push(pendingCustomer);
        localStorage.setItem('jobOrderCustomers', JSON.stringify(savedCustomers));
      }
      
      setCustomerData(pendingCustomer);
      setVerifiedCustomer(pendingCustomer);
      setShowDuplicateWarning(false);
      setPendingCustomer(null);
      setSaving(false);
    }
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateWarning(false);
    setPendingCustomer(null);
  };

  const handleVerifySearch = () => {
    const searchTerm = smartSearch.trim().toLowerCase();

    if (!searchTerm) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Get fresh customer list from localStorage + demo data
    const freshCustomers = getDemoAndSavedCustomers();

    // Smart search across all customer fields
    const matches = freshCustomers.filter((customer: any) => {
      const customerName = customer.name.toLowerCase();
      const customerId = customer.id.toLowerCase();
      const customerEmail = customer.email.toLowerCase();
      const customerMobile = customer.mobile.toLowerCase();

      return (
        customerName.includes(searchTerm) ||
        customerId.includes(searchTerm) ||
        customerEmail.includes(searchTerm) ||
        customerMobile.includes(searchTerm)
      );
    });

    setSearchResults(matches);
    setShowResults(true);
  };

  const handleSelectCustomer = (customer: any) => {
    setVerifiedCustomer(customer);
    setCustomerData(customer);
    setSmartSearch('');
    setShowResults(false);
    setSearchResults([]);
  };

  return (
    <div className="form-card">
      <div className="form-card-title">
        <i className="fas fa-user"></i>
        <h2>Customer Information</h2>
      </div>
      <div className="form-card-content">
        <div className="option-selector">
          <div className={`option-btn ${customerType === 'new' ? 'selected' : ''}`} onClick={() => setCustomerType('new')}>
            New Customer
          </div>
          <div className={`option-btn ${customerType === 'existing' ? 'selected' : ''}`} onClick={() => setCustomerType('existing')}>
            Existing Customer
          </div>
        </div>

        {customerType === 'new' && !verifiedCustomer && (
          <div>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email </label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Optional"/>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !fullName ||  !phone}>
              {saving ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        )}

        {customerType === 'existing' && (
          <div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Search Customer</label>
              <div className="smart-search-wrapper">
                <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}></i>
                <input
                  type="text"
                  className="smart-search-input"
                  placeholder="Search by name, customer ID, mobile, or email..."
                  value={smartSearch}
                  onChange={(e) => setSmartSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifySearch()}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleVerifySearch}
                style={{ marginTop: '10px' }}
              >
                <i className="fas fa-search"></i> Verify Customer
              </button>

              {showResults && searchResults.length > 0 && (
                <div className="customer-search-results">
                  {searchResults.map((customer) => (
                    <div key={customer.id} className="customer-result-item">
                      <div className="customer-result-info">
                        <div className="customer-result-name">
                          <strong>{customer.name}</strong>
                        </div>
                        <div className="customer-result-details">
                          <span className="customer-detail-chip">
                            <i className="fas fa-id-card"></i> {customer.id}
                          </span>
                          <span className="customer-detail-chip">
                            <i className="fas fa-phone"></i> {customer.mobile}
                          </span>
                          <span className="customer-detail-chip">
                            <i className="fas fa-envelope"></i> {customer.email}
                          </span>
                        </div>
                      </div>
                      <button 
                        className="btn btn-verify" 
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <i className="fas fa-check"></i> Select
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showResults && searchResults.length === 0 && (
                <div className="customer-search-results">
                  <div className="no-results-message">
                    <i className="fas fa-search"></i>
                    <p>No customers found matching your search</p>
                  </div>
                </div>
              )}
            </div>

            {verifiedCustomer && (
              <div className="verified-customer-display">
                <div className="verified-header">
                  <i className="fas fa-check-circle"></i>
                  <span>Customer Verified</span>
                </div>
                <div className="verified-info">
                  <div className="verified-row">
                    <span className="verified-label">Name:</span>
                    <span className="verified-value">{verifiedCustomer.name}</span>
                  </div>
                  <div className="verified-row">
                    <span className="verified-label">Customer ID:</span>
                    <span className="verified-value">{verifiedCustomer.id}</span>
                  </div>
                  <div className="verified-row">
                    <span className="verified-label">Email:</span>
                    <span className="verified-value">{verifiedCustomer.email}</span>
                  </div>
                  <div className="verified-row">
                    <span className="verified-label">Mobile:</span>
                    <span className="verified-value">{verifiedCustomer.mobile}</span>
                  </div>
                  {verifiedCustomer.address && (
                    <div className="verified-row">
                      <span className="verified-label">Address:</span>
                      <span className="verified-value">{verifiedCustomer.address}</span>
                    </div>
                  )}
                  <div className="verified-row">
                    <span className="verified-label">Registered Vehicles:</span>
                    <span className="verified-value">{verifiedCustomer.registeredVehiclesCount}</span>
                  </div>
                  <div className="verified-row">
                    <span className="verified-label">Completed Services:</span>
                    <span className="verified-value">{verifiedCustomer.completedServicesCount}</span>
                  </div>
                  <div className="verified-row">
                    <span className="verified-label">Customer Since:</span>
                    <span className="verified-value">{verifiedCustomer.customerSince}</span>
                  </div>
                </div>
                <button 
                  className="btn btn-change-customer" 
                  onClick={() => {
                    setVerifiedCustomer(null);
                    setCustomerData(null);
                    setSmartSearch('');
                    setShowResults(false);
                    setSearchResults([]);
                  }}
                >
                  <i className="fas fa-sync-alt"></i> Change Customer
                </button>
              </div>
            )}
          </div>
        )}

        {customerType === 'new' && verifiedCustomer && (
          <div className="verified-customer-display">
            <div className="verified-header">
              <i className="fas fa-check-circle"></i>
              <span>Customer Verified</span>
            </div>
            <div className="verified-info">
              <div className="verified-row">
                <span className="verified-label">Name:</span>
                <span className="verified-value">{verifiedCustomer.name}</span>
              </div>
              <div className="verified-row">
                <span className="verified-label">Customer ID:</span>
                <span className="verified-value">{verifiedCustomer.id}</span>
              </div>
              <div className="verified-row">
                <span className="verified-label">Email:</span>
                <span className="verified-value">{verifiedCustomer.email}</span>
              </div>
              <div className="verified-row">
                <span className="verified-label">Mobile:</span>
                <span className="verified-value">{verifiedCustomer.mobile}</span>
              </div>
              {verifiedCustomer.address && (
                <div className="verified-row">
                  <span className="verified-label">Address:</span>
                  <span className="verified-value">{verifiedCustomer.address}</span>
                </div>
              )}
              <div className="verified-row">
                <span className="verified-label">Registered Vehicles:</span>
                <span className="verified-value">{verifiedCustomer.registeredVehiclesCount}</span>
              </div>
              <div className="verified-row">
                <span className="verified-label">Completed Services:</span>
                <span className="verified-value">{verifiedCustomer.completedServicesCount}</span>
              </div>
              <div className="verified-row">
                <span className="verified-label">Customer Since:</span>
                <span className="verified-value">{verifiedCustomer.customerSince}</span>
              </div>
            </div>
            <button 
              className="btn btn-change-customer" 
              onClick={() => {
                setVerifiedCustomer(null);
                setCustomerData(null);
                setFullName('');
                setEmail('');
                setPhone('');
                setAddress('');
              }}
            >
              <i className="fas fa-edit"></i> Edit Customer
            </button>
          </div>
        )}

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

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={onNext} disabled={!customerData}>
          Next: Vehicle
        </button>
      </div>
    </div>
  );
}

interface StepTwoVehicleProps {
  vehicleData: any;
  setVehicleData: (data: any) => void;
  customerData: any;
  setCustomerData: (data: any) => void;
  onVehicleSelected: (vehicle: any) => void;
  onNext: () => void;
  onBack: () => void;
}

function StepTwoVehicle({ vehicleData, setVehicleData, customerData, setCustomerData, onVehicleSelected, onNext, onBack }: StepTwoVehicleProps) {
  const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
  const [factory, setFactory] = useState('Toyota');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [license, setLicense] = useState('');
  const [carType, setCarType] = useState('SUV');
  const [color, setColor] = useState('');
  // Check if customer has vehicles
  const hasVehicles = customerData?.vehicles && customerData.vehicles.length > 0;

  // Auto-show new vehicle form if customer has no vehicles
  useEffect(() => {
    if (!hasVehicles) {
      setShowNewVehicleForm(true);
    }
  }, [hasVehicles]);

  const handleSaveNewVehicle = () => {
    if (factory && model && year && license && carType && color) {
      const newVehicle = {
        vehicleId: 'VEH-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
        make: factory,
        model: model,
        year: year.toString(),
        color: color,
        plateNumber: license,
        vehicleType: carType,
        vin: 'VIN' + Math.random().toString(36).substr(2, 14).toUpperCase(),
        completedServices: 0,
        ownedBy: customerData.name,
        customerId: customerData.id
      };
      
      // Add vehicle to customer's vehicles array and save to localStorage
      const updatedCustomer = {
        ...customerData,
        vehicles: [...(customerData.vehicles || []), newVehicle],
        registeredVehiclesCount: (customerData.registeredVehiclesCount || 0) + 1
      };
      
      // Update customer in jobOrderCustomers localStorage
      const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
      const customerIndex = savedCustomers.findIndex((c: any) => c.id === customerData.id);
      if (customerIndex >= 0) {
        savedCustomers[customerIndex] = updatedCustomer;
        localStorage.setItem('jobOrderCustomers', JSON.stringify(savedCustomers));
      }
      
      // Also save vehicle to vehicleManagementVehicles localStorage for consistency
      const savedVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]');
      const vehicleWithDetails = {
        ...newVehicle,
        customerDetails: {
          customerId: customerData.id,
          name: customerData.name,
          email: customerData.email || '',
          mobile: customerData.mobile,
          address: customerData.address || null,
          registeredVehiclesCount: updatedCustomer.registeredVehiclesCount,
          completedServicesCount: customerData.completedServicesCount || 0,
          customerSince: customerData.customerSince
        },
        vehicleDetails: {
          vehicleId: newVehicle.vehicleId,
          ownedBy: customerData.name,
          make: newVehicle.make,
          model: newVehicle.model,
          year: newVehicle.year,
          color: newVehicle.color,
          plateNumber: newVehicle.plateNumber,
          vin: newVehicle.vin,
          type: newVehicle.vehicleType,
          registrationDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          lastServiceDate: null
        }
      };
      savedVehicles.push(vehicleWithDetails);
      localStorage.setItem('vehicleManagementVehicles', JSON.stringify(savedVehicles));
      
      // Update customer data state with the new vehicle
      setCustomerData(updatedCustomer);
      
      setVehicleData(newVehicle);
      setShowNewVehicleForm(false);
    }
  };

  const handleSelectExistingVehicle = (vehicle: any) => {
    const vehicleInfo = {
      vehicleId: vehicle?.vehicleId,
      make: vehicle?.make,
      model: vehicle?.model,
      year: vehicle?.year,
      color: vehicle?.color,
      plateNumber: vehicle?.plateNumber,
      vehicleType: vehicle?.vehicleType,
      vin: vehicle?.vin,
      completedServices: vehicle?.completedServices
    };
    setVehicleData(vehicleInfo);
    if (onVehicleSelected) {
      onVehicleSelected(vehicleInfo);
    }
  };

  return (
    <div className="form-card">
      <div className="form-card-title">
        <i className="fas fa-car"></i>
        <h2>Vehicle Information</h2>
      </div>
      <div className="form-card-content">
        {/* Show vehicle selection if customer has vehicles and not showing new form */}
        {hasVehicles && !showNewVehicleForm && !vehicleData && (
          <div>
            <div className="info-banner" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '1px solid #2196f3' }}>
              <i className="fas fa-info-circle" style={{ color: '#2196f3', marginRight: '8px' }}></i>
              <span>This customer has {customerData.vehicles.length} registered vehicle(s). Select one or add a new vehicle.</span>
            </div>

            <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>Registered Vehicles</h3>
            <div className="vehicles-list">
              {customerData.vehicles.map((vehicle: any) => (
                <div 
                  key={vehicle.vehicleId} 
                  className={`vehicle-result-item`}
                >
                  <div className="vehicle-result-info">
                    <div className="vehicle-result-name">
                      <strong>{vehicle.make} {vehicle.model} ({vehicle.year})</strong>
                    </div>
                    <div className="vehicle-result-details">
                      <span className="vehicle-detail-chip">
                        <i className="fas fa-palette"></i> {vehicle.color}
                      </span>
                      <span className="vehicle-detail-chip">
                        <i className="fas fa-id-card"></i> {vehicle.plateNumber}
                      </span>
                      <span className="vehicle-detail-chip">
                        <i className="fas fa-car"></i> {vehicle.vehicleType}
                      </span>
                      <span className="vehicle-detail-chip">
                        <i className="fas fa-barcode"></i> {vehicle.vin}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="btn btn-verify" 
                    onClick={() => handleSelectExistingVehicle(vehicle)}
                  >
                    <i className="fas fa-check"></i> Select
                  </button>
                </div>
              ))}
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={() => setShowNewVehicleForm(true)}
              style={{ marginTop: '15px' }}
            >
              <i className="fas fa-plus"></i> Add New Vehicle
            </button>
          </div>
        )}

        {/* Show new vehicle form */}
        {(showNewVehicleForm || !hasVehicles) && !vehicleData && (
          <div>
            {hasVehicles && (
              <button 
                className="btn btn-link" 
                onClick={() => setShowNewVehicleForm(false)}
                style={{ marginBottom: '15px', padding: '8px 12px', fontSize: '14px' }}
              >
                <i className="fas fa-arrow-left"></i> Back to Vehicle Selection
              </button>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Manufacturer *</label>
                <select value={factory} onChange={(e) => setFactory(e.target.value)}>
                  <option>Toyota</option>
                  <option>Honda</option>
                  <option>Nissan</option>
                  <option>Ford</option>
                  <option>BMW</option>
                  <option>Mercedes</option>
                  <option>Hyundai</option>
                  <option>Kia</option>
                  <option>Chevrolet</option>
                  <option>Volkswagen</option>
                  <option>Audi</option>
                </select>
              </div>
              <div className="form-group">
                <label>Model *</label>
                <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g., Camry" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Year *</label>
                <select value={String(year)} onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}>
                  {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>License Plate *</label>
                <input value={license} onChange={(e) => setLicense(e.target.value)} placeholder="e.g., DXB-12345" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Vehicle Type *</label>
                <select value={carType} onChange={(e) => setCarType(e.target.value)}>
                  <option>SUV</option>
                  <option>Sedan</option>
                  <option>Hatchback</option>
                  <option>Coupe</option>
                  <option>Truck</option>
                </select>
              </div>
              <div className="form-group">
                <label>Color *</label>
                <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g., Silver Metallic" />
              </div>
            </div>
            <button className="btn btn-success" onClick={handleSaveNewVehicle}>
              <i className="fas fa-save"></i> Save Vehicle
            </button>
          </div>
        )}

        {/* Show selected vehicle confirmation */}
        {vehicleData && (
          <div className="verified-customer-display" style={{ marginTop: '0' }}>
            <div className="verified-header">
              <i className="fas fa-check-circle"></i>
              <span>Vehicle Selected</span>
            </div>
            <div className="verified-info">
              <div className="verified-row">
                <span className="verified-label">Vehicle:</span>
                <span className="verified-value">{vehicleData.make} {vehicleData.model} ({vehicleData.year})</span>
              </div>
              <div className="verified-row">
                <span className="verified-label">License Plate:</span>
                <span className="verified-value">{vehicleData.plateNumber}</span>
              </div>
              <div className="verified-row">
                <span className="verified-label">Type:</span>
                <span className="verified-value">{vehicleData.vehicleType}</span>
              </div>
              <div className="verified-row">
                <span className="verified-label">Color:</span>
                <span className="verified-value">{vehicleData.color}</span>
              </div>
              {vehicleData.vin && (
                <div className="verified-row">
                  <span className="verified-label">VIN:</span>
                  <span className="verified-value">{vehicleData.vin}</span>
                </div>
              )}
            </div>
            <button 
              className="btn btn-change-customer" 
              onClick={() => {
                setVehicleData(null);
                handleSelectExistingVehicle(null);
                if (!hasVehicles) {
                  setFactory('Toyota');
                  setModel('');
                  setYear(new Date().getFullYear());
                  setLicense('');
                  setCarType('SUV');
                  setColor('');
                }
              }}
            >
              <i className="fas fa-sync-alt"></i> Change Vehicle
            </button>
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onBack}>Back</button>
        <button className="btn btn-primary" onClick={onNext} disabled={!vehicleData}>
          Next: Services
        </button>
      </div>
    </div>
  );
}

// ============================================
// ADD SERVICES FOR SERVICE ORDER
// ============================================
interface StepThreeServicesForServiceOrderProps {
  additionalServices: any[];
  setAdditionalServices: (services: any[]) => void;
  onBack: () => void;
}

function StepThreeServicesForServiceOrder({ additionalServices, setAdditionalServices, onBack }: StepThreeServicesForServiceOrderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggleService = (product: any) => {
    const suvPrice = product.suvPrice;

    const existingService = additionalServices.find((s: any) => s.name === product.name);

    if (existingService) {
      setAdditionalServices(additionalServices.filter((s: any) => s.name !== product.name));
    } else {
      setAdditionalServices([
        ...additionalServices,
        { name: product.name, price: suvPrice, selected: true }
      ]);
    }
  };

  const filteredProducts = PRODUCT_CATALOG.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPrice = additionalServices.reduce((sum: number, s: any) => sum + (s.price || 0), 0);

  return (
    <div className="form-card">
      <div className="form-card-title">
        <i className="fas fa-plus-circle"></i>
        <h2>Select Additional Services to Add</h2>
      </div>
      <div className="form-card-content">
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#333' }}>
            <i className="fas fa-list" style={{ marginRight: '8px' }}></i>
            Available Services
          </label>
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', maxHeight: '500px', overflowY: 'auto' }}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => {
                const isSelected = additionalServices.some((s: any) => s.name === product.name);

                return (
                  <div
                    key={index}
                    onClick={() => handleToggleService(product)}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#e3f2fd' : 'white',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#333', marginBottom: '4px' }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        Price: QAR {product.suvPrice.toLocaleString()}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{
                        marginLeft: '12px',
                        cursor: 'pointer',
                        width: '18px',
                        height: '18px'
                      }}
                    />
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                <i className="fas fa-search" style={{ fontSize: '32px', marginBottom: '10px', display: 'block' }}></i>
                No services found
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '1px solid #2196f3' }}>
          <div style={{ fontWeight: '600', color: '#1976d2', marginBottom: '10px' }}>
            <i className="fas fa-calculator" style={{ marginRight: '8px' }}></i>
            Selected Services to Add: {additionalServices.length}
          </div>
          {additionalServices.length > 0 && (
            <div style={{ fontSize: '13px', color: '#1976d2' }}>
              Total: <span style={{ fontWeight: '600' }}>QAR {totalPrice.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onBack}>
          <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
          Back
        </button>
        <button
          className="btn btn-primary"
          onClick={onBack}
          disabled={additionalServices.length === 0}
        >
          <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
          Add {additionalServices.length > 0 ? `${additionalServices.length} Service${additionalServices.length !== 1 ? 's' : ''}` : 'Services'}
        </button>
      </div>
    </div>
  );
}

interface StepThreeServicesProps {
  selectedServices: any[];
  setSelectedServices: (services: any[]) => void;
  vehicleType: any;
  discountPercent: number;
  setDiscountPercent: (percent: number) => void;
  maxDiscountPercent: number;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  expectedDeliveryDate: string;
  setExpectedDeliveryDate: (date: string) => void;
  expectedDeliveryTime: string;
  setExpectedDeliveryTime: (time: string) => void;
  onNext: () => void;
  onBack: () => void;
}

function StepThreeServices({
  selectedServices,
  setSelectedServices,
  vehicleType,
  discountPercent,
  setDiscountPercent,
  maxDiscountPercent,
  orderNotes,
  setOrderNotes,
  expectedDeliveryDate,
  setExpectedDeliveryDate,
  expectedDeliveryTime,
  setExpectedDeliveryTime,
  onNext,
  onBack
}: StepThreeServicesProps) {
  // @ts-ignore
  const handleToggleService = (product) => {
    const price = vehicleType === 'SUV' ? product.suvPrice : product.sedanPrice;
    if (selectedServices.some((s: any) => s.name === product.name)) {
      setSelectedServices(selectedServices.filter((s: any) => s.name !== product.name));
    } else {
      setSelectedServices([...selectedServices, { name: product.name, price }]);
    }
  };

  const formatPrice = (price: number): string => {
    return `QAR ${price.toLocaleString()}`;
  };

  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const discount = (subtotal * discountPercent) / 100;
  const total = subtotal - discount;

  return (
    <div className="form-card">
      <div className="form-card-title">
        <i className="fas fa-concierge-bell"></i>
        <h2>Services Selection</h2>
      </div>
      <div className="form-card-content">
        <p>Select services for {vehicleType}:</p>
        <div className="services-grid">
          {PRODUCT_CATALOG.map((product) => (
            <div
              key={product.name}
              className={`service-checkbox ${selectedServices.some((s: any) => s.name === product.name) ? 'selected' : ''}`}
              onClick={() => handleToggleService(product)}
            >
              <div className="service-info">
                <div className="service-name">{product.name}</div>
              </div>
              <div className="service-price">
                {formatPrice(vehicleType === 'SUV' ? product.suvPrice : product.sedanPrice)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
            <i className="fas fa-sticky-note" style={{ marginRight: '8px' }}></i>
            Notes / Comments (Optional)
          </label>
          <textarea
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Add any special instructions, notes, or comments for this order..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
            <i className="fas fa-calendar-check" style={{ marginRight: '8px' }}></i>
            Expected Delivery Date & Time
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: '1' }}>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                placeholder="Select date"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: '1' }}>
              <input
                type="time"
                value={expectedDeliveryTime}
                onChange={(e) => setExpectedDeliveryTime(e.target.value)}
                placeholder="Select time"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          <div style={{ marginTop: '6px', fontSize: '12px', color: '#7f8c8d', fontStyle: 'italic' }}>
            <i className="fas fa-info-circle" style={{ marginRight: '4px' }}></i>
            Please select today or a future date
          </div>
        </div>

        <div className="price-summary-box">
          <h4>Price Summary</h4>
          <div className="price-row">
            <span>Services:</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="price-row">
            <span>Apply Discount:</span>
            <div>
              <input
                type="number"
                min="0"
                max={maxDiscountPercent}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                style={{ width: '80px', color: '#333', backgroundColor: '#fff' }}
              />
              <span> %</span>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>
                Max allowed now: {maxDiscountPercent.toFixed(2)}%
              </div>
            </div>
          </div>
          <div className="price-row discount-amount">
            <span>Discount Amount:</span>
            <span>{formatPrice(discount)}</span>
          </div>
          <div className="price-row total">
            <span>Total:</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onBack}>Back</button>
        <button className="btn btn-primary" onClick={onNext} disabled={selectedServices.length === 0}>
          Next: Confirm
        </button>
      </div>
    </div>
  );
}

interface StepFourConfirmProps {
  customerData: any;
  vehicleData: any;
  orderType: string;
  selectedCompletedServices: any[];
  selectedServices: any[];
  discountPercent: number;
  orderNotes: string;
  expectedDeliveryDate: string;
  expectedDeliveryTime: string;
  onBack: () => void;
  onSubmit: () => void;
}

function StepFourConfirm({ customerData, vehicleData, orderType, selectedCompletedServices, selectedServices, discountPercent, orderNotes, expectedDeliveryDate, expectedDeliveryTime, onBack, onSubmit }: StepFourConfirmProps) {
  const formatPrice = (price: number): string => {
    return `QAR ${price.toLocaleString()}`;
  };

  const subtotal = selectedServices.reduce((sum: number, s: any) => sum + s.price, 0);
  const discount = (subtotal * discountPercent) / 100;
  const total = subtotal - discount;
  
  // Get original order details for service orders
  const originalOrder = orderType === 'service' && selectedCompletedServices.length > 0 ? selectedCompletedServices[0] : null;

  return (
    <div className="form-card">
      <div className="form-card-title">
        <i className="fas fa-check-circle"></i>
        <h2>Order Confirmation</h2>
      </div>
      <div className="form-card-content">
        <div className="pim-details-grid">
          {/* Customer Information Card */}
          <div className="pim-detail-card">
            <h3><i className="fas fa-user"></i> Customer Information</h3>
            <div className="pim-card-content">
              <div className="pim-info-item">
                <span className="pim-info-label">Customer ID</span>
                <span className="pim-info-value">{customerData.id || 'New Customer'}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Customer Name</span>
                <span className="pim-info-value">{customerData.name}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Mobile Number</span>
                <span className="pim-info-value">{customerData.mobile || customerData.phone || 'Not provided'}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Email Address</span>
                <span className="pim-info-value">{customerData.email || 'Not provided'}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Home Address</span>
                <span className="pim-info-value">{customerData.address || 'Not provided'}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Registered Vehicles</span>
                <span className="pim-info-value">
                  <span className="count-badge">{customerData.registeredVehiclesCount || 0} vehicles</span>
                </span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Completed Services</span>
                <span className="pim-info-value">
                  <span className="count-badge">{customerData.completedServicesCount || 0} services</span>
                </span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Customer Since</span>
                <span className="pim-info-value">{customerData.customerSince || 'New Customer'}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Information Card */}
          <div className="pim-detail-card">
            <h3><i className="fas fa-car"></i> Vehicle Information</h3>
            <div className="pim-card-content">
              <div className="pim-info-item">
                <span className="pim-info-label">Vehicle ID</span>
                <span className="pim-info-value">{vehicleData.vehicleId || 'N/A'}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Owned By</span>
                <span className="pim-info-value">{customerData.name}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Make</span>
                <span className="pim-info-value">{vehicleData.make}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Model</span>
                <span className="pim-info-value">{vehicleData.model}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Year</span>
                <span className="pim-info-value">{vehicleData.year}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Color</span>
                <span className="pim-info-value">{vehicleData.color}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Plate Number</span>
                <span className="pim-info-value">{vehicleData.plateNumber}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">VIN</span>
                <span className="pim-info-value">{vehicleData.vin || 'N/A'}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Vehicle Type</span>
                <span className="pim-info-value">{vehicleData.vehicleType}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Completed Services</span>
                <span className="pim-info-value">
                  <span className="count-badge">{vehicleData.completedServices || 0} services</span>
                </span>
              </div>
            </div>
          </div>

          {/* Services Card - Conditional based on Order Type */}
          {orderType === 'service' && originalOrder ? (
            <>
              {/* Original Completed Order Section */}
              <div className="pim-detail-card" style={{ backgroundColor: '#f9f9f9', borderLeft: '4px solid #999' }}>
                <h3><i className="fas fa-check-circle"></i> Original Completed Order (#{originalOrder.id})</h3>
                <div className="table-wrapper" style={{ marginTop: '15px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#e8e8e8', borderBottom: '2px solid #ccc' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Service Name</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#666', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {originalOrder.services && originalOrder.services.map((service: any, index: number) => (
                        <tr key={index} style={{ borderBottom: '1px solid #ddd', backgroundColor: '#fafafa' }}>
                          <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>{service.name || service}</td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#999', fontSize: '14px', fontWeight: '500', textDecoration: 'line-through' }}>QAR 0</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '4px', fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                  <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#999' }}></i>
                  These services were completed in the original order (already paid)
                </div>
              </div>

              {/* Additional Services Section (if any) */}
              {selectedServices && selectedServices.length > 0 && (
                <div className="pim-detail-card" style={{ borderLeft: '4px solid #4CAF50' }}>
                  <h3><i className="fas fa-plus-circle"></i> Additional Services to Add</h3>
                  <div className="table-wrapper" style={{ marginTop: '15px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Service Name</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#333', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedServices.map((service: any, index: number) => (
                          <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', color: '#333', fontSize: '14px' }}>{service.name}</td>
                            <td style={{ padding: '12px', textAlign: 'right', color: '#333', fontSize: '14px', fontWeight: '500' }}>{formatPrice(service.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* New Job Order - Standard Services Display */
            <div className="pim-detail-card">
              <h3><i className="fas fa-concierge-bell"></i> Selected Services</h3>
              <div className="table-wrapper" style={{ marginTop: '15px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Service Name</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#333', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedServices.map((service, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', color: '#333', fontSize: '14px' }}>{service.name}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#333', fontSize: '14px', fontWeight: '500' }}>{formatPrice(service.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes Card (if provided) - BEFORE Price Summary */}
          {orderNotes && (
            <div className="pim-detail-card">
              <h3><i className="fas fa-sticky-note"></i> Notes / Comments</h3>
              <div className="pim-card-content">
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px', whiteSpace: 'pre-wrap', color: '#333', fontSize: '14px', lineHeight: '1.5' }}>
                  {orderNotes}
                </div>
              </div>
            </div>
          )}

          {/* Expected Delivery Card (if provided) */}
          {(expectedDeliveryDate || expectedDeliveryTime) && (
            <div className="pim-detail-card">
              <h3><i className="fas fa-calendar-check"></i> Expected Delivery</h3>
              <div className="pim-card-content">
                <div className="pim-info-item">
                  <span className="pim-info-label">Delivery Date</span>
                  <span className="pim-info-value">{expectedDeliveryDate || 'Not specified'}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Delivery Time</span>
                  <span className="pim-info-value">{expectedDeliveryTime || 'Not specified'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Price Summary Card */}
          <div className="pim-detail-card">
            <h3><i className="fas fa-calculator"></i> Price Summary</h3>
            <div className="pim-card-content">
              <div className="pim-info-item">
                <span className="pim-info-label">Subtotal</span>
                <span className="pim-info-value">{formatPrice(subtotal)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="pim-info-item">
                  <span className="pim-info-label">Discount ({discountPercent}%)</span>
                  <span className="pim-info-value">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="pim-info-item" style={{ paddingTop: '10px', borderTop: '2px solid #ddd' }}>
                <span className="pim-info-label" style={{ fontSize: '18px', fontWeight: 'bold' }}>Total</span>
                <span className="pim-info-value" style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--success-color)' }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onBack}>Back</button>
        <button className="btn btn-success" onClick={onSubmit}>Submit Order</button>
      </div>
    </div>
  );
}

// ============================================
// DETAIL CARDS
// ============================================

interface OrderCardProps {
  order: any;
}

function JobOrderSummaryCard({ order }: OrderCardProps) {
  return (
    <div className="epm-detail-card">
      <h3><i className="fas fa-info-circle"></i> Job Order Summary</h3>
      <div className="epm-card-content">
        <div className="epm-info-item">
          <span className="epm-info-label">Job Order ID</span>
          <span className="epm-info-value">{order.id}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Order Type</span>
          <span className="epm-info-value"><span className={`epm-order-type-badge ${order.orderType === 'New Job Order' ? 'epm-order-type-new-job' : 'epm-order-type-service'}`}>{order.orderType}</span></span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Request Create Date</span>
          <span className="epm-info-value">{order.jobOrderSummary?.createDate || order.createDate}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Created By</span>
          <span className="epm-info-value">{order.jobOrderSummary?.createdBy || 'Not specified'}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Expected Delivery Date</span>
          <span className="epm-info-value">{order.jobOrderSummary?.expectedDelivery || 'Not specified'}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Work Status</span>
          <span className="epm-info-value"><span className={`epm-status-badge ${getWorkStatusClass(order.workStatus)}`}>{order.workStatus}</span></span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Payment Status</span>
          <span className="epm-info-value"><span className={`epm-status-badge ${getPaymentStatusClass(order.paymentStatus)}`}>{order.paymentStatus}</span></span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Exit Permit Status</span>
          <span className="epm-info-value"><span className={`epm-status-badge ${order.exitPermitStatus === 'Created' ? 'epm-payment-full' : 'epm-payment-unpaid'}`}>{order.exitPermitStatus || 'Not Created'}</span></span>
        </div>
      </div>
    </div>
  );
}

function RoadmapCard({ order }: OrderCardProps) {
  if (!order.roadmap || order.roadmap.length === 0) return null;

  const formatStepStatus = (status: string): string => {
    switch (status) {
      case 'New': return 'pim-status-new';
      case 'Completed': return 'pim-status-completed';
      case 'InProgress': return 'pim-status-inprogress';
      case 'Pending': return 'pim-status-pending';
      case 'Upcoming': return 'pim-status-pending';
      default: return 'pim-status-pending';
    }
  };

  const getStepStatusClass = (stepStatus: string): string => {
    switch (stepStatus) {
      case 'Completed': return 'pim-step-completed';
      case 'Active': return 'pim-step-active';
      case 'InProgress': return 'pim-step-active';
      case 'Pending': return 'pim-step-pending';
      case 'Cancelled': return 'pim-step-cancelled';
      case 'Upcoming': return 'pim-step-upcoming';
      default: return 'pim-step-upcoming';
    }
  };

  const getStepIcon = (stepStatus: string): string => {
    switch (stepStatus) {
      case 'Completed': return 'fas fa-check-circle';
      case 'Active': return 'fas fa-play-circle';
      case 'InProgress': return 'fas fa-play-circle';
      case 'Pending': return 'fas fa-clock';
      case 'Cancelled': return 'fas fa-times-circle';
      case 'Upcoming': return 'fas fa-circle';
      default: return 'fas fa-circle';
    }
  };

  return (
    <div className="pim-detail-card">
      <h3><i className="fas fa-map-signs"></i> Job Order Roadmap</h3>
      <div className="pim-roadmap-container">
        <div className="pim-roadmap-steps">
          {order.roadmap.map((step: any, idx: number) => (
            <div key={idx} className={`pim-roadmap-step ${getStepStatusClass(step.stepStatus)}`}>
              <div className="pim-step-icon">
                <i className={getStepIcon(step.stepStatus)}></i>
              </div>
              <div className="pim-step-content">
                <div className="pim-step-header">
                  <div className="pim-step-name">{step.step}</div>
                  <span className={`pim-status-badge ${formatStepStatus(step.status)}`}>{step.status}</span>
                </div>
                <div className="pim-step-details">
                  <div className="pim-step-detail">
                    <span className="pim-detail-label">Started</span>
                    <span className="pim-detail-value">{step.startTimestamp || 'Not started'}</span>
                  </div>
                  <div className="pim-step-detail">
                    <span className="pim-detail-label">Ended</span>
                    <span className="pim-detail-value">{step.endTimestamp || 'Not completed'}</span>
                  </div>
                  <div className="pim-step-detail">
                    <span className="pim-detail-label">Action By</span>
                    <span className="pim-detail-value">{step.actionBy || 'Not assigned'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InspectionSummaryCard({ order }: OrderCardProps) {
  if (!order.inspectionResult) return null;

  return (
    <div className="inspection-summary-card">
      <h3><i className="fas fa-search"></i> Inspection Summary</h3>
      <div className="card-content">
        <div className="info-item">
          <span className="info-label">Inspection ID</span>
          <span className="info-value">{order.inspectionResult.inspectionId}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Status</span>
          <span className="info-value">
            <span className={`status-badge ${order.inspectionResult.inspectionStatus === 'Passed' ? 'payment-full' : 'payment-unpaid'}`}>
              {order.inspectionResult.inspectionStatus}
            </span>
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Inspector</span>
          <span className="info-value">{order.inspectionResult.inspectorName}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Findings</span>
          <span className="info-value">{order.inspectionResult.findings}</span>
        </div>
      </div>
    </div>
  );
}

function CustomerDetailsCard({ order }: OrderCardProps) {
  return (
    <div className="pim-detail-card">
      <h3><i className="fas fa-user"></i> Customer Information</h3>
      <div className="pim-card-content">
        <div className="pim-info-item">
          <span className="pim-info-label">Customer ID</span>
          <span className="pim-info-value">{order.customerDetails?.customerId || 'New Customer'}</span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Customer Name</span>
          <span className="pim-info-value">{order.customerName}</span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Mobile Number</span>
          <span className="pim-info-value">{order.mobile || 'Not provided'}</span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Email Address</span>
          <span className="pim-info-value">{order.customerDetails?.email || 'Not provided'}</span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Home Address</span>
          <span className="pim-info-value">{order.customerDetails?.address || 'Not provided'}</span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Registered Vehicles</span>
          <span className="pim-info-value">
            <span className="count-badge">{order.customerDetails?.registeredVehiclesCount ?? 1} {(order.customerDetails?.registeredVehiclesCount ?? 1) === 1 ? 'vehicle' : 'vehicles'}</span>
          </span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Completed Services</span>
          <span className="pim-info-value">
            <span className="count-badge">{order.customerDetails?.completedServicesCount ?? 0} {(order.customerDetails?.completedServicesCount ?? 0) === 1 ? 'service' : 'services'}</span>
          </span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Customer Since</span>
          <span className="pim-info-value">{order.customerDetails?.customerSince || 'Not specified'}</span>
        </div>
      </div>
    </div>
  );
}

function VehicleDetailsCard({ order }: OrderCardProps) {
  return (
    <div className="pim-detail-card">
      <h3><i className="fas fa-car"></i> Vehicle Information</h3>
      <div className="pim-card-content">
        <div className="pim-info-item">
          <span className="pim-info-label">Vehicle Unique ID</span>
          <span className="pim-info-value">{order.vehicleDetails?.vehicleId || 'N/A'}</span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Owned By</span>
          <span className="pim-info-value">{order.vehicleDetails?.ownedBy || 'N/A'}</span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Make</span>
          <span className="pim-info-value">{order.vehicleDetails?.make || 'N/A'}</span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Model</span>
          <span className="pim-info-value">{order.vehicleDetails?.model || 'N/A'}</span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Year</span>
          <span className="pim-info-value">{order.vehicleDetails?.year || 'N/A'}</span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Vehicle Type</span>
          <span className="pim-info-value">{order.vehicleDetails?.type || 'N/A'}</span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Color</span>
          <span className="pim-info-value">{order.vehicleDetails?.color || 'N/A'}</span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Plate Number</span>
          <span className="pim-info-value">{order.vehicleDetails?.plateNumber || order.vehiclePlate || 'N/A'}</span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">VIN</span>
          <span className="pim-info-value">{order.vehicleDetails?.vin || 'N/A'}</span>
        </div>
        <div className="pim-info-item">
          <span className="pim-info-label">Registration Date</span>
          <span className="pim-info-value">{order.vehicleDetails?.registrationDate || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}

interface ServicesCardProps {
  order: any;
  onAddService: () => void;
}

function ServicesCard({ order, onAddService }: ServicesCardProps) {
  const referenceServices = order.orderType === 'Service Order'
    ? (order.serviceOrderReference?.services || [])
    : [];
  const combinedServices = referenceServices.length > 0
    ? [...referenceServices, ...(order.services || [])]
    : (order.services || []);

  return (
    <div className="pim-detail-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}><i className="fas fa-tasks"></i> Services Summary</h3>
        <PermissionGate moduleId="joborder" optionId="joborder_addservice">
          <button className="btn-add-service" onClick={onAddService} style={{ padding: '8px 16px', fontSize: '14px' }}>
            <i className="fas fa-plus-circle"></i> Add Service
          </button>
        </PermissionGate>
      </div>
      <div className="pim-services-list">
        {combinedServices.length > 0 ? (
          combinedServices.map((service: any, idx: number) => (
            <div key={idx} className="pim-service-item">
              <div className="pim-service-header">
                <span className="pim-service-name">{service.name}</span>
                <span className={`pim-status-badge ${formatServiceStatus(service.status)}`}>
                  {service.status}
                </span>
              </div>
              <div className="pim-service-timeline">
                <div className="pim-timeline-item">
                  <i className="fas fa-play-circle"></i>
                  <span className="pim-timeline-label">Started:</span>
                  <span className="pim-timeline-value">{service.started || service.startTime || 'Not started'}</span>
                </div>
                <div className="pim-timeline-item">
                  <i className="fas fa-flag-checkered"></i>
                  <span className="pim-timeline-label">Ended:</span>
                  <span className="pim-timeline-value">{service.ended || service.endTime || 'Not completed'}</span>
                </div>
                <div className="pim-timeline-item">
                  <i className="fas fa-clock"></i>
                  <span className="pim-timeline-label">Duration:</span>
                  <span className="pim-timeline-value">{service.duration || 'N/A'}</span>
                </div>
                <div className="pim-timeline-item">
                  <i className="fas fa-user-cog"></i>
                  <span className="pim-timeline-label">Assigned To:</span>
                  <span className="pim-timeline-value">{service.assignedTo || service.technician || 'Not assigned'}</span>
                </div>
                {service.technicians && service.technicians.length > 0 && (
                  <div className="pim-timeline-item">
                    <i className="fas fa-users"></i>
                    <span className="pim-timeline-label">Technicians:</span>
                    <span className="pim-timeline-value">{service.technicians.join(', ')}</span>
                  </div>
                )}
              </div>
              {service.notes && (
                <div className="pim-service-notes">
                  <span className="pim-notes-label">Notes:</span>
                  <span className="pim-notes-value">{service.notes}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            No services added yet
          </div>
        )}
      </div>
    </div>
  );
}

const formatServiceStatus = (status: string): string => {
  switch (status) {
    case 'Completed': return 'pim-status-completed';
    case 'InProgress': return 'pim-status-inprogress';
    case 'In Progress': return 'pim-status-inprogress';
    case 'Pending Approval': return 'pim-status-pending-approval';
    case 'Paused': return 'pim-status-paused';
    case 'New': return 'pim-status-new';
    case 'Postponed': return 'pim-status-postponed';
    default: return 'pim-status-new';
  }
};

function DeliveryQualityCheckCard({ order }: OrderCardProps) {
  if (!order.deliveryQualityCheck) return null;

  return (
    <div className="delivery-quality-card">
      <h3><i className="fas fa-check-circle"></i> Delivery Quality Check</h3>
      <div className="card-content">
        <div className="info-item">
          <span className="info-label">Status</span>
          <span className="info-value">
            <span className={`status-badge ${order.deliveryQualityCheck.qualityStatus === 'Excellent' ? 'payment-full' : 'status-pending'}`}>
              {order.deliveryQualityCheck.qualityStatus}
            </span>
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Checked By</span>
          <span className="info-value">{order.deliveryQualityCheck.checkedBy}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Notes</span>
          <span className="info-value">{order.deliveryQualityCheck.notes}</span>
        </div>
      </div>
    </div>
  );
}

function CustomerNotesCard({ order }: OrderCardProps) {
  return (
    <div className="epm-detail-card" style={{ backgroundColor: '#fffbea', borderLeft: '4px solid #f59e0b' }}>
      <h3><i className="fas fa-comment-dots"></i> Customer Notes</h3>
      <div style={{ padding: '15px 20px', whiteSpace: 'pre-wrap', color: '#78350f', fontSize: '14px', lineHeight: '1.6' }}>
        {order.customerNotes}
      </div>
    </div>
  );
}

function QualityCheckListCard({ order }: OrderCardProps) {
  const services = order.orderType === 'Service Order'
    ? [...(order.serviceOrderReference?.services || []), ...(Array.isArray(order.services) ? order.services : [])]
    : (Array.isArray(order.services) ? order.services : []);

  const getStoredResult = (serviceName: string, index: number): any => {
    const storedResults = order.qualityCheckResults;
    if (!storedResults) return null;
    if (Array.isArray(storedResults)) {
      return storedResults[index] || null;
    }
    if (typeof storedResults === 'object') {
      return storedResults[serviceName] || storedResults[index] || null;
    }
    return null;
  };

  const getQualityCheckResult = (service: any, index: number): any => {
    if (service && typeof service === 'object') {
      return service.qualityCheckResult || service.qcResult || service.qcStatus || service.qualityStatus || null;
    }
    const serviceName = typeof service === 'string' ? service : 'Service';
    return getStoredResult(serviceName, index);
  };

  return (
    <div className="pim-detail-card" style={{ backgroundColor: '#e8f4f1', borderLeft: '4px solid #16a085' }}>
      <h3><i className="fas fa-clipboard-check"></i> Quality Check List</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {services.length > 0 ? (
          services.map((service: any, idx: number) => {
            const serviceName = typeof service === 'string' ? service : service.name;
            const result = getQualityCheckResult(service, idx) || 'Not Evaluated';
            const isPass = result === 'Pass';
            const isFailed = result === 'Failed';
            const isAcceptable = result === 'Acceptable';

            return (
              <div
                key={`${serviceName}-${idx}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  gap: '12px'
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', flex: 1 }}>
                  {serviceName}
                </span>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    ...(isPass && { backgroundColor: '#d1fae5', color: '#065f46' }),
                    ...(isFailed && { backgroundColor: '#fee2e2', color: '#991b1b' }),
                    ...(isAcceptable && { backgroundColor: '#fef3c7', color: '#92400e' }),
                    ...(!isPass && !isFailed && !isAcceptable && { backgroundColor: '#e5e7eb', color: '#374151' })
                  }}
                >
                  {result}
                </span>
              </div>
            );
          })
        ) : (
          <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
            No services to evaluate
          </div>
        )}
      </div>
    </div>
  );
}

function BillingCard({ order }: OrderCardProps) {
  return (
    <div className="epm-detail-card">
      <h3><i className="fas fa-receipt"></i> Billing & Invoices</h3>
      
      {/* Master Billing Information */}
      <div className="epm-billing-master-section" style={{ 
        backgroundColor: '#f0f9ff', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '25px',
        border: '1px solid #bae6fd'
      }}>
        <div className="epm-card-content">
          <div className="epm-info-item">
            <span className="epm-info-label"><i className="fas fa-barcode"></i> Master Bill ID</span>
            <span className="epm-info-value" style={{ color: '#0369a1', fontWeight: '600', fontSize: '17px' }}>
              {order.billing?.billId || 'N/A'}
            </span>
          </div>
          <div className="epm-info-item">
            <span className="epm-info-label"><i className="fas fa-calculator"></i> Total Bill Amount</span>
            <span className="epm-info-value" style={{ fontSize: '17px' }}>{order.billing?.totalAmount || 'N/A'}</span>
          </div>
          <div className="epm-info-item">
            <span className="epm-info-label"><i className="fas fa-tag"></i> Total Discount</span>
            <span className="epm-info-value" style={{ color: '#27ae60', fontSize: '17px' }}>{order.billing?.discount || 'N/A'}</span>
          </div>
          <div className="epm-info-item">
            <span className="epm-info-label"><i className="fas fa-money-bill-wave"></i> Net Amount</span>
            <span className="epm-info-value" style={{ fontSize: '18px', fontWeight: '700', color: '#1e40af' }}>
              {order.billing?.netAmount || 'N/A'}
            </span>
          </div>
          <div className="epm-info-item">
            <span className="epm-info-label"><i className="fas fa-check-circle"></i> Amount Paid</span>
            <span className="epm-info-value" style={{ color: '#27ae60', fontSize: '17px' }}>{order.billing?.amountPaid || 'N/A'}</span>
          </div>
          <div className="epm-info-item">
            <span className="epm-info-label"><i className="fas fa-exclamation-circle"></i> Balance Due</span>
            <span className="epm-info-value" style={{ color: '#dc2626', fontSize: '17px', fontWeight: '600' }}>
              {order.billing?.balanceDue || 'N/A'}
            </span>
          </div>
        </div>
        {order.billing?.paymentMethod && (
          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #bae6fd' }}>
            <div className="epm-info-item">
              <span className="epm-info-label">Payment Method</span>
              <span className="epm-info-value">
                <span className={`epm-payment-method-badge ${getPaymentMethodClass(order.billing.paymentMethod)}`}>
                  {order.billing.paymentMethod}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Invoices Section */}
      {order.billing?.invoices && order.billing.invoices.length > 0 && (
        <div>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#334155', 
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="fas fa-file-invoice" style={{ color: '#3b82f6' }}></i>
            Invoice Details ({order.billing.invoices.length})
          </div>
          {order.billing.invoices.map((invoice: any, idx: number) => (
            <div key={idx} className="epm-invoice-item" style={{ 
              background: 'linear-gradient(to right, #ffffff, #fafbfc)',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #3b82f6'
            }}>
              <div className="epm-invoice-header" style={{ 
                background: 'white', 
                padding: '15px', 
                borderRadius: '6px',
                marginBottom: '15px'
              }}>
                <span className="epm-info-value" style={{ 
                  fontSize: '16px', 
                  fontWeight: '700', 
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="fas fa-hashtag"></i> {invoice.number}
                </span>
                <span className="epm-info-value" style={{ fontSize: '16px', fontWeight: '600' }}>
                  <i className="fas fa-coins" style={{ color: '#f59e0b', marginRight: '6px' }}></i>
                  Amount: {invoice.amount}
                </span>
              </div>
              <div className="epm-invoice-details">
                <div className="epm-detail-row">
                  <span className="epm-detail-label"><i className="fas fa-tag"></i> Discount:</span>
                  <span className="epm-detail-value" style={{ color: '#27ae60', fontWeight: '600' }}>{invoice.discount}</span>
                </div>
                {invoice.paymentMethod && (
                  <div className="epm-detail-row">
                    <span className="epm-detail-label"><i className="fas fa-credit-card"></i> Payment Method:</span>
                    <span className="epm-detail-value">
                      <span className={`epm-payment-method-badge ${getPaymentMethodClass(invoice.paymentMethod)}`}>
                        {invoice.paymentMethod}
                      </span>
                    </span>
                  </div>
                )}
              </div>
              <div className="epm-invoice-services" style={{ 
                background: 'white', 
                padding: '15px', 
                borderRadius: '6px',
                marginTop: '15px'
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#64748b', 
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <i className="fas fa-list-ul"></i> Services Included:
                </div>
                {invoice.services?.map((service: any, sidx: number) => (
                  <div key={sidx} className="epm-service-in-invoice" style={{ 
                    padding: '8px 0 8px 15px',
                    fontSize: '14px',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <i className="fas fa-check-circle" style={{ color: '#22c55e', fontSize: '12px' }}></i> 
                    {service}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentsCard({ order }: OrderCardProps) {
  const documents = Array.isArray(order.documents) ? order.documents : []

  if (documents.length === 0) return null;

  return (
    <div className="pim-detail-card">
      <h3><i className="fas fa-folder-open"></i> Documents</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {documents.map((doc: any, idx: number) => (
          <div key={idx} style={{
            padding: '15px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <i className="fas fa-file-alt" style={{ color: '#3b82f6', fontSize: '20px' }}></i>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {doc.type} {doc.category ? `• ${doc.category}` : ''}
                    {doc.paymentReference ? ` • ${doc.paymentReference}` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#6b7280', marginLeft: '30px' }}>
                {doc.uploadDate && (
                  <span>
                    <i className="fas fa-calendar-alt" style={{ marginRight: '5px' }}></i>
                    {doc.uploadDate}
                  </span>
                )}
                {doc.uploadedBy && (
                  <span>
                    <i className="fas fa-user" style={{ marginRight: '5px' }}></i>
                    {doc.uploadedBy}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                if (doc.url || doc.fileData) {
                  const link = document.createElement('a');
                  link.href = doc.fileData || doc.url;
                  link.download = doc.name || 'document';
                  link.click();
                }
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fas fa-download"></i>
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );

}

function PaymentActivityLogCard({ order }: OrderCardProps) {
  if (!order.paymentActivityLog || order.paymentActivityLog.length === 0) return null;

  return (
    <div className="pim-detail-card">
      <h3><i className="fas fa-history"></i> Payment Activity Log</h3>
      <table className="pim-payment-log-table">
        <thead>
          <tr>
            <th>Serial</th>
            <th>Amount</th>
            <th>Discount</th>
            <th>Payment Method</th>
            <th>Cashier</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {[...order.paymentActivityLog].reverse().map((payment, idx) => (
            <tr key={idx}>
              <td className="pim-serial-column">{payment.serial}</td>
              <td className="pim-amount-column">{payment.amount}</td>
              <td className="pim-discount-column">{payment.discount}</td>
              <td className="pim-cashier-column">{payment.paymentMethod}</td>
              <td className="pim-cashier-column">{payment.cashierName}</td>
              <td>{payment.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExitPermitDetailsCard({ order }: OrderCardProps) {
  const permitId = order.exitPermit?.permitId || 'N/A';
  const createDate = order.exitPermit?.createDate || 'N/A';
  const nextServiceDate = order.exitPermit?.nextServiceDate || 'N/A';
  const createdBy = order.exitPermit?.createdBy || 'N/A';
  const collectedBy = order.exitPermit?.collectedBy || 'N/A';
  const collectedByMobile = order.exitPermit?.collectedByMobile || 'N/A';
  
  return (
    <div className="epm-detail-card">
      <h3><i className="fas fa-id-card"></i> Exit Permit Details</h3>
      <div className="epm-card-content">
        <div className="epm-info-item">
          <span className="epm-info-label">Permit ID</span>
          <span className="epm-info-value">{permitId}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Create Date</span>
          <span className="epm-info-value">{createDate}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Next Service Date</span>
          <span className="epm-info-value">{nextServiceDate}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Created By</span>
          <span className="epm-info-value">{createdBy}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Collected By</span>
          <span className="epm-info-value">{collectedBy}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Mobile Number</span>
          <span className="epm-info-value">{collectedByMobile}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Permit Status</span>
          <span className="epm-info-value"><span className={`epm-status-badge ${order.exitPermitStatus === 'Created' ? 'epm-payment-full' : 'epm-payment-unpaid'}`}>{order.exitPermitStatus || 'Not Created'}</span></span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getWorkStatusClass(status: string): string {
  const statusMap = {
    'New Request': 'status-new-request',
    'Inspection': 'status-inspection',
    'Inprogress': 'status-inprogress',
    'Quality Check': 'status-quality-check',
    'Ready': 'status-ready',
    'Completed': 'status-completed',
    'Cancelled': 'status-cancelled'
  };
  return statusMap[status as keyof typeof statusMap] || 'status-inprogress';
}

function getPaymentStatusClass(status: string): string {
  if (status === 'Fully Paid') return 'payment-full';
  if (status === 'Partially Paid') return 'payment-partial';
  return 'payment-unpaid';
}

function getPaymentMethodClass(method: string): string {
  if (!method) return '';
  const normalized = method.toLowerCase();
  if (normalized.includes('cash')) return 'epm-payment-method-cash';
  if (normalized.includes('card')) return 'epm-payment-method-card';
  if (normalized.includes('transfer')) return 'epm-payment-method-transfer';
  return 'epm-payment-method-card';
}

export default JobOrderManagement;
