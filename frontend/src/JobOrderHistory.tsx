import { useState, useEffect } from 'react';
import './JobOrderHistory.css';
import { getStoredJobOrders } from './demoData';
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
  name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  registeredVehiclesCount?: number;
  registeredVehicles?: string;
  completedServicesCount?: number;
  customerSince?: string;
}

interface VehicleDetails {
  vehicleId: string;
  ownedBy?: string;
  make?: string;
  model?: string;
  year?: string;
  type?: string;
  color?: string;
  plateNumber?: string;
  vin?: string;
  completedServices?: number;
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

interface InvoiceInfo {
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
  invoices?: InvoiceInfo[];
}

interface ExitPermitInfo {
  permitId?: string;
  createDate?: string;
  nextServiceDate?: string;
  createdBy?: string;
  collectedBy?: string;
  collectedByMobile?: string;
}

interface PaymentActivity {
  serial: number;
  amount: string;
  discount: string;
  paymentMethod?: string | null;
  cashierName: string;
  timestamp: string;
}

interface DocumentInfo {
  name: string;
  type: string;
  category?: string;
  paymentReference?: string;
  uploadDate?: string;
  uploadedBy?: string;
  url?: string;
  fileData?: string;
}

interface ServiceOrderReference {
  services?: ServiceEntry[];
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
  jobOrderSummary?: JobOrderSummary;
  roadmap?: RoadmapStep[];
  customerDetails?: CustomerDetails;
  vehicleDetails: VehicleDetails;
  services?: ServiceEntry[];
  additionalServiceRequests?: AdditionalServiceRequest[];
  billing: BillingInfo;
  exitPermit?: ExitPermitInfo;
  paymentActivityLog?: PaymentActivity[];
  serviceOrderReference?: ServiceOrderReference | null;
  qualityCheckResults?: string[] | Record<string, string>;
  customerNotes?: string | null;
  documents?: DocumentInfo[];
}

interface JobOrderHistoryProps {
  navigationData?: {
    openDetails?: boolean;
    jobOrder?: JobOrder;
    source?: string;
    returnToVehicle?: string;
  };
  onClearNavigation?: () => void;
  onNavigateBack?: (source?: string, vehicleId?: string) => void;
}

interface ExportDates {
  startDate: string;
  endDate: string;
}

interface JobOrderDetailsViewProps {
  order: JobOrder;
  onClose: () => void;
}

interface OrderCardProps {
  order: JobOrder;
}

interface PaymentActivityLogCardProps {
  payments: PaymentActivity[];
}

// Demo data generator - exported for use in other modules
export const generateDemoJobOrders = (): JobOrder[] => {
  const demoJobOrders: JobOrder[] = [
    {
      id: 'JO-2023-001245',
      orderType: 'New Job Order',
      customerName: 'Ahmed Hassan',
      mobile: '+971 50 123 4567',
      vehiclePlate: 'DXB-12345',
      workStatus: 'Completed',
      paymentStatus: 'Fully Paid',
      createDate: '15 Oct 2023',
      
      jobOrderSummary: {
        createDate: '15 Oct 2023, 10:30 AM',
        createdBy: 'John Smith (Sales Agent)',
        expectedDelivery: '18 Oct 2023, 05:00 PM'
      },
      
      roadmap: [
        {
          step: 'New Request',
          stepStatus: 'completed',
          startTimestamp: '15 Oct 2023, 10:30 AM',
          endTimestamp: '15 Oct 2023, 02:15 PM',
          actionBy: 'John Smith (Sales Agent)',
          status: 'Completed'
        },
        {
          step: 'Inspection',
          stepStatus: 'completed',
          startTimestamp: '15 Oct 2023, 02:15 PM',
          endTimestamp: '16 Oct 2023, 09:00 AM',
          actionBy: 'Michael Brown (Inspector)',
          status: 'Completed'
        },
        {
          step: 'In Progress',
          stepStatus: 'completed',
          startTimestamp: '16 Oct 2023, 09:00 AM',
          endTimestamp: '17 Oct 2023, 03:30 PM',
          actionBy: 'Sarah Miller (Technician)',
          status: 'Completed'
        },
        {
          step: 'Quality Check',
          stepStatus: 'completed',
          startTimestamp: '17 Oct 2023, 03:30 PM',
          endTimestamp: '18 Oct 2023, 10:00 AM',
          actionBy: 'Robert Chen (Quality Inspector)',
          status: 'Completed'
        },
        {
          step: 'Ready for Delivery',
          stepStatus: 'completed',
          startTimestamp: '18 Oct 2023, 10:00 AM',
          endTimestamp: '18 Oct 2023, 03:15 PM',
          actionBy: 'Lisa Park (Supervisor)',
          status: 'Completed'
        }
      ],
      
      customerDetails: {
        customerId: 'CUST-2023-001245',
        name: 'Ahmed Hassan',
        mobile: '+971 50 123 4567',
        email: 'ahmed.hassan@example.com',
        address: 'Building 45, Street 12, Dubai',
        registeredVehiclesCount: 3,
        registeredVehicles: '3 vehicles',
        completedServicesCount: 8,
        customerSince: '12 Mar 2022'
      },
      
      vehicleDetails: {
        vehicleId: 'VEH-001245',
        ownedBy: 'Ahmed Hassan',
        make: 'Toyota',
        model: 'Camry',
        year: '2022',
        type: 'Sedan',
        color: 'Silver Metallic',
        plateNumber: 'ABC-1245',
        vin: 'JTDKBRFU9H3045678',
        completedServices: 12,
        registrationDate: '15 Mar 2022'
      },
      
      services: [
        {
          name: 'Oil Change & Filter Replacement',
          status: 'Completed',
          started: '16 Oct 2023, 09:00 AM',
          ended: '16 Oct 2023, 10:30 AM',
          duration: '1 hour 30 minutes',
          technician: 'Michael Brown',
          notes: 'Standard synthetic oil used. Filter replaced with OEM part.'
        },
        {
          name: 'Brake Pad Replacement',
          status: 'Completed',
          started: '16 Oct 2023, 11:00 AM',
          ended: '16 Oct 2023, 01:30 PM',
          duration: '2 hours 30 minutes',
          technician: 'Sarah Miller',
          notes: 'Front brake pads replacement completed.'
        }
      ],
      
      additionalServiceRequests: [
        {
          requestId: 'ASR-2023-001245-1',
          requestDate: 'March 16, 2024 2:15 PM',
          requestedService: 'Windshield Wiper Replacement',
          status: 'Approved',
          customerNotes: 'Customer noticed wipers streaking during light rain',
          estimatedPrice: '$45.00'
        }
      ],
      
      billing: {
        billId: 'BILL-2023-001245',
        totalAmount: 'QAR 2,150.00',
        discount: 'QAR 150.00',
        netAmount: 'QAR 2,000.00',
        amountPaid: 'QAR 2,000.00',
        balanceDue: 'QAR 0.00',
        paymentMethod: 'Card',
        invoices: [
          {
            number: 'INV-2023-001245-1',
            amount: 'QAR 1,400.00',
            discount: 'QAR 100.00',
            status: 'Paid',
            paymentMethod: 'Card',
            services: ['Oil Change & Filter Replacement', 'Brake Pad Replacement']
          },
          {
            number: 'INV-2023-001245-2',
            amount: 'QAR 750.00',
            discount: 'QAR 50.00',
            status: 'Paid',
            paymentMethod: 'Card',
            services: ['AC Vent Cleaning']
          }
        ]
      },
      
      exitPermit: {
        permitId: 'PERMIT-2023-001245',
        createDate: '18 Oct 2023, 03:15 PM',
        nextServiceDate: '15 Apr 2024',
        createdBy: 'Michael Brown (Supervisor)',
        collectedBy: 'Ahmed Hassan (Customer)',
        collectedByMobile: '+971 50 123 4567'
      },
      
      paymentActivityLog: [
        {
          serial: 1,
          amount: 'QAR 1,000.00',
          discount: 'QAR 100.00',
          paymentMethod: 'Card',
          cashierName: 'Sarah Johnson',
          timestamp: '16 Oct 2023, 02:30 PM'
        },
        {
          serial: 2,
          amount: 'QAR 1,000.00',
          discount: 'QAR 50.00',
          paymentMethod: 'Card',
          cashierName: 'Sarah Johnson',
          timestamp: '17 Oct 2023, 11:45 AM'
        }
      ]
    },
    {
      id: 'JO-2023-001244',
      orderType: 'Service Order',
      customerName: 'Sarah Johnson',
      mobile: '+971 55 987 6543',
      vehiclePlate: 'SHJ-AB789',
      workStatus: 'Cancelled',
      paymentStatus: 'Fully Refunded',
      createDate: '14 Oct 2023',
      
      jobOrderSummary: {
        createDate: '14 Oct 2023, 02:15 PM',
        createdBy: 'Emma Wilson (Sales Agent)',
        expectedDelivery: '17 Oct 2023, 06:00 PM'
      },
      
      roadmap: [
        {
          step: 'New Request',
          stepStatus: 'completed',
          startTimestamp: '14 Oct 2023, 02:15 PM',
          endTimestamp: '14 Oct 2023, 04:30 PM',
          actionBy: 'Emma Wilson (Sales Agent)',
          status: 'Completed'
        }
      ],
      
      customerDetails: {
        customerId: 'CUST-2023-001244',
        name: 'Sarah Johnson',
        mobile: '+971 52 987 6543',
        email: 'sarah.j@example.com',
        address: 'Building 78, Street 23, Sharjah',
        registeredVehiclesCount: 2,
        registeredVehicles: '2 vehicles',
        completedServicesCount: 5,
        customerSince: '10 Feb 2023'
      },
      
      vehicleDetails: {
        vehicleId: 'VEH-001244',
        ownedBy: 'Sarah Johnson',
        make: 'BMW',
        model: 'X5',
        year: '2021',
        type: 'SUV',
        color: 'Black Sapphire',
        plateNumber: 'XYZ-1244',
        vin: 'WBAJA5C5XJG123456',
        completedServices: 9,
        registrationDate: '15 Feb 2023'
      },
      
      services: [],
      billing: {
        billId: 'BILL-2023-001244',
        totalAmount: 'QAR 450.00',
        discount: 'QAR 0.00',
        netAmount: 'QAR 450.00',
        amountPaid: 'QAR 0.00',
        balanceDue: 'QAR 450.00',
        paymentMethod: null,
        invoices: []
      },
      
      exitPermit: {
        permitId: 'N/A',
        createDate: 'N/A',
        nextServiceDate: 'N/A',
        createdBy: 'N/A',
        collectedBy: 'N/A',
        collectedByMobile: 'N/A'
      },
      
      paymentActivityLog: []
    },
    {
      id: 'JO-2023-001243',
      orderType: 'New Job Order',
      customerName: 'Mohammed Ali',
      mobile: '+971 52 456 7890',
      vehiclePlate: 'AUH-XY456',
      workStatus: 'Completed',
      paymentStatus: 'Partially Paid',
      createDate: '13 Oct 2023',
      
      jobOrderSummary: {
        createDate: '13 Oct 2023, 09:45 AM',
        createdBy: 'Robert Chen (Sales Agent)',
        expectedDelivery: '16 Oct 2023, 04:00 PM'
      },
      
      roadmap: [
        {
          step: 'New Request',
          stepStatus: 'completed',
          startTimestamp: '13 Oct 2023, 09:45 AM',
          endTimestamp: '13 Oct 2023, 01:30 PM',
          actionBy: 'Robert Chen (Sales Agent)',
          status: 'Completed'
        }
      ],
      
      customerDetails: {
        customerId: 'CUST-2023-001243',
        name: 'Mohammed Ali',
        mobile: '+971 50 555 1234',
        email: 'm.ali@example.com',
        address: 'Building 32, Street 15, Abu Dhabi',
        registeredVehiclesCount: 1,
        registeredVehicles: '1 vehicle',
        completedServicesCount: 3,
        customerSince: '05 Jan 2023'
      },
      
      vehicleDetails: {
        vehicleId: 'VEH-001243',
        ownedBy: 'Mohammed Ali',
        make: 'Mercedes',
        model: 'C300',
        year: '2023',
        type: 'Sedan',
        color: 'White',
        plateNumber: 'DEF-1243',
        vin: 'WDDWF8EB5PR123456',
        completedServices: 6,
        registrationDate: '10 Jan 2023'
      },
      
      services: [
        {
          name: 'Annual Maintenance Service',
          status: 'Completed',
          started: '14 Oct 2023, 08:30 AM',
          ended: '14 Oct 2023, 03:45 PM',
          duration: '7 hours 15 minutes',
          technician: 'Ahmed Rahman',
          notes: 'Complete annual service as per manufacturer schedule.'
        }
      ],
      
      billing: {
        billId: 'BILL-2023-001243',
        totalAmount: 'QAR 3,200.00',
        discount: 'QAR 200.00',
        netAmount: 'QAR 3,000.00',
        amountPaid: 'QAR 1,500.00',
        balanceDue: 'QAR 1,500.00',
        paymentMethod: 'Cash',
        invoices: []
      },
      
      exitPermit: {
        permitId: 'PERMIT-2023-001243',
        createDate: '15 Oct 2023, 05:30 PM',
        nextServiceDate: '13 Jan 2024',
        createdBy: 'Sarah Miller (Supervisor)',
        collectedBy: 'Mohammed Ali (Customer)',
        collectedByMobile: '+971 52 456 7890'
      },
      
      paymentActivityLog: [
        {
          serial: 1,
          amount: 'QAR 1,500.00',
          discount: 'QAR 150.00',
          paymentMethod: 'Cash',
          cashierName: 'Robert Chen',
          timestamp: '15 Oct 2023, 04:15 PM'
        }
      ]
    }
  ];

  // Add more records with proper vehicle IDs matching the vehicle management data
  const orderTypes = ['New Job Order', 'Service Order'];
  const statuses = ['Completed', 'Cancelled'];
  const vehicleIds = [
    'VEH-001260', 'VEH-001259', 'VEH-001258', 'VEH-001257', 'VEH-001256',
    'VEH-001255', 'VEH-001254', 'VEH-001253', 'VEH-001252', 'VEH-001251',
    'VEH-001250', 'VEH-001249', 'VEH-001248', 'VEH-001247', 'VEH-001246',
    'VEH-001245', 'VEH-001244', 'VEH-001243', 'VEH-001242', 'VEH-001241'
  ];
  
  // Update the first 3 template orders with correct vehicle IDs
  demoJobOrders[0].vehicleDetails.vehicleId = 'VEH-001260';
  demoJobOrders[1].vehicleDetails.vehicleId = 'VEH-001259';
  demoJobOrders[2].vehicleDetails.vehicleId = 'VEH-001258';
  
  for (let i = 1; i <= 15; i++) {
    const template = demoJobOrders[i % 3];
    const statusIndex = i % statuses.length;
    const orderTypeIndex = i % orderTypes.length;
    const vehicleId = vehicleIds[i % vehicleIds.length];
    
    const newOrder: JobOrder = JSON.parse(JSON.stringify(template));
    newOrder.id = `JO-2023-00${1242 - i}`;
    newOrder.orderType = orderTypes[orderTypeIndex];
    newOrder.customerName = `Customer ${1242 - i}`;
    newOrder.workStatus = statuses[statusIndex];
    newOrder.createDate = `${15 - (i % 15)} Oct 2023`;
    newOrder.vehicleDetails.vehicleId = vehicleId;
    
    demoJobOrders.push(newOrder);
  }
  
  // Add more completed services for the first few vehicles to ensure we have data
  for (let i = 0; i < 10; i++) {
    const template = demoJobOrders[i % 3];
    const vehicleId = vehicleIds[i % 10]; // Focus on first 10 vehicles
    
    const newOrder: JobOrder = JSON.parse(JSON.stringify(template));
    newOrder.id = `JO-2024-00${100 + i}`;
    newOrder.orderType = orderTypes[i % 2];
    newOrder.workStatus = 'Completed'; // Always completed
    newOrder.createDate = `${20 + (i % 10)} Jan 2024`;
    newOrder.vehicleDetails.vehicleId = vehicleId;
    newOrder.paymentStatus = ['Fully Paid', 'Partially Paid'][i % 2];
    newOrder.billing.netAmount = `QAR ${(1500 + Math.floor(Math.random() * 1000))}.00`;
    
    demoJobOrders.push(newOrder);
  }

  return demoJobOrders.filter((order: JobOrder) =>
    ['Completed', 'Cancelled'].includes(order.workStatus)
  );
};

const JobOrderHistory = ({ navigationData, onClearNavigation, onNavigateBack }: JobOrderHistoryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<JobOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<JobOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDates, setExportDates] = useState<ExportDates>({
    startDate: '2023-10-01',
    endDate: '2023-10-31'
  });
  const [navigationSource, setNavigationSource] = useState<string | null>(null);
  const [returnToVehicleId, setReturnToVehicleId] = useState<string | null>(null);

  // Initialize demo data
  useEffect(() => {
    const orders = (getStoredJobOrders() as JobOrder[]).filter((order: JobOrder) =>
      ['Completed', 'Cancelled'].includes(order.workStatus)
    );
    orders.sort((a: JobOrder, b: JobOrder) => {
      const dateA = parseDateString(a.createDate);
      const dateB = parseDateString(b.createDate);
      return dateB - dateA;
    });
    setJobOrders(orders);
    setFilteredOrders(orders);
  }, []);

  // Handle navigation from other modules
  useEffect(() => {
    if (navigationData?.openDetails && navigationData?.jobOrder) {
      // Open the details view with the provided job order
      setSelectedOrder(navigationData.jobOrder);
      
      // Store the source module for back navigation
      if (navigationData.source) {
        setNavigationSource(navigationData.source);
      }
      
      // Store vehicle ID to return to
      if (navigationData.returnToVehicle) {
        setReturnToVehicleId(navigationData.returnToVehicle);
      }
      
      // Clear navigation data after a short delay
      const timer = setTimeout(() => {
        if (onClearNavigation) {
          onClearNavigation();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [navigationData, onClearNavigation]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(jobOrders);
    } else {
      const results = jobOrders.filter((order: JobOrder) => {
        const query = searchQuery.toLowerCase();
        return (
          order.id.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.mobile.toLowerCase().includes(query) ||
          order.vehiclePlate.toLowerCase().includes(query) ||
          order.workStatus.toLowerCase().includes(query) ||
          order.paymentStatus.toLowerCase().includes(query)
        );
      });
      setFilteredOrders(results);
    }
    setCurrentPage(1);
  }, [searchQuery, jobOrders]);

  const parseDateString = (dateStr: string): number => {
    const parts = dateStr.split(' ');
    if (parts.length === 3) {
      const day = Number.parseInt(parts[0], 10);
      const month = getMonthNumber(parts[1]);
      const year = Number.parseInt(parts[2], 10);
      return new Date(year, month, day).getTime();
    }
    return Date.now();
  };

  const getMonthNumber = (monthStr: string): number => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(monthStr);
  };

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  const getStatusClass = (status: string): string => {
    switch(status) {
      case 'Completed': return 'status-completed';
      case 'Cancelled': return 'status-cancelled';
      default: return 'status-new';
    }
  };

  const getPaymentStatusClass = (status: string): string => {
    if (status === 'Fully Paid') return 'payment-full';
    if (status === 'Partially Paid') return 'payment-partial';
    return 'payment-unpaid';
  };

  const getOrderTypeClass = (type: string): string => {
    return type === 'New Job Order' ? 'order-type-new-job' : 'order-type-service';
  };

  const handleExport = () => {
    const filtered = jobOrders.filter((order: JobOrder) => {
      const orderDate = parseDateString(order.createDate);
      const start = new Date(exportDates.startDate).getTime();
      const endDate = new Date(exportDates.endDate);
      endDate.setHours(23, 59, 59, 999);
      const end = endDate.getTime();
      return orderDate >= start && orderDate <= end;
    });

    let csvContent = "Job Order ID,Order Type,Customer Name,Mobile,Vehicle Plate,Work Status,Payment Status,Create Date\n";
    filtered.forEach((order: JobOrder) => {
      csvContent += `"${order.id}","${order.orderType}","${order.customerName}","${order.mobile}","${order.vehiclePlate}","${order.workStatus}","${order.paymentStatus}","${order.createDate}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `job_orders_${exportDates.startDate}_to_${exportDates.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Exported ${filtered.length} job orders successfully!`);
    setShowExportModal(false);
  };

  if (selectedOrder) {
    return (
      <JobOrderDetailsView 
        order={selectedOrder} 
        onClose={() => {
          setSelectedOrder(null);
          // Reload data from localStorage to get latest updates
          const refreshedOrders = (getStoredJobOrders() as JobOrder[]).filter((order: JobOrder) =>
            ['Completed', 'Cancelled'].includes(order.workStatus)
          );
          refreshedOrders.sort((a: JobOrder, b: JobOrder) => {
            const dateA = parseDateString(a.createDate);
            const dateB = parseDateString(b.createDate);
            return dateB - dateA;
          });
          setJobOrders(refreshedOrders);
          setFilteredOrders(refreshedOrders);
          
          if (navigationSource && onNavigateBack) {
            const vehicleId = returnToVehicleId;
            setNavigationSource(null);
            setReturnToVehicleId(null);
            onNavigateBack(navigationSource || undefined, vehicleId || undefined);
          }
        }}
      />
    );
  }

  return (
    <div className="job-order-history">
      <header className="app-header">
        <div className="header-left">
          <h1><i className="fas fa-history"></i> Job Order History</h1>
        </div>
      </header>

      <main className="main-content">
        <section className="search-section">
          <div className="search-container">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              className="smart-search-input"
              placeholder="Search by any job order details"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="search-stats">
            {filteredOrders.length === 0 ? 'No job orders found' :
             filteredOrders.length === jobOrders.length && !searchQuery ? 
             `Showing ${Math.min((currentPage - 1) * pageSize + 1, filteredOrders.length)}-${Math.min(currentPage * pageSize, filteredOrders.length)} of ${filteredOrders.length} job orders` :
             <>
                Showing {Math.min((currentPage - 1) * pageSize + 1, filteredOrders.length)}-{Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} job orders
                {searchQuery && <span style={{color: 'var(--secondary-color)'}}> (Filtered by: "{searchQuery}")</span>}
             </>
            }
          </div>
        </section>

        <section className="results-section">
          <div className="section-header">
            <h2><i className="fas fa-list"></i> Job Order Records</h2>
            <div className="section-header-controls">
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
              <PermissionGate moduleId="joborderhistory" optionId="joborderhistory_export">
                <button 
                  className="btn-export"
                  onClick={() => setShowExportModal(true)}
                >
                  <i className="fas fa-file-export"></i> Export Data
                </button>
              </PermissionGate>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-search"></i>
              </div>
              <div className="empty-text">No matching job orders found</div>
              <div className="empty-subtext">Try adjusting your search terms or clear the search to see all records</div>
            </div>
          ) : (
            <>
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
                    {paginatedOrders.map((order: JobOrder) => (
                      <tr key={order.id}>
                        <td className="date-column">{order.createDate}</td>
                        <td>{order.id}</td>
                        <td><span className={`order-type-badge ${getOrderTypeClass(order.orderType)}`}>{order.orderType}</span></td>
                        <td>{order.customerName}</td>
                        <td>{order.mobile}</td>
                        <td>{order.vehiclePlate}</td>
                        <td><span className={`status-badge ${getStatusClass(order.workStatus)}`}>{order.workStatus}</span></td>
                        <td><span className={`status-badge ${getPaymentStatusClass(order.paymentStatus)}`}>{order.paymentStatus}</span></td>
                        <td>
                          <PermissionGate moduleId="joborderhistory" optionId="joborderhistory_viewdetails">
                            <button 
                              className="btn-view"
                              onClick={() => {
                                // Reload from localStorage to get the latest data
                                const freshOrders = getStoredJobOrders() as JobOrder[];
                                const freshOrder = freshOrders.find((o: JobOrder) => o.id === order.id) || order;
                                setSelectedOrder(freshOrder);
                              }}
                            >
                              <i className="fas fa-eye"></i> View Details
                            </button>
                          </PermissionGate>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>Service Management System Â© 2023 | Job Order History Module</p>
      </footer>

      {showExportModal && (
        <div className="export-modal">
          <div className="export-modal-content">
            <h3><i className="fas fa-file-export"></i> Export Data</h3>
            <div className="date-range-inputs">
              <div className="date-input-group">
                <label>From Date</label>
                <input
                  type="date"
                  value={exportDates.startDate}
                  onChange={(e) => setExportDates({ ...exportDates, startDate: e.target.value })}
                />
              </div>
              <div className="date-input-group">
                <label>To Date</label>
                <input
                  type="date"
                  value={exportDates.endDate}
                  onChange={(e) => setExportDates({ ...exportDates, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="export-modal-actions">
              <button className="btn-confirm-export" onClick={handleExport}>Export to Excel</button>
              <button className="btn-cancel-export" onClick={() => setShowExportModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Details View Component
const JobOrderDetailsView = ({ order, onClose }: JobOrderDetailsViewProps) => {
  const combinedServices: ServiceEntry[] = order.orderType === 'Service Order'
    ? [...(order.serviceOrderReference?.services || []), ...(order.services || [])]
    : (order.services || []);

  return (
    <div className="pim-details-screen">
      <div className="pim-details-header">
        <div className="pim-details-title-container">
          <h2><i className="fas fa-clipboard-list"></i> Job Order Details - <span>{order.id}</span></h2>
        </div>
        <button className="pim-btn-close-details" onClick={onClose}>
          <i className="fas fa-times"></i> Close Details
        </button>
      </div>

      <div className="pim-details-body">
        <div className="pim-details-grid">
          {/* Job Order Summary */}
          <PermissionGate moduleId="joborderhistory" optionId="joborderhistory_summary">
          <div className="pim-detail-card">
            <h3><i className="fas fa-info-circle"></i> Job Order Summary</h3>
            <div className="pim-card-content">
              <div className="pim-info-item">
                <span className="pim-info-label">Job Order ID</span>
                <span className="pim-info-value">{order.id}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Order Type</span>
                <span className="pim-info-value"><span className={`epm-order-type-badge ${order.orderType === 'New Job Order' ? 'epm-order-type-new-job' : 'epm-order-type-service'}`}>{order.orderType}</span></span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Request Create Date</span>
                <span className="pim-info-value">{order.jobOrderSummary?.createDate || order.createDate}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Created By</span>
                <span className="pim-info-value">{order.jobOrderSummary?.createdBy || 'Not specified'}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Expected Delivery Date</span>
                <span className="pim-info-value">{order.jobOrderSummary?.expectedDelivery || 'Not specified'}</span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Work Status</span>
                <span className="pim-info-value"><span className={`epm-status-badge ${order.workStatus === 'Completed' ? 'epm-status-completed' : 'epm-status-cancelled'}`}>{order.workStatus}</span></span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Payment Status</span>
                <span className="pim-info-value"><span className={`epm-status-badge ${order.paymentStatus === 'Fully Paid' ? 'epm-payment-full' : order.paymentStatus === 'Partially Paid' ? 'epm-payment-partial' : 'epm-payment-unpaid'}`}>{order.paymentStatus}</span></span>
              </div>
              <div className="pim-info-item">
                <span className="pim-info-label">Exit Permit Status</span>
                <span className="pim-info-value"><span className={`epm-status-badge epm-permit-created`}>Created</span></span>
              </div>
            </div>
          </div>
          </PermissionGate>

          {/* Roadmap */}
          {order.roadmap && order.roadmap.length > 0 && (
          <PermissionGate moduleId="joborderhistory" optionId="joborderhistory_roadmap">
            <RoadmapCard order={order} />
          </PermissionGate>
          )}

          {/* Customer Details */}
          {order.customerDetails && (
          <PermissionGate moduleId="joborderhistory" optionId="joborderhistory_customer">
            <div className="pim-detail-card">
              <h3><i className="fas fa-user"></i> Customer Information</h3>
              <div className="pim-card-content">
                <div className="pim-info-item">
                  <span className="pim-info-label">Customer ID</span>
                  <span className="pim-info-value">{order.customerDetails.customerId}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Customer Name</span>
                  <span className="pim-info-value">{order.customerDetails.name || order.customerName}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Mobile Number</span>
                  <span className="pim-info-value">{order.customerDetails.mobile || order.mobile}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Email Address</span>
                  <span className="pim-info-value">{order.customerDetails.email || 'Not provided'}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Home Address</span>
                  <span className="pim-info-value">{order.customerDetails.address || 'Not provided'}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Registered Vehicles</span>
                  <span className="pim-info-value">
                    <span className="count-badge">{order.customerDetails.registeredVehiclesCount || 0} vehicles</span>
                  </span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Completed Services</span>
                  <span className="pim-info-value">
                    <span className="count-badge">{order.customerDetails.completedServicesCount || 0} services</span>
                  </span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Customer Since</span>
                  <span className="pim-info-value">{order.customerDetails.customerSince}</span>
                </div>
              </div>
            </div>
          </PermissionGate>
          )}

          {/* Vehicle Details */}
          <PermissionGate moduleId="joborderhistory" optionId="joborderhistory_vehicle">
            <VehicleDetailsCard order={order} />
          </PermissionGate>

          {/* Services */}
          {combinedServices.length > 0 && (
          <PermissionGate moduleId="joborderhistory" optionId="joborderhistory_services">
            <div className="pim-detail-card">
              <h3><i className="fas fa-tasks"></i> Services Summary</h3>
              <div className="services-list">
                {combinedServices.map((service: ServiceEntry, idx: number) => (
                  <div key={idx} className="service-item">
                    <div className="service-header">
                      <span className="service-name">{typeof service === 'string' ? service : service.name}</span>
                      <span className={`status-badge ${typeof service === 'string' ? 'status-cancelled' : (service.status === 'Completed' ? 'status-completed' : 'status-cancelled')}`}>{typeof service === 'string' ? 'New' : service.status}</span>
                    </div>
                    <div className="service-timeline">
                      <div className="timeline-item">
                        <i className="fas fa-play-circle"></i>
                        <span className="timeline-label">Started:</span>
                        <span className="timeline-value">{typeof service === 'string' ? 'Not started' : service.started}</span>
                      </div>
                      <div className="timeline-item">
                        <i className="fas fa-flag-checkered"></i>
                        <span className="timeline-label">Ended:</span>
                        <span className="timeline-value">{typeof service === 'string' ? 'Not completed' : (service.ended || 'Not completed')}</span>
                      </div>
                      <div className="timeline-item">
                        <i className="fas fa-clock"></i>
                        <span className="timeline-label">Duration:</span>
                        <span className="timeline-value">{typeof service === 'string' ? 'N/A' : service.duration}</span>
                      </div>
                      <div className="timeline-item">
                        <i className="fas fa-user-cog"></i>
                        <span className="timeline-label">Technician:</span>
                        <span className="timeline-value">{typeof service === 'string' ? 'Not assigned' : service.technician}</span>
                      </div>
                    </div>
                    {typeof service !== 'string' && service.notes && (
                      <div className="service-notes">
                        <span className="notes-label">Notes:</span>
                        <span className="notes-value">{service.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </PermissionGate>
          )}

          {/* Customer Notes */}
          {order.customerNotes && (
          <PermissionGate moduleId="joborderhistory" optionId="joborderhistory_notes">
            <div className="pim-detail-card">
              <h3><i className="fas fa-sticky-note"></i> Customer Notes / Comments</h3>
              <div className="pim-card-content">
                <div className="pim-info-item" style={{ display: 'block' }}>
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
          </PermissionGate>
          )}

          {/* Quality Check List */}
          <PermissionGate moduleId="joborderhistory" optionId="joborderhistory_quality">
            <QualityCheckListCard order={order} />
          </PermissionGate>

          {/* Billing */}
          <PermissionGate moduleId="joborderhistory" optionId="joborderhistory_billing">
            <BillingCard order={order} />
          </PermissionGate>

          {/* Payment Activity Log */}
          {order.paymentActivityLog && order.paymentActivityLog.length > 0 && (
          <PermissionGate moduleId="joborderhistory" optionId="joborderhistory_paymentlog">
            <PaymentActivityLogCard payments={order.paymentActivityLog} />
          </PermissionGate>
          )}

          {/* Exit Permit */}
          {order.exitPermit && (
          <PermissionGate moduleId="joborderhistory" optionId="joborderhistory_exitpermit">
            <div className="pim-detail-card">
              <h3><i className="fas fa-id-card"></i> Exit Permit Details</h3>
              <div className="pim-card-content">
                <div className="pim-info-item">
                  <span className="pim-info-label">Permit ID</span>
                  <span className="pim-info-value">{order.exitPermit.permitId}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Create Date</span>
                  <span className="pim-info-value">{order.exitPermit.createDate}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Next Service Date</span>
                  <span className="pim-info-value">{order.exitPermit.nextServiceDate}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Created By</span>
                  <span className="pim-info-value">{order.exitPermit.createdBy}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Collected By</span>
                  <span className="pim-info-value">{order.exitPermit.collectedBy}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Mobile</span>
                  <span className="pim-info-value">{order.exitPermit.collectedByMobile}</span>
                </div>
              </div>
            </div>
          </PermissionGate>
          )}

          {/* Documents */}
          <PermissionGate moduleId="joborderhistory" optionId="joborderhistory_documents">
            <DocumentsCard order={order} />
          </PermissionGate>
        </div>
      </div>
    </div>
  );
};

// Roadmap Component - Exact copy from Job Order Management
const RoadmapCard = ({ order }: OrderCardProps) => {
  if (!order || !order.roadmap || order.roadmap.length === 0) return null;

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
          {order.roadmap.map((step: RoadmapStep, idx: number) => (
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
};

// Vehicle Details Component - Exact copy from Job Order Management
const VehicleDetailsCard = ({ order }: OrderCardProps) => {
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
};

// Quality Check List Component - Exact copy from Job Order Management
const QualityCheckListCard = ({ order }: OrderCardProps) => {
  const services: ServiceEntry[] = order.orderType === 'Service Order'
    ? [...(order.serviceOrderReference?.services || []), ...(Array.isArray(order.services) ? order.services : [])]
    : (Array.isArray(order.services) ? order.services : []);

  const getStoredResult = (serviceName: string, index: number): string | null => {
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

  const getQualityCheckResult = (service: ServiceEntry, index: number): string | null => {
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
          services.map((service: ServiceEntry, idx: number) => {
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
};

// Billing Card Component - Exact copy from Job Order Management
const BillingCard = ({ order }: OrderCardProps) => {
  const getPaymentMethodClass = (method?: string | null): string => {
    if (!method) return '';
    const normalized = method.toLowerCase();
    if (normalized.includes('cash')) return 'epm-payment-method-cash';
    if (normalized.includes('card')) return 'epm-payment-method-card';
    if (normalized.includes('transfer')) return 'epm-payment-method-transfer';
    return 'epm-payment-method-card';
  };

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
          {order.billing.invoices.map((invoice: InvoiceInfo, idx: number) => (
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

// Documents Card Component - Exact copy from Job Order Management
const DocumentsCard = ({ order }: OrderCardProps) => {
  const documents: DocumentInfo[] = Array.isArray(order.documents) ? order.documents : [];

  if (documents.length === 0) return null;

  return (
    <div className="pim-detail-card">
      <h3><i className="fas fa-folder-open"></i> Documents</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {documents.map((doc: DocumentInfo, idx: number) => (
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
                const downloadUrl = doc.fileData ?? doc.url;
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
          </div>
        ))}
      </div>
    </div>
  );
};

// Payment Activity Log Component
const PaymentActivityLogCard = ({ payments }: PaymentActivityLogCardProps) => {
  const getPaymentMethodClass = (method?: string | null): string => {
    switch(method) {
      case 'Cash': return 'payment-method-cash';
      case 'Card': return 'payment-method-card';
      case 'Transfer': return 'payment-method-transfer';
      case 'Cheque': return 'payment-method-cheque';
      default: return '';
    }
  };

  const sortedPayments = [...(payments || [])].sort((a: PaymentActivity, b: PaymentActivity) => b.serial - a.serial);

  return (
    <div className="payment-log-card">
      <h3><i className="fas fa-history"></i> Payment Activity Log</h3>
      {sortedPayments.length === 0 ? (
        <div className="no-payments-log">
          <i className="fas fa-history"></i>
          <p>No payment activity recorded yet</p>
        </div>
      ) : (
        <div className="payment-log-table-wrapper">
          <table className="payment-log-table">
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
              {sortedPayments.map((payment: PaymentActivity) => (
                <tr key={payment.serial}>
                  <td className="serial-column">{payment.serial}</td>
                  <td className="amount-column">{payment.amount}</td>
                  <td className="discount-column">{payment.discount}</td>
                  <td>
                    <span className={`payment-method-badge ${getPaymentMethodClass(payment.paymentMethod)}`}>
                      {payment.paymentMethod}
                    </span>
                  </td>
                  <td className="cashier-column">{payment.cashierName}</td>
                  <td className="timestamp-column">{payment.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default JobOrderHistory;

