import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import './ExitPermitManagement.css';
import { getStoredJobOrders, updateCompletedServiceCounts } from './demoData';
import SuccessPopup from './SuccessPopup';
import ErrorPopup from './ErrorPopup';
import PermissionGate from './PermissionGate';

interface JobOrderSummary {
  createDate?: string;
  createdBy?: string;
  expectedDelivery?: string;
}

interface RoadmapStep {
  step: string;
  stepStatus: string;
  startTimestamp?: string | null;
  endTimestamp?: string | null;
  actionBy?: string | null;
  status: string;
}

interface CustomerDetails {
  customerId?: string;
  email?: string;
  address?: string;
  registeredVehicles?: string;
  registeredVehiclesCount?: number;
  completedServicesCount?: number;
  customerSince?: string;
}

interface VehicleDetails {
  vehicleId?: string;
  ownedBy?: string;
  make?: string;
  model?: string;
  year?: string;
  type?: string;
  color?: string;
  vin?: string;
  registrationDate?: string;
}

interface ServiceItem {
  name: string;
  status?: string;
  started?: string | null;
  ended?: string | null;
  duration?: string | null;
  technician?: string;
  notes?: string;
  qualityCheckResult?: string;
  qcResult?: string;
  qcStatus?: string;
  qualityStatus?: string;
}

type ServiceEntry = string | ServiceItem;

interface AdditionalServiceRequest {
  requestId: string;
  requestDate: string;
  requestedService: string;
  status: string;
  customerNotes?: string;
  estimatedPrice?: string;
}

interface Invoice {
  number: string;
  amount: string;
  discount: string;
  status: string;
  paymentMethod?: string | null;
  services?: string[];
}

interface BillingInfo {
  billId?: string;
  totalAmount?: string;
  discount?: string;
  netAmount?: string;
  amountPaid?: string;
  balanceDue?: string;
  paymentMethod?: string | null;
  invoices?: Invoice[];
}

interface ExitPermitInfo {
  permitId: string | null;
  createDate: string | null;
  nextServiceDate: string | null;
  createdBy: string | null;
  collectedBy: string | null;
  collectedByMobile: string | null;
}

interface PaymentActivity {
  serial: number;
  amount: string;
  discount: string;
  paymentMethod?: string | null;
  cashierName: string;
  timestamp: string;
}

interface DocumentEntry {
  name: string;
  type: string;
  category?: string;
  paymentReference?: string;
  uploadDate?: string;
  uploadedBy?: string;
  url?: string;
  fileData?: string;
}

interface JobOrder {
  id: string;
  orderType: string;
  customerName: string;
  mobile: string;
  vehiclePlate: string;
  workStatus: string;
  paymentStatus: string;
  createDate: string;
  exitPermitStatus?: string;
  jobOrderSummary?: JobOrderSummary;
  roadmap?: RoadmapStep[];
  customerDetails?: CustomerDetails;
  vehicleDetails?: VehicleDetails;
  services?: ServiceItem[];
  additionalServiceRequests?: AdditionalServiceRequest[];
  billing?: BillingInfo;
  exitPermit?: ExitPermitInfo;
  paymentActivityLog?: PaymentActivity[];
  documents?: DocumentEntry[];
  customerNotes?: string;
  serviceOrderReference?: {
    services?: ServiceEntry[];
  };
}

interface ExitPermitFormState {
  collectedBy: string;
  mobileNumber: string;
  nextServiceDate: string;
}

interface ExitPermitManagementProps {
  currentUser?: {
    name?: string;
  } | null;
}

interface OrderCardProps {
  order: JobOrder;
}

// Demo Job Orders Data

// Helper Functions
const getWorkStatusClass = (status: string): string => {
  switch(status) {
    case 'Ready': return 'epm-status-completed';
    case 'Cancelled': return 'epm-status-cancelled';
    default: return 'epm-status-inprogress';
  }
};

const getServiceStatusClass = (status: string): string => {
  switch(status) {
    case 'Completed': return 'epm-status-completed';
    case 'Cancelled': return 'epm-status-cancelled';
    default: return 'epm-status-new';
  }
};

const getAdditionalServiceStatusClass = (status: string): string => {
  switch(status) {
    case 'Pending Approval': return 'epm-pending';
    case 'Approved': return 'epm-approved';
    case 'Declined': return 'epm-declined';
    default: return 'epm-pending';
  }
};

const getPaymentMethodClass = (method?: string | null): string => {
  switch(method) {
    case 'Cash': return 'epm-payment-method-cash';
    case 'Card': return 'epm-payment-method-card';
    case 'Transfer': return 'epm-payment-method-transfer';
    case 'Cheque': return 'epm-payment-method-cheque';
    default: return '';
  }
};

const parseDateString = (dateStr: string): number => {
  const parts = dateStr.split(' ');
  if (parts.length === 3) {
    const day = Number.parseInt(parts[0], 10);
    const monthStr = parts[1];
    const year = Number.parseInt(parts[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months.indexOf(monthStr);
    if (!Number.isNaN(day) && !Number.isNaN(year) && month >= 0) {
      return new Date(year, month, day).getTime();
    }
  }
  return Date.now();
};

const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Generate Exit Permit PDF (HTML-based like other modules)
const generateExitPermitPDF = (
  order: JobOrder,
  exitPermit: ExitPermitInfo
): Promise<string> => {
  // Create HTML document matching the system's design pattern
  const exitPermitHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Exit_Permit_${exitPermit.permitId}_${order.id}.html</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20mm; background: #f3f6fb; color: #2c3e50; }
        * { box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        @media print { body { background: white; } }
        
        /* Header */
        .report-header { 
          text-align: center; 
          margin-bottom: 28px; 
          padding: 20px 10px; 
          background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); 
          color: white; 
          border-radius: 12px; 
        }
        .report-logo { 
          width: 60px; 
          height: 60px; 
          border-radius: 50%; 
          object-fit: cover; 
          margin: 0 auto 12px; 
          display: block; 
          border: 3px solid white; 
        }
        .report-header h1 { 
          margin: 0 0 6px 0; 
          font-size: 28px; 
          letter-spacing: 0.3px; 
        }
        .report-header p { 
          margin: 0; 
          font-size: 13px; 
          opacity: 0.9; 
        }

        /* Card Sections */
        .report-card { 
          background: white; 
          border-radius: 10px; 
          padding: 22px; 
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06); 
          margin-bottom: 20px; 
          border-left: 5px solid #3498db; 
        }
        .card-title { 
          font-size: 18px; 
          font-weight: 600; 
          margin: 0 0 18px; 
          padding-bottom: 12px; 
          border-bottom: 2px solid #e6ecf5; 
          display: flex; 
          align-items: center; 
          gap: 10px; 
        }
        .card-title.blue { color: #3498db; }
        .card-title.green { color: #27ae60; }
        .card-title.orange { color: #e67e22; }

        /* Info Grid */
        .info-grid { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 16px; 
        }
        .info-item { 
          display: flex; 
          flex-direction: column; 
        }
        .info-label { 
          font-size: 11px; 
          color: #7f8c8d; 
          font-weight: 600; 
          text-transform: uppercase; 
          letter-spacing: 0.5px; 
          margin-bottom: 4px; 
        }
        .info-value { 
          font-size: 15px; 
          color: #2c3e50; 
          font-weight: 500; 
        }

        /* Full Width Items */
        .full-width { 
          grid-column: span 2; 
        }

        /* Disclaimer Box */
        .disclaimer-box { 
          background: #fff3cd; 
          border: 3px solid #dc3545; 
          border-radius: 10px; 
          padding: 20px; 
          margin: 25px 0; 
        }
        .disclaimer-title { 
          color: #dc3545; 
          font-size: 16px; 
          font-weight: 700; 
          margin: 0 0 12px 0; 
          text-transform: uppercase; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
        }
        .disclaimer-text { 
          color: #2c3e50; 
          font-size: 13px; 
          line-height: 1.6; 
          margin: 0; 
        }

        /* Signature Section */
        .signature-section { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 30px; 
          margin-top: 40px; 
          padding-top: 25px; 
          border-top: 2px solid #e6ecf5; 
        }
        .signature-box { 
          text-align: center; 
        }
        .signature-label { 
          font-weight: 600; 
          color: #2c3e50; 
          margin-bottom: 30px; 
          font-size: 14px; 
        }
        .signature-line { 
          border-top: 2px solid #2c3e50; 
          margin: 0 20px 10px; 
        }
        .signature-date { 
          font-size: 12px; 
          color: #7f8c8d; 
        }

        /* Footer */
        .footer { 
          margin-top: 28px; 
          padding-top: 18px; 
          border-top: 2px solid #e6ecf5; 
          text-align: center; 
          color: #7f8c8d; 
          font-size: 11px; 
        }
        .footer p { 
          margin: 4px 0; 
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="report-header">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPoCJV5AIkhwzaOSgnWDVpRIZITDAkRDsf5A&s" alt="Logo" class="report-logo" />
        <h1>🚗 Vehicle Exit Permit</h1>
        <p>Generated on ${exitPermit.createDate}</p>
      </div>

      <!-- Permit Information -->
      <div class="report-card">
        <h2 class="card-title blue">📋 Permit Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Permit ID</span>
            <span class="info-value">${exitPermit.permitId}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Date Issued</span>
            <span class="info-value">${exitPermit.createDate}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Job Order ID</span>
            <span class="info-value">${order.id}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Authorized By</span>
            <span class="info-value">${exitPermit.createdBy}</span>
          </div>
        </div>
      </div>

      <!-- Customer Information -->
      <div class="report-card">
        <h2 class="card-title blue">👤 Customer Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Customer Name</span>
            <span class="info-value">${order.customerName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Mobile Number</span>
            <span class="info-value">${order.mobile}</span>
          </div>
          ${order.customerDetails?.email ? `
          <div class="info-item full-width">
            <span class="info-label">Email Address</span>
            <span class="info-value">${order.customerDetails.email}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Vehicle Information -->
      <div class="report-card">
        <h2 class="card-title green">🚙 Vehicle Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Plate Number</span>
            <span class="info-value">${order.vehiclePlate}</span>
          </div>
          ${order.vehicleDetails?.make || order.vehicleDetails?.model ? `
          <div class="info-item">
            <span class="info-label">Make / Model</span>
            <span class="info-value">${order.vehicleDetails.make || ''} ${order.vehicleDetails.model || ''}</span>
          </div>
          ` : ''}
          ${order.vehicleDetails?.year ? `
          <div class="info-item">
            <span class="info-label">Year</span>
            <span class="info-value">${order.vehicleDetails.year}</span>
          </div>
          ` : ''}
          ${order.vehicleDetails?.color ? `
          <div class="info-item">
            <span class="info-label">Color</span>
            <span class="info-value">${order.vehicleDetails.color}</span>
          </div>
          ` : ''}
          ${order.vehicleDetails?.vin ? `
          <div class="info-item full-width">
            <span class="info-label">VIN Number</span>
            <span class="info-value">${order.vehicleDetails.vin}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Service Information -->
      <div class="report-card">
        <h2 class="card-title orange">🔧 Service Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Work Status</span>
            <span class="info-value">${order.workStatus}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Payment Status</span>
            <span class="info-value">${order.paymentStatus}</span>
          </div>
          ${exitPermit.nextServiceDate && exitPermit.nextServiceDate !== 'N/A' ? `
          <div class="info-item full-width">
            <span class="info-label">Next Service Date</span>
            <span class="info-value">${exitPermit.nextServiceDate}</span>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Collection Information -->
      <div class="report-card">
        <h2 class="card-title blue">📦 Collection Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Collected By</span>
            <span class="info-value">${exitPermit.collectedBy}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Contact Number</span>
            <span class="info-value">${exitPermit.collectedByMobile}</span>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer-box">
        <div class="disclaimer-title">⚠️ IMPORTANT DISCLAIMER</div>
        <p class="disclaimer-text">
          By Issuing this document, I acknowledge that I have had the opportunity to inspect the vehicle and accept delivery in its current condition. I understand and agree that Rodeo Drive assumes no liability for the operation of this vehicle once it leaves the premises, nor for any personal property left inside the vehicle.
        </p>
      </div>

      <!-- Signature Section -->
      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-label">Customer/Collector Signature</div>
          <div class="signature-line"></div>
          <div class="signature-date">Date: _______________</div>
        </div>
        <div class="signature-box">
          <div class="signature-label">Authorized Personnel</div>
          <div class="signature-line"></div>
          <div class="signature-date">Date: _______________</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>Thank you for choosing Rodeo Drive! This is an electronically generated document.</p>
        <p>Rodeo Drive - Service Management System</p>
        <p>© ${new Date().getFullYear()} All Rights Reserved</p>
      </div>
    </body>
    </html>
  `;

  // Convert HTML to data URL
  const blob = new Blob([exitPermitHTML], { type: 'text/html' });
  const reader = new FileReader();
  
  return new Promise<string>((resolve) => {
    reader.onloadend = () => {
      const dataUrl = reader.result;

      if (typeof dataUrl !== 'string') {
        resolve('');
        return;
      }
      
      // Download the HTML file
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Exit_Permit_${exitPermit.permitId}_${order.id}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(exitPermitHTML);
        printWindow.document.close();
      }
      
      // Resolve with data URL for storage
      resolve(dataUrl);
    };
    reader.readAsDataURL(blob);
  });
};

// Exit Permit Management Component
const ExitPermitManagement = ({ currentUser }: ExitPermitManagementProps) => {
  const [allOrders, setAllOrders] = useState<JobOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JobOrder[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showDetailsScreen, setShowDetailsScreen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<JobOrder | null>(null);
  const [showExitPermitModal, setShowExitPermitModal] = useState(false);
  const [currentOrderForPermit, setCurrentOrderForPermit] = useState<JobOrder | null>(null);
  const [exitPermitForm, setExitPermitForm] = useState<ExitPermitFormState>({
    collectedBy: '',
    mobileNumber: '',
    nextServiceDate: ''
  });
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showExitPermitSuccessPopup, setShowExitPermitSuccessPopup] = useState(false);
  const [successPermitId, setSuccessPermitId] = useState('');
  const [successOrderId, setSuccessOrderId] = useState('');

  useEffect(() => {
    const storedOrders = getStoredJobOrders() as JobOrder[];
    setAllOrders(Array.isArray(storedOrders) ? storedOrders : []);
  }, []);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const isDropdownButton = target?.closest('.btn-action-dropdown');
      const isDropdownMenu = target?.closest('.action-dropdown-menu');
      
      if (!isDropdownButton && !isDropdownMenu) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  // Filter orders for exit permit management
  const filterJobOrdersForExitPermit = (): JobOrder[] => {
    return allOrders.filter((order) => {
      const workStatus = order.workStatus;
      const paymentStatus = order.paymentStatus;
      const exitPermitStatus = order.exitPermitStatus || 'Not Created';
      
      // Ready orders: must be Fully Paid
      const condition1 = workStatus === 'Ready' && 
                        paymentStatus === 'Fully Paid' && 
                        exitPermitStatus === 'Not Created';
      
      // Cancelled orders: must be Unpaid or Fully Refunded
      const condition2 = workStatus === 'Cancelled' && 
                        (paymentStatus === 'Unpaid' || paymentStatus === 'Fully Refunded') &&
                        exitPermitStatus === 'Not Created';
      
      return condition1 || condition2;
    });
  };

  // Initialize filtered results
  useEffect(() => {
    const filtered = filterJobOrdersForExitPermit();
    filtered.sort((a, b) => {
      const dateA = parseDateString(a.createDate);
      const dateB = parseDateString(b.createDate);
      return dateB - dateA;
    });
    setSearchResults(filtered);
    setCurrentPage(1);
  }, [allOrders]);

  // Handle search
  const performSmartSearch = (query: string): JobOrder[] => {
    if (!query.trim()) {
      return filterJobOrdersForExitPermit();
    }
    
    const terms = query.toLowerCase().split(' ').filter((term) => term.trim());
    let results = filterJobOrdersForExitPermit();
    
    terms.forEach((term) => {
      if (term.startsWith('!')) {
        const excludeTerm = term.substring(1);
        if (excludeTerm) {
          results = results.filter(order => !matchesTerm(order, excludeTerm));
        }
      } else {
        results = results.filter(order => matchesTerm(order, term));
      }
    });
    
    return results;
  };

  const matchesTerm = (order: JobOrder, term: string): boolean => {
    return (
      order.id.toLowerCase().includes(term) ||
      order.orderType.toLowerCase().includes(term) ||
      order.customerName.toLowerCase().includes(term) ||
      order.mobile.toLowerCase().includes(term) ||
      order.vehiclePlate.toLowerCase().includes(term) ||
      order.workStatus.toLowerCase().includes(term) ||
      order.paymentStatus.toLowerCase().includes(term) ||
      order.createDate.toLowerCase().includes(term)
    );
  };

  const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    const results = performSmartSearch(query);
    results.sort((a, b) => {
      const dateA = parseDateString(a.createDate);
      const dateB = parseDateString(b.createDate);
      return dateB - dateA;
    });
    setSearchResults(results);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number.parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

  const openDetailsView = (orderId: string) => {
    const order = allOrders.find((o) => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowDetailsScreen(true);
    }
  };

  const closeDetailsView = () => {
    setShowDetailsScreen(false);
    setSelectedOrder(null);
  };

  const openExitPermitModal = (orderId: string) => {
    const order = allOrders.find((o) => o.id === orderId);
    
    if (!order) {
      setErrorMessage('Order not found');
      setShowErrorPopup(true);
      return;
    }
    
    if (order.exitPermitStatus === 'Created') {
      setErrorMessage('Exit permit already exists for this order.');
      setShowErrorPopup(true);
      return;
    }
    
    if (order.workStatus === 'Ready' && order.paymentStatus !== 'Fully Paid') {
      setErrorMessage('Only orders with Payment Status = "Fully Paid" can have exit permits created.');
      setShowErrorPopup(true);
      return;
    }
    
    if (order.workStatus === 'Cancelled' && order.paymentStatus !== 'Unpaid' && order.paymentStatus !== 'Fully Refunded') {
      setErrorMessage('Only cancelled orders with Payment Status = "Unpaid" or "Fully Refunded" can have exit permits created.');
      setShowErrorPopup(true);
      return;
    }
    
    setCurrentOrderForPermit(order);
    const nextServiceDate = new Date();
    nextServiceDate.setMonth(nextServiceDate.getMonth() + 3);
    const formattedDate = nextServiceDate.toISOString().split('T')[0];
    
    setExitPermitForm({
      collectedBy: order.customerName,
      mobileNumber: order.mobile,
      nextServiceDate: order.workStatus === 'Cancelled' ? '' : formattedDate
    });
    setShowExitPermitModal(true);
  };

  const closeExitPermitModal = () => {
    setShowExitPermitModal(false);
    setCurrentOrderForPermit(null);
    setExitPermitForm({
      collectedBy: '',
      mobileNumber: '',
      nextServiceDate: ''
    });
  };

  const handleCancelOrder = () => {
    if (!cancelOrderId) return;

    // Find the order to cancel
    const orderToCancel = allOrders.find(order => order.id === cancelOrderId);
    if (!orderToCancel) return;

    // Check if order is already cancelled
    if (orderToCancel.workStatus === 'Cancelled') {
      setErrorMessage(`Job Order ${cancelOrderId} is already cancelled.`);
      setShowErrorPopup(true);
      setShowCancelConfirmation(false);
      setCancelOrderId(null);
      return;
    }

    // Create a cancelled version of the order
    const cancelledOrder = {
      ...orderToCancel,
      workStatus: 'Cancelled',
      exitPermitStatus: 'Not Created'
    };

    // Update the order status in jobOrders storage
    const updatedOrders = allOrders.map((order) => 
      order.id === cancelOrderId ? cancelledOrder : order
    );
    
    setAllOrders(updatedOrders);
    localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
    updateCompletedServiceCounts();
    
    setShowSuccessPopup(true);
    setShowCancelConfirmation(false);
  };

  const handleCreateExitPermit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!currentOrderForPermit) {
      setErrorMessage('No order selected for exit permit creation.');
      setShowErrorPopup(true);
      return;
    }
    
    const { collectedBy, mobileNumber, nextServiceDate } = exitPermitForm;
    
    if (!collectedBy.trim() || !mobileNumber.trim()) {
      setErrorMessage('Please fill in all required fields.');
      setShowErrorPopup(true);
      return;
    }
    
    if (currentOrderForPermit.workStatus !== 'Cancelled' && !nextServiceDate) {
      setErrorMessage('Please select a next service date.');
      setShowErrorPopup(true);
      return;
    }
    
    const permitId = `PERMIT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const createDate = new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const nextServiceDateDisplay = currentOrderForPermit.workStatus === 'Cancelled' ? 
      'N/A' : formatDateForDisplay(nextServiceDate);
    
    // Create temporary exit permit object for PDF generation
    const exitPermitData = {
      permitId,
      createDate,
      nextServiceDate: nextServiceDateDisplay,
      createdBy: currentUser?.name || 'System User',
      collectedBy,
      collectedByMobile: mobileNumber
    };
    
    // Generate PDF and get the data URL (await since it returns a Promise)
    const pdfDataUrl = await generateExitPermitPDF(currentOrderForPermit, exitPermitData);
    
    const updatedOrders = allOrders.map((order) => {
      if (order.id === currentOrderForPermit.id) {
        // Update the roadmap to mark "Ready for Delivery" step as completed
        const updatedRoadmap = order.roadmap ? order.roadmap.map((step) => {
          if (step.step === 'Ready for Delivery' && step.stepStatus !== 'completed') {
            return {
              ...step,
              stepStatus: 'completed',
              status: 'Completed',
              endTimestamp: step.endTimestamp || createDate
            };
          }
          return step;
        }) : [];

        // Add the "Exit Permit Issued" step
        const finalRoadmap = [
          ...updatedRoadmap,
          {
            step: 'Exit Permit Issued',
            stepStatus: 'completed',
            startTimestamp: createDate,
            endTimestamp: createDate,
            actionBy: currentUser?.name || 'System User',
            status: 'Completed'
          }
        ];

        // Determine final work status based on current status
        // If Ready -> Completed, If Cancelled -> keep Cancelled
        const finalWorkStatus = order.workStatus === 'Cancelled' ? 'Cancelled' : 'Completed';
        
        // Add exit permit HTML document to documents array
        const existingDocuments = Array.isArray(order.documents) ? order.documents : [];
        const exitPermitDocument: DocumentEntry = {
          name: `Exit_Permit_${permitId}_${order.id}.html`,
          type: 'HTML',
          category: 'Exit Permit',
          uploadDate: createDate,
          uploadedBy: currentUser?.name || 'System User',
          fileData: pdfDataUrl
        };

        return {
          ...order,
          workStatus: finalWorkStatus,
          exitPermit: exitPermitData,
          exitPermitStatus: 'Created',
          roadmap: finalRoadmap,
          documents: [...existingDocuments, exitPermitDocument]
        };
      }
      return order;
    });

    setAllOrders(updatedOrders);
    localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
    updateCompletedServiceCounts();
    
    setSuccessPermitId(permitId);
    setSuccessOrderId(currentOrderForPermit.id);
    setShowExitPermitSuccessPopup(true);
    closeExitPermitModal();
  };

  const totalPages = Math.ceil(searchResults.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, searchResults.length);
  const pageData = searchResults.slice(startIndex, endIndex);

  return (
    <div className="epm-container">
      {!showDetailsScreen ? (
        <>
          {/* Header */}
          <div className="epm-header">
            <div className="epm-header-left">
              <h1><i className="fas fa-id-card"></i> Exit Permit Management</h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="epm-main-content">
            {/* Search Section */}
            <section className="epm-search-section">
              <div className="epm-search-container">
                <i className="fas fa-search epm-search-icon"></i>
                <input
                  type="text"
                  className="epm-smart-search-input"
                  placeholder="Search by job order ID, customer name, vehicle plate, etc."
                  value={searchQuery}
                  onChange={handleSearchInput}
                  autoComplete="off"
                />
              </div>
              <div className="epm-search-stats">
                {searchResults.length === 0
                  ? 'No eligible job orders found'
                  : `Showing ${startIndex + 1}-${endIndex} of ${searchResults.length} job orders`}
              </div>
            </section>

            {/* Results Section */}
            <section className="epm-results-section">
              <div className="epm-section-header">
                <h2><i className="fas fa-list"></i> Exit Permit Management</h2>
                <div className="epm-section-header-controls">
                  <select className="epm-pagination-select" value={pageSize} onChange={handlePageSizeChange}>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </select>
                </div>
              </div>

              {searchResults.length === 0 ? (
                <div className="epm-empty-state">
                  <div className="epm-empty-icon">
                    <i className="fas fa-search"></i>
                  </div>
                  <div className="epm-empty-text">No eligible job orders found</div>
                  <div className="epm-empty-subtext">This screen displays only orders eligible for exit permit creation</div>
                </div>
              ) : (
                <>
                  <div className="epm-table-wrapper">
                    <table className="epm-job-order-table">
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
                        {pageData.map(order => (
                          <tr key={order.id}>
                            <td className="epm-date-column">{order.createDate}</td>
                            <td>{order.id}</td>
                            <td><span className={`epm-order-type-badge ${order.orderType === 'New Job Order' ? 'epm-order-type-new-job' : 'epm-order-type-service'}`}>{order.orderType}</span></td>
                            <td>{order.customerName}</td>
                            <td>{order.mobile}</td>
                            <td>{order.vehiclePlate}</td>
                            <td><span className={`epm-status-badge ${getWorkStatusClass(order.workStatus)}`}>{order.workStatus}</span></td>
                            <td><span className={`epm-status-badge ${order.paymentStatus === 'Fully Paid' ? 'epm-payment-full' : order.paymentStatus === 'Partially Paid' ? 'epm-payment-partial' : 'epm-payment-unpaid'}`}>{order.paymentStatus}</span></td>
                            <td>
                              <PermissionGate moduleId="exitpermit" optionId="exitpermit_actions">
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
                                      setDropdownPosition({ top, left });
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

                  {/* Pagination */}
                  <div className="epm-pagination">
                    <button 
                      className="epm-pagination-btn"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="epm-page-numbers">
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
                            className={`epm-pagination-btn ${pageNum === currentPage ? 'epm-active' : ''}`}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      className="epm-pagination-btn"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="epm-footer">
            <p>Service Management System &copy; 2023 | Exit Permit Management Module</p>
          </div>
        </>
      ) : (
        /* Details Screen */
        <div className="epm-details-screen">
          <div className="epm-details-header">
            <div className="epm-details-title-container">
              <h2><i className="fas fa-clipboard-list"></i> Job Order Details - <span>{selectedOrder?.id}</span></h2>
            </div>
            <div className="epm-details-header-actions">
              <button className="epm-btn-close-details" onClick={closeDetailsView}>
                <i className="fas fa-times"></i> Close Details
              </button>
            </div>
          </div>

          <div className="epm-details-body">
            <div className="epm-details-grid">
              {selectedOrder && (
                <>
                  {/* Job Order Summary Card */}
                  <PermissionGate moduleId="exitpermit" optionId="exitpermit_summary">
                    <JobOrderSummaryCard order={selectedOrder} />
                  </PermissionGate>

                  {/* Roadmap Card */}
                  {selectedOrder.roadmap && selectedOrder.roadmap.length > 0 && (
                    <PermissionGate moduleId="exitpermit" optionId="exitpermit_roadmap">
                      <RoadmapCard order={selectedOrder} />
                    </PermissionGate>
                  )}

                  {/* Customer Details Card */}
                  {selectedOrder.customerDetails && (
                    <PermissionGate moduleId="exitpermit" optionId="exitpermit_customer">
                      <CustomerDetailsCard order={selectedOrder} />
                    </PermissionGate>
                  )}

                  {/* Vehicle Details Card */}
                  {selectedOrder.vehicleDetails && (
                    <PermissionGate moduleId="exitpermit" optionId="exitpermit_vehicle">
                      <VehicleDetailsCard order={selectedOrder} />
                    </PermissionGate>
                  )}

                  {/* Services Card */}
                  <PermissionGate moduleId="exitpermit" optionId="exitpermit_services">
                    <ServicesCard order={selectedOrder} />
                  </PermissionGate>

                  {/* Customer Notes Card */}
                  {selectedOrder.customerNotes && (
                    <PermissionGate moduleId="exitpermit" optionId="exitpermit_notes">
                      <CustomerNotesCard order={selectedOrder} />
                    </PermissionGate>
                  )}

                  {/* Quality Check List Card */}
                  {selectedOrder.services && selectedOrder.services.length > 0 && (
                    <PermissionGate moduleId="exitpermit" optionId="exitpermit_quality">
                      <QualityCheckListCard order={selectedOrder} />
                    </PermissionGate>
                  )}

                  {/* Additional Services Cards */}
                  <PermissionGate moduleId="exitpermit" optionId="exitpermit_services">
                    {selectedOrder.additionalServiceRequests && selectedOrder.additionalServiceRequests.map((request, idx) => (
                      <AdditionalServicesRequestCard key={idx} request={request} index={idx + 1} />
                    ))}
                  </PermissionGate>

                  {/* Billing Card */}
                  <PermissionGate moduleId="exitpermit" optionId="exitpermit_billing">
                    <BillingCard order={selectedOrder} />
                  </PermissionGate>

                  {/* Payment Activity Log Card */}
                  {selectedOrder.paymentActivityLog && selectedOrder.paymentActivityLog.length > 0 && (
                    <PermissionGate moduleId="exitpermit" optionId="exitpermit_paymentlog">
                      <PaymentActivityLogCard order={selectedOrder} />
                    </PermissionGate>
                  )}

                  {/* Exit Permit Card */}
                  <PermissionGate moduleId="exitpermit" optionId="exitpermit_exitpermit">
                    <ExitPermitCard order={selectedOrder} />
                  </PermissionGate>

                  {/* Documents Card */}
                  <PermissionGate moduleId="exitpermit" optionId="exitpermit_documents">
                    <DocumentsCard order={selectedOrder} />
                  </PermissionGate>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exit Permit Modal */}
      {showExitPermitModal && (
        <div className="epm-exit-permit-modal">
          <div className="epm-exit-permit-modal-content">
            <h3><i className="fas fa-id-card"></i> Create Exit Permit</h3>
            <form onSubmit={handleCreateExitPermit}>
              <div className="epm-form-group">
                <label>Collected By <span style={{color: 'var(--danger-color)'}}>*</span></label>
                <input
                  type="text"
                  value={exitPermitForm.collectedBy}
                  onChange={(e) => setExitPermitForm({ ...exitPermitForm, collectedBy: e.target.value })}
                  placeholder="Enter name of person collecting the vehicle"
                  required
                />
              </div>
              <div className="epm-form-group">
                <label>Mobile Number <span style={{color: 'var(--danger-color)'}}>*</span></label>
                <input
                  type="tel"
                  value={exitPermitForm.mobileNumber}
                  onChange={(e) => setExitPermitForm({ ...exitPermitForm, mobileNumber: e.target.value })}
                  placeholder="Enter mobile number"
                  required
                />
              </div>
              <div className="epm-form-group">
                <label>Next Service Date {currentOrderForPermit?.workStatus !== 'Cancelled' && <span style={{color: 'var(--danger-color)'}}>*</span>}</label>
                <input
                  type="date"
                  value={exitPermitForm.nextServiceDate}
                  onChange={(e) => setExitPermitForm({ ...exitPermitForm, nextServiceDate: e.target.value })}
                  required={currentOrderForPermit?.workStatus !== 'Cancelled'}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="epm-exit-permit-modal-actions">
                <button type="button" className="epm-btn-cancel-permit" onClick={closeExitPermitModal}>Cancel</button>
                <button type="submit" className="epm-btn-create-permit">
                  <i className="fas fa-check-circle"></i> Create Exit Permit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Dropdown Menu Portal */}
      {activeDropdown && typeof document !== 'undefined' && createPortal(
        <div
          className="action-dropdown-menu show action-dropdown-menu-fixed"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          <PermissionGate moduleId="exitpermit" optionId="exitpermit_viewdetails">
            <button 
              className="dropdown-item view" 
              onClick={() => { 
                openDetailsView(activeDropdown); 
                setActiveDropdown(null); 
              }}
            >
              <i className="fas fa-eye"></i> View Details
            </button>
          </PermissionGate>
          <PermissionGate moduleId="exitpermit" optionId="exitpermit_create">
            <>
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item create-permit" 
                onClick={() => { 
                  openExitPermitModal(activeDropdown); 
                  setActiveDropdown(null); 
                }}
                disabled={(() => {
                  const order = pageData.find(o => o.id === activeDropdown);
                  if (!order) return true;
                  const isReady = order.workStatus === 'Ready' && order.paymentStatus === 'Fully Paid';
                  const isCancelled = order.workStatus === 'Cancelled' && (order.paymentStatus === 'Unpaid' || order.paymentStatus === 'Fully Refunded');
                  return !(isReady || isCancelled);
                })()}
              >
                <i className="fas fa-id-card"></i> Create Exit Permit
              </button>
            </>
          </PermissionGate>
          <PermissionGate moduleId="exitpermit" optionId="exitpermit_cancelorder">
            <>
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item delete" 
                onClick={() => { 
                  setCancelOrderId(activeDropdown); 
                  setShowCancelConfirmation(true);
                  setActiveDropdown(null); 
                }}
              >
                <i className="fas fa-times-circle"></i> Cancel Order
              </button>
            </>
          </PermissionGate>
        </div>,
        document.body
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

      {/* Success Popup for Cancel Order */}
      {showSuccessPopup && (
        <SuccessPopup 
          isVisible={true}
          onClose={() => {
            setShowSuccessPopup(false);
            setCancelOrderId(null);
          }}
          message={
            <>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4CAF50', display: 'block', marginBottom: '15px' }}>
                <i className="fas fa-check-circle"></i> Order ID Cancelled Successfully!
              </span>
              <span style={{ fontSize: '1.1rem', color: '#333', display: 'block', marginTop: '10px' }}>
                <strong>Job Order ID:</strong> <span style={{ color: '#2196F3', fontWeight: '600' }}>{cancelOrderId}</span>
              </span>
              <span style={{ fontSize: '0.95rem', color: '#666', display: 'block', marginTop: '8px' }}>
                This order has been moved to Job Order History
              </span>
            </>
          }
        />
      )}

      {/* Success Popup for Exit Permit Creation */}
      {showExitPermitSuccessPopup && (
        <SuccessPopup 
          isVisible={true}
          onClose={() => {
            setShowExitPermitSuccessPopup(false);
            setSuccessPermitId('');
            setSuccessOrderId('');
          }}
          message={
            <>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4CAF50', display: 'block', marginBottom: '15px' }}>
                <i className="fas fa-check-circle"></i> Exit Permit Created Successfully!
              </span>
              <span style={{ fontSize: '1.1rem', color: '#333', display: 'block', marginTop: '10px' }}>
                <strong>Permit ID:</strong> <span style={{ color: '#2196F3', fontWeight: '600' }}>{successPermitId}</span>
              </span>
              <span style={{ fontSize: '1.1rem', color: '#333', display: 'block', marginTop: '10px' }}>
                <strong>Job Order ID:</strong> <span style={{ color: '#2196F3', fontWeight: '600' }}>{successOrderId}</span>
              </span>
              <span style={{ fontSize: '0.95rem', color: '#666', display: 'block', marginTop: '8px' }}>
                This order has been moved to Job Order History
              </span>
            </>
          }
        />
      )}

      {/* Error Popup */}
      {showErrorPopup && (
        <ErrorPopup 
          isVisible={true}
          onClose={() => setShowErrorPopup(false)}
          message={errorMessage}
        />
      )}
    </div>
  );
};

// Card Components
const JobOrderSummaryCard = ({ order }: OrderCardProps) => {
  const orderTypeClass = order.orderType === 'New Job Order' ? 'epm-order-type-new-job' : 'epm-order-type-service';
  
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
          <span className="epm-info-value"><span className={`epm-order-type-badge ${orderTypeClass}`}>{order.orderType}</span></span>
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
          <span className="epm-info-value"><span className={`epm-status-badge ${order.paymentStatus === 'Fully Paid' ? 'epm-payment-full' : order.paymentStatus === 'Partially Paid' ? 'epm-payment-partial' : 'epm-payment-unpaid'}`}>{order.paymentStatus}</span></span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Exit Permit Status</span>
          <span className="epm-info-value"><span className={`epm-status-badge ${order.exitPermitStatus === 'Created' ? 'epm-permit-created' : 'epm-permit-not-created'}`}>{order.exitPermitStatus || 'Not Created'}</span></span>
        </div>
      </div>
    </div>
  );
};

const RoadmapCard = ({ order }: OrderCardProps) => {
  if (!order.roadmap || order.roadmap.length === 0) return null;

  const formatStepStatus = (status: string): string => {
    switch (status) {
      case 'New': return 'epm-status-new';
      case 'Completed': return 'epm-status-completed';
      case 'InProgress': return 'epm-status-inprogress';
      case 'Pending': return 'epm-status-pending';
      case 'Upcoming': return 'epm-status-pending';
      default: return 'epm-status-pending';
    }
  };

  const getStepStatusClass = (stepStatus: string): string => {
    switch (stepStatus) {
      case 'completed': return 'epm-step-completed';
      case 'Completed': return 'epm-step-completed';
      case 'Active': return 'epm-step-active';
      case 'InProgress': return 'epm-step-active';
      case 'active': return 'epm-step-active';
      case 'inprogress': return 'epm-step-active';
      case 'Pending': return 'epm-step-pending';
      case 'pending': return 'epm-step-pending';
      case 'Cancelled': return 'epm-step-cancelled';
      case 'cancelled': return 'epm-step-cancelled';
      case 'Upcoming': return 'epm-step-upcoming';
      case 'upcoming': return 'epm-step-upcoming';
      default: return 'epm-step-upcoming';
    }
  };

  const getStepIcon = (stepStatus: string): string => {
    switch (stepStatus) {
      case 'Completed':
      case 'completed': 
        return 'fas fa-check-circle';
      case 'Active':
      case 'active':
      case 'InProgress':
      case 'inprogress': 
        return 'fas fa-play-circle';
      case 'Pending':
      case 'pending': 
        return 'fas fa-clock';
      case 'Cancelled':
      case 'cancelled': 
        return 'fas fa-times-circle';
      case 'Upcoming':
      case 'upcoming': 
        return 'fas fa-circle';
      default: 
        return 'fas fa-circle';
    }
  };

  return (
    <div className="epm-detail-card">
      <h3><i className="fas fa-map-signs"></i> Job Order Roadmap</h3>
      <div className="epm-roadmap-container">
        <div className="epm-roadmap-steps">
          {order.roadmap.map((step: RoadmapStep, idx: number) => (
            <div key={idx} className={`epm-roadmap-step ${getStepStatusClass(step.stepStatus)}`}>
              <div className="epm-step-icon">
                <i className={getStepIcon(step.stepStatus)}></i>
              </div>
              <div className="epm-step-content">
                <div className="epm-step-header">
                  <div className="epm-step-name">{step.step}</div>
                  <span className={`epm-status-badge ${formatStepStatus(step.status)}`}>{step.status}</span>
                </div>
                <div className="epm-step-details">
                  <div className="epm-step-detail">
                    <span className="epm-detail-label">Started</span>
                    <span className="epm-detail-value">{step.startTimestamp || 'Not started'}</span>
                  </div>
                  <div className="epm-step-detail">
                    <span className="epm-detail-label">Ended</span>
                    <span className="epm-detail-value">{step.endTimestamp || 'Not completed'}</span>
                  </div>
                  <div className="epm-step-detail">
                    <span className="epm-detail-label">Action By</span>
                    <span className="epm-detail-value">{step.actionBy || 'Not assigned'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CustomerDetailsCard = ({ order }: OrderCardProps) => {
  return (
    <div className="epm-detail-card">
      <h3><i className="fas fa-user"></i> Customer Information</h3>
      <div className="epm-card-content">
        <div className="epm-info-item">
          <span className="epm-info-label">Customer ID</span>
          <span className="epm-info-value">{order.customerDetails?.customerId || 'New Customer'}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Customer Name</span>
          <span className="epm-info-value">{order.customerName}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Mobile Number</span>
          <span className="epm-info-value">{order.mobile || 'Not provided'}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Email Address</span>
          <span className="epm-info-value">{order.customerDetails?.email || 'Not provided'}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Home Address</span>
          <span className="epm-info-value">{order.customerDetails?.address || 'Not provided'}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Registered Vehicles</span>
          <span className="epm-info-value">
            <span className="count-badge">{order.customerDetails?.registeredVehiclesCount ?? 1} {(order.customerDetails?.registeredVehiclesCount ?? 1) === 1 ? 'vehicle' : 'vehicles'}</span>
          </span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Completed Services</span>
          <span className="epm-info-value">
            <span className="count-badge">{order.customerDetails?.completedServicesCount ?? 0} {(order.customerDetails?.completedServicesCount ?? 0) === 1 ? 'service' : 'services'}</span>
          </span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Customer Since</span>
          <span className="epm-info-value">{order.customerDetails?.customerSince || 'Not specified'}</span>
        </div>
      </div>
    </div>
  );
};

const VehicleDetailsCard = ({ order }: OrderCardProps) => {
  return (
    <div className="epm-detail-card">
      <h3><i className="fas fa-car"></i> Vehicle Details</h3>
      <div className="epm-card-content">
        <div className="epm-info-item">
          <span className="epm-info-label">Vehicle Unique ID</span>
          <span className="epm-info-value">{order.vehicleDetails?.vehicleId}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Owned By</span>
          <span className="epm-info-value">{order.vehicleDetails?.ownedBy}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Make</span>
          <span className="epm-info-value">{order.vehicleDetails?.make}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Model</span>
          <span className="epm-info-value">{order.vehicleDetails?.model}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Year</span>
          <span className="epm-info-value">{order.vehicleDetails?.year}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Vehicle Type</span>
          <span className="epm-info-value">{order.vehicleDetails?.type}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Color</span>
          <span className="epm-info-value">{order.vehicleDetails?.color}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Plate Number</span>
          <span className="epm-info-value">{order.vehiclePlate}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">VIN</span>
          <span className="epm-info-value">{order.vehicleDetails?.vin}</span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Registration Date</span>
          <span className="epm-info-value">{order.vehicleDetails?.registrationDate}</span>
        </div>
      </div>
    </div>
  );
};

const DocumentsCard = ({ order }: OrderCardProps) => {
  const documents = Array.isArray(order.documents) ? order.documents : []

  if (documents.length === 0) return null;

  return (
    <div className="epm-detail-card">
      <h3><i className="fas fa-folder-open"></i> Documents</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {documents.map((doc: DocumentEntry, idx: number) => (
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
            <PermissionGate moduleId="exitpermit" optionId="exitpermit_download">
              <button
                onClick={() => {
                  const downloadUrl: string = doc.fileData ?? doc.url ?? '';
                  if (!downloadUrl) return;

                  const link = document.createElement('a');
                  link.href = downloadUrl;
                  link.download = doc.name || 'document';
                  link.click();
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
            </PermissionGate>
          </div>
        ))}
      </div>
    </div>
  );
};

const ServicesCard = ({ order }: OrderCardProps) => {
  const combinedServices: ServiceEntry[] = order.orderType === 'Service Order'
    ? [...(order.serviceOrderReference?.services || []), ...(order.services || [])]
    : (order.services || []);

  return (
    <div className="epm-detail-card">
      <h3><i className="fas fa-tasks"></i> Services Summary</h3>
      <div className="epm-services-list">
        {combinedServices.length > 0 ? (
          combinedServices.map((service: ServiceEntry, idx: number) => (
            <div key={idx} className="epm-service-item">
              <div className="epm-service-header">
                <span className="epm-service-name">{typeof service === 'string' ? service : service.name}</span>
                <span className={`epm-status-badge ${getServiceStatusClass(typeof service === 'string' ? 'New' : service.status || 'New')}`}>{typeof service === 'string' ? 'New' : service.status || 'New'}</span>
              </div>
              <div className="epm-service-timeline">
                <div className="epm-timeline-item">
                  <i className="fas fa-play-circle"></i>
                  <span className="epm-timeline-label">Started:</span>
                  <span className="epm-timeline-value">{typeof service === 'string' ? 'Not started' : (service.started || 'Not started')}</span>
                </div>
                <div className="epm-timeline-item">
                  <i className="fas fa-flag-checkered"></i>
                  <span className="epm-timeline-label">Ended:</span>
                  <span className="epm-timeline-value">{typeof service === 'string' ? 'Not completed' : (service.ended || 'Not completed')}</span>
                </div>
                <div className="epm-timeline-item">
                  <i className="fas fa-clock"></i>
                  <span className="epm-timeline-label">Duration:</span>
                  <span className="epm-timeline-value">{typeof service === 'string' ? 'N/A' : (service.duration || 'N/A')}</span>
                </div>
                <div className="epm-timeline-item">
                  <i className="fas fa-user-cog"></i>
                  <span className="epm-timeline-label">Technician:</span>
                  <span className="epm-timeline-value">{typeof service === 'string' ? 'Not assigned' : service.technician || 'Not assigned'}</span>
                </div>
              </div>
              {typeof service !== 'string' && service.notes && (
                <div className="epm-service-notes">
                  <span className="epm-notes-label">Notes:</span>
                  <span className="epm-notes-value">{service.notes}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="epm-service-item"><em>No services recorded</em></div>
        )}
      </div>
    </div>
  );
};

interface AdditionalServicesRequestCardProps {
  request: AdditionalServiceRequest;
  index: number;
}

const AdditionalServicesRequestCard = ({ request, index }: AdditionalServicesRequestCardProps) => {
  const statusClass = getAdditionalServiceStatusClass(request.status);
  
  return (
    <div className={`epm-additional-services epm-${statusClass}`}>
      <div className="epm-additional-header">
        Additional Services Request {index > 1 ? `#${index}` : ''}
      </div>
      <div className="epm-card-body">
        <div className="epm-info-item">
          <div className="epm-info-label">Request ID</div>
          <div className="epm-info-value">{request.requestId}</div>
        </div>
        <div className="epm-info-item">
          <div className="epm-info-label">Request Date</div>
          <div className="epm-info-value">{request.requestDate}</div>
        </div>
        <div className="epm-info-item">
          <div className="epm-info-label">Requested Service</div>
          <div className="epm-info-value">{request.requestedService}</div>
        </div>
        <div className="epm-info-item">
          <div className="epm-info-label">Status</div>
          <div className="epm-info-value" style={{fontWeight: 600}}>
            {request.status}
          </div>
        </div>
        <div className="epm-info-item">
          <div className="epm-info-label">Customer Notes</div>
          <div className="epm-info-value">{request.customerNotes}</div>
        </div>
        <div className="epm-info-item">
          <div className="epm-info-label">Estimated Price</div>
          <div className="epm-info-value">{request.estimatedPrice}</div>
        </div>
      </div>
    </div>
  );
};

const CustomerNotesCard = ({ order }: OrderCardProps) => {
  return (
    <div className="epm-detail-card">
      <h3><i className="fas fa-sticky-note"></i> Customer Notes / Comments</h3>
      <div className="epm-card-content">
        <div className="epm-info-item" style={{ display: 'block' }}>
          <div style={{
            padding: '15px',
            backgroundColor: '#fffbea',
            borderLeft: '4px solid #f59e0b',
            borderRadius: '6px',
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#333',
            whiteSpace: 'pre-wrap'
          }}>
            <i className="fas fa-comment-dots" style={{ marginRight: '8px', color: '#f59e0b' }}></i>
            {order.customerNotes}
          </div>
        </div>
      </div>
    </div>
  );
};

const BillingCard = ({ order }: OrderCardProps) => {
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
          {order.billing.invoices.map((invoice: Invoice, idx: number) => (
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
                {invoice.services?.map((service: string, sidx: number) => (
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
};

const PaymentActivityLogCard = ({ order }: OrderCardProps) => {
  if (!order.paymentActivityLog || order.paymentActivityLog.length === 0) return null;

  return (
    <div className="epm-detail-card">
      <h3><i className="fas fa-history"></i> Payment Activity Log</h3>
      <div className="epm-payment-log-table-wrapper">
        <table className="epm-payment-log-table">
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
            {[...order.paymentActivityLog].reverse().map((payment: PaymentActivity, idx: number) => (
              <tr key={idx}>
                <td className="epm-serial-column">{payment.serial}</td>
                <td className="epm-amount-column">{payment.amount}</td>
                <td className="epm-discount-column">{payment.discount}</td>
                <td className="epm-payment-method-column">
                  <span className={`epm-payment-method-badge ${getPaymentMethodClass(payment.paymentMethod)}`}>
                    {payment.paymentMethod}
                  </span>
                </td>
                <td className="epm-cashier-column">{payment.cashierName}</td>
                <td className="epm-timestamp-column">{payment.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ExitPermitCard = ({ order }: OrderCardProps) => {
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
};

const QualityCheckListCard = ({ order }: OrderCardProps) => {
  const services: ServiceEntry[] = order.orderType === 'Service Order'
    ? [...(order.serviceOrderReference?.services || []), ...(order.services || [])]
    : (order.services || []);

  const getQualityCheckResult = (service: ServiceEntry): string | null => {
    if (service && typeof service === 'object') {
      return service.qualityCheckResult || service.qcResult || service.qcStatus || service.qualityStatus || null;
    }
    return null;
  };

  return (
    <div className="epm-detail-card" style={{ backgroundColor: '#e8f4f1', borderLeft: '4px solid #16a085' }}>
      <h3><i className="fas fa-clipboard-check"></i> Quality Check List</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {services.length > 0 ? (
          services.map((service: ServiceEntry, idx: number) => {
            const serviceName = typeof service === 'string' ? service : service.name;
            const result = getQualityCheckResult(service) || 'Not Evaluated';
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
};

export default ExitPermitManagement;
