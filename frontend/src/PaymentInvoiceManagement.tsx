import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import './PaymentInvoiceManagement.css';
import { getStoredJobOrders } from './demoData';
import SuccessPopup from './SuccessPopup';
import ErrorPopup from './ErrorPopup';
import PermissionGate from './PermissionGate';
import { clampDiscountAmount, getDiscountAllowance, parseCurrencyValue } from './discountLimits';

type PaymentInvoiceManagementProps = {
  currentUser: any;
};

type PaymentFormState = {
  orderId: string;
  netAmount: number;
  amountPaid: number;
  discount: string;
  amountToPay: string;
  paymentMethod: string;
  transferProof: string | ArrayBuffer | null;
  transferProofName: string;
  balance: number;
};

type RefundFormState = {
  orderId: string;
  paidAmount: number;
  refundType: 'Full Refund' | 'Partial Refund';
  refundAmount: number;
  maxRefundAmount: number;
};

export default function PaymentInvoiceManagement({ currentUser }: PaymentInvoiceManagementProps) {
  // Complete demo data with full details
  const createCompleteJobOrders = () => {
    const baseOrders = [
      {
        id: 'JO-2023-001245',
        orderType: 'New Job Order',
        customerName: 'Ahmed Hassan',
        mobile: '+971 50 123 4567',
        vehiclePlate: 'DXB-12345',
        workStatus: 'Ready',
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
            stepStatus: 'Completed',
            startTimestamp: '15 Oct 2023, 10:30 AM',
            endTimestamp: '15 Oct 2023, 02:15 PM',
            actionBy: 'John Smith (Sales Agent)',
            status: 'New'
          },
          {
            step: 'Inspection',
            stepStatus: 'Completed',
            startTimestamp: '15 Oct 2023, 02:15 PM',
            endTimestamp: '16 Oct 2023, 09:00 AM',
            actionBy: 'Michael Brown (Inspector)',
            status: 'Completed'
          },
          {
            step: 'Inprogress',
            stepStatus: 'Completed',
            startTimestamp: '16 Oct 2023, 09:00 AM',
            endTimestamp: '17 Oct 2023, 03:30 PM',
            actionBy: 'Sarah Miller (Technician)',
            status: 'Completed'
          },
          {
            step: 'Quality Check',
            stepStatus: 'Completed',
            startTimestamp: '17 Oct 2023, 03:30 PM',
            endTimestamp: '18 Oct 2023, 10:00 AM',
            actionBy: 'Robert Chen (Quality Inspector)',
            status: 'Completed'
          },
          {
            step: 'Ready',
            stepStatus: 'InProgress',
            startTimestamp: '18 Oct 2023, 10:00 AM',
            endTimestamp: null,
            actionBy: 'Lisa Park (Supervisor)',
            status: 'InProgress'
          }
        ],
        customerDetails: {
          customerId: 'CUST-2023-001245',
          email: 'ahmed.hassan@example.com',
          registeredVehicles: '3 vehicles',
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
          vin: 'JTDKBRFU9H3045678',
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
            status: 'InProgress',
            started: '16 Oct 2023, 11:00 AM',
            ended: null,
            duration: 'Ongoing',
            technician: 'Sarah Miller',
            notes: 'Front brake pads replacement in progress.'
          },
          {
            name: 'Wheel Alignment',
            status: 'Pending Approval',
            started: null,
            ended: null,
            duration: 'Scheduled',
            technician: 'Robert Chen',
            notes: 'Scheduled for next week.'
          },
          {
            name: 'AC System Check',
            status: 'Paused',
            started: '16 Oct 2023, 02:00 PM',
            ended: null,
            duration: 'Paused',
            technician: 'Not assigned',
            notes: 'Paused due to parts unavailability.'
          }
        ],
        additionalServiceRequests: [
          {
            requestId: 'ASR-2023-001245-1',
            requestDate: 'March 16, 2024 2:15 PM',
            requestedService: 'Windshield Wiper Replacement',
            status: 'Pending Approval',
            customerNotes: 'Customer noticed wipers streaking during light rain',
            estimatedPrice: '$45.00'
          },
          {
            requestId: 'ASR-2023-001245-2',
            requestDate: 'March 18, 2024 10:30 AM',
            requestedService: 'Headlight Polishing',
            status: 'Approved',
            customerNotes: 'Headlights looking foggy, needs polishing for better visibility',
            estimatedPrice: '$85.00'
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
        workStatus: 'Inspection',
        paymentStatus: 'Unpaid',
        createDate: '14 Oct 2023',
        jobOrderSummary: {
          createDate: '14 Oct 2023, 02:15 PM',
          createdBy: 'Emma Wilson (Sales Agent)',
          expectedDelivery: '17 Oct 2023, 06:00 PM'
        },
        roadmap: [
          {
            step: 'New Request',
            stepStatus: 'Completed',
            startTimestamp: '14 Oct 2023, 02:15 PM',
            endTimestamp: '15 Oct 2023, 09:00 AM',
            actionBy: 'Emma Wilson (Sales Agent)',
            status: 'Completed'
          },
          {
            step: 'Inspection',
            stepStatus: 'InProgress',
            startTimestamp: '15 Oct 2023, 09:00 AM',
            endTimestamp: null,
            actionBy: 'Michael Brown (Inspector)',
            status: 'InProgress'
          },
          {
            step: 'Inprogress',
            stepStatus: 'Pending',
            startTimestamp: null,
            endTimestamp: null,
            actionBy: null,
            status: 'Pending'
          },
          {
            step: 'Quality Check',
            stepStatus: 'Upcoming',
            startTimestamp: null,
            endTimestamp: null,
            actionBy: null,
            status: 'Upcoming'
          },
          {
            step: 'Ready',
            stepStatus: 'Upcoming',
            startTimestamp: null,
            endTimestamp: null,
            actionBy: null,
            status: 'Upcoming'
          }
        ],
        customerDetails: {
          customerId: 'CUST-2023-001244',
          email: 'sarah.j@example.com',
          registeredVehicles: '2 vehicles',
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
          vin: 'WBAJA5C5XJG123456',
          registrationDate: '15 Feb 2023'
        },
        services: [
          {
            name: 'Engine Diagnostic',
            status: 'Completed',
            started: '15 Oct 2023, 10:00 AM',
            ended: '15 Oct 2023, 11:30 AM',
            duration: '1 hour 30 minutes',
            technician: 'Michael Brown',
            notes: 'Full engine diagnostic completed.'
          },
          {
            name: 'Suspension Check',
            status: 'InProgress',
            started: '15 Oct 2023, 01:00 PM',
            ended: null,
            duration: 'Ongoing',
            technician: 'Sarah Miller',
            notes: 'Suspension system check in progress.'
          },
          {
            name: 'Brake System Inspection',
            status: 'Pending Approval',
            started: null,
            ended: null,
            duration: 'Scheduled',
            technician: 'Not assigned',
            notes: 'Waiting for customer approval.'
          }
        ],
        additionalServiceRequests: [
          {
            requestId: 'ASR-2023-001244-1',
            requestDate: 'March 20, 2024 3:45 PM',
            requestedService: 'AC Vent Cleaning',
            status: 'Approved',
            customerNotes: 'Customer reported musty smell from AC vents',
            estimatedPrice: '$120.00'
          }
        ],
        billing: {
          billId: 'BILL-2023-001244',
          totalAmount: 'QAR 450.00',
          discount: 'QAR 0.00',
          netAmount: 'QAR 450.00',
          amountPaid: 'QAR 0.00',
          balanceDue: 'QAR 450.00',
          paymentMethod: null,
          invoices: [
            {
              number: 'INV-2023-001244-1',
              amount: 'QAR 450.00',
              discount: 'QAR 0.00',
              status: 'Unpaid',
              paymentMethod: null,
              services: ['Engine Diagnostic']
            }
          ]
        },
        paymentActivityLog: []
      },
      {
        id: 'JO-2023-001243',
        orderType: 'New Job Order',
        customerName: 'Mohammed Ali',
        mobile: '+971 52 456 7890',
        vehiclePlate: 'AUH-XY456',
        workStatus: 'Inprogress',
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
            stepStatus: 'Completed',
            startTimestamp: '13 Oct 2023, 09:45 AM',
            endTimestamp: '13 Oct 2023, 02:00 PM',
            actionBy: 'Robert Chen (Sales Agent)',
            status: 'Completed'
          },
          {
            step: 'Inspection',
            stepStatus: 'Completed',
            startTimestamp: '13 Oct 2023, 02:00 PM',
            endTimestamp: '14 Oct 2023, 08:30 AM',
            actionBy: 'Ahmed Rahman (Inspector)',
            status: 'Completed'
          },
          {
            step: 'Inprogress',
            stepStatus: 'InProgress',
            startTimestamp: '14 Oct 2023, 08:30 AM',
            endTimestamp: null,
            actionBy: 'James Wilson (Technician)',
            status: 'InProgress'
          },
          {
            step: 'Quality Check',
            stepStatus: 'Pending',
            startTimestamp: null,
            endTimestamp: null,
            actionBy: null,
            status: 'Pending'
          },
          {
            step: 'Ready',
            stepStatus: 'Upcoming',
            startTimestamp: null,
            endTimestamp: null,
            actionBy: null,
            status: 'Upcoming'
          }
        ],
        customerDetails: {
          customerId: 'CUST-2023-001243',
          email: 'm.ali@example.com',
          registeredVehicles: '1 vehicle',
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
          vin: 'WDDWF8EB5PR123456',
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
          },
          {
            name: 'Tire Rotation',
            status: 'InProgress',
            started: '14 Oct 2023, 04:00 PM',
            ended: null,
            duration: 'Ongoing',
            technician: 'James Wilson',
            notes: 'Tire rotation in progress.'
          },
          {
            name: 'AC System Service',
            status: 'Paused',
            started: '15 Oct 2023, 10:00 AM',
            ended: null,
            duration: 'Paused',
            technician: 'Specialist Team',
            notes: 'Paused - waiting for specialized equipment.'
          },
          {
            name: 'Interior Deep Cleaning',
            status: 'Pending Approval',
            started: null,
            ended: null,
            duration: 'Scheduled',
            technician: 'Fatima Ahmed',
            notes: 'Waiting for customer approval of the quote.'
          }
        ],
        additionalServiceRequests: [
          {
            requestId: 'ASR-2023-001243-1',
            requestDate: 'March 22, 2024 11:30 AM',
            requestedService: 'Window Tinting',
            status: 'Declined',
            customerNotes: 'Customer requested illegal tint level',
            estimatedPrice: '$250.00'
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
          invoices: [
            {
              number: 'INV-2023-001243-1',
              amount: 'QAR 2,000.00',
              discount: 'QAR 150.00',
              status: 'Partially Paid',
              paymentMethod: 'Cash',
              services: ['Annual Maintenance Service', 'Tire Rotation']
            },
            {
              number: 'INV-2023-001243-2',
              amount: 'QAR 1,200.00',
              discount: 'QAR 50.00',
              status: 'Unpaid',
              paymentMethod: null,
              services: ['Interior Deep Cleaning']
            }
          ]
        },
        paymentActivityLog: [
          {
            serial: 1,
            amount: 'QAR 1,500.00',
            discount: 'QAR 150.00',
            paymentMethod: 'Cash',
            cashierName: 'Michael Brown',
            timestamp: '15 Oct 2023, 03:15 PM'
          }
        ]
      }
    ];
    return baseOrders;
  };

  // State management
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showDetailsScreen, setShowDetailsScreen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [currentPaymentOrder, setCurrentPaymentOrder] = useState<any | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    orderId: '',
    netAmount: 0,
    amountPaid: 0,
    discount: '0',
    amountToPay: '',
    paymentMethod: '',
    transferProof: null,
    transferProofName: '',
    balance: 0
  });
  const [paymentDiscountLimit, setPaymentDiscountLimit] = useState(0);
  const [paymentDiscountRolePercent, setPaymentDiscountRolePercent] = useState(0);
  const [initialPaymentDiscount, setInitialPaymentDiscount] = useState(0);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState('cancel');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [showRefundPopup, setShowRefundPopup] = useState(false);
  const [refundForm, setRefundForm] = useState<RefundFormState>({
    orderId: '',
    paidAmount: 0,
    refundType: 'Full Refund',
    refundAmount: 0,
    maxRefundAmount: 0
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showBillExistsPopup, setShowBillExistsPopup] = useState(false);
  const [billExistsMessage, setBillExistsMessage] = useState('');
  const [showBillGeneratedPopup, setShowBillGeneratedPopup] = useState(false);
  const [billGeneratedMessage, setBillGeneratedMessage] = useState('');
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);

  // Calculate pagination
  const totalPages = Math.ceil(searchResults.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = searchResults.slice(startIndex, endIndex);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const isDropdownButton = target.closest('.btn-action-dropdown');
      const isDropdownMenu = target.closest('.action-dropdown-menu');
      
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

  useEffect(() => {
    const orders = getStoredJobOrders();
    const normalizedOrders = orders.length > 0 ? orders : createCompleteJobOrders();
    setAllOrders(normalizedOrders);
  }, []);

  // Handle search and filtering based on Work Status and Payment Status
  useEffect(() => {
    const filterOrders = (orders: any[]) => {
      return orders.filter((order: any) => {
        // If work status is Cancelled, only show if payment is Partially Paid or Fully Paid
        if (order.workStatus === 'Cancelled') {
          return order.paymentStatus === 'Partially Paid' || order.paymentStatus === 'Fully Paid';
        }
        // For other statuses (New Request, Inspection, In Progress, Quality Check, Ready)
        // Show if payment is Unpaid or Partially Paid
        // Don't show if Fully Paid or Fully Refunded
        return order.paymentStatus === 'Unpaid' || order.paymentStatus === 'Partially Paid';
      });
    };

    if (!searchQuery.trim()) {
      setSearchResults(filterOrders(allOrders));
    } else {
      const query = searchQuery.toLowerCase();
      const results = filterOrders(allOrders).filter((order: any) => {
        return (
          order.id.toLowerCase().includes(query) ||
          order.orderType.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.mobile.toLowerCase().includes(query) ||
          order.vehiclePlate.toLowerCase().includes(query) ||
          order.workStatus.toLowerCase().includes(query) ||
          order.paymentStatus.toLowerCase().includes(query) ||
          order.createDate.toLowerCase().includes(query)
        );
      });
      setSearchResults(results);
    }
    setCurrentPage(1);
  }, [searchQuery, allOrders]);

  // Sync selectedOrder when allOrders changes (e.g., after payment)
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = allOrders.find(o => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder ?? null);
      }
    }
  }, [allOrders, selectedOrder]);

  const closeDetailsView = () => {
    setShowDetailsScreen(false);
    setSelectedOrder(null);
  };

  const getPaymentDiscountMeta = (order: any, existingDiscountOverride: number | string | null = null) => {
    const totalAmount = parseCurrencyValue(order?.billing?.totalAmount);
    const existingDiscount = existingDiscountOverride === null
      ? parseCurrencyValue(order?.billing?.discount)
      : parseCurrencyValue(existingDiscountOverride);
    const discountAllowance = getDiscountAllowance({
      optionId: 'payment_discount_percent',
      totalAmount,
      existingDiscountAmount: 0,
      currentDiscountBaseAmount: totalAmount,
      fallbackPercent: 100,
    });

    const maxEditableDiscount = Math.max(discountAllowance.roleMaxAmount, existingDiscount);

    return {
      totalAmount,
      existingDiscount,
      roleMaxPercent: discountAllowance.roleMaxPercent,
      roleMaxAmount: discountAllowance.roleMaxAmount,
      maxEditableDiscount,
      remainingAdditionalAmount: Math.max(0, maxEditableDiscount - existingDiscount)
    };
  };

  const openPaymentPopup = (orderId: string) => {
    const order = allOrders.find(o => o.id === orderId);
    
    if (!order) {
      alert('Error: Order not found. Please refresh the page and try again.');
      return;
    }
    
    if (!order.billing) {
      alert('Error: No billing information available for this order.');
      return;
    }

    try {
      const netAmount = parseCurrencyValue(order.billing.netAmount);
      const amountPaid = parseCurrencyValue(order.billing.amountPaid);
      const discount = parseCurrencyValue(order.billing.discount);
      const balance = netAmount - amountPaid - discount;
      const discountMeta = getPaymentDiscountMeta(order, discount);

      setPaymentDiscountLimit(discountMeta.maxEditableDiscount);
      setPaymentDiscountRolePercent(discountMeta.roleMaxPercent);
      setInitialPaymentDiscount(discount);

      setCurrentPaymentOrder(order);
      setPaymentForm({
        orderId,
        netAmount,
        amountPaid,
        discount: discount.toString(),
        amountToPay: '',
        paymentMethod: order.billing.paymentMethod || '',
        transferProof: null,
        transferProofName: '',
        balance: balance > 0 ? balance : 0
      });
      setShowPaymentPopup(true);
    } catch (error) {
      console.error('Error opening payment popup:', error);
      alert('Error processing billing information. Please try again.');
    }
  };

  const closePaymentPopup = () => {
    setShowPaymentPopup(false);
    setPaymentDiscountLimit(0);
    setPaymentDiscountRolePercent(0);
    setInitialPaymentDiscount(0);
    setPaymentForm({
      orderId: '',
      netAmount: 0,
      amountPaid: 0,
      discount: '0',
      amountToPay: '',
      paymentMethod: '',
      transferProof: null,
      transferProofName: '',
      balance: 0
    });
  };

  const generateBillPDF = (order: any) => {
    // Prevent double bill generation
    if (isGeneratingBill) {
      return;
    }

    // Get the latest order from localStorage to ensure we have the most current documents
    const savedOrders: any[] = JSON.parse(localStorage.getItem('jobOrders') || '[]');
    const currentOrder = savedOrders.find((o: any) => o.id === order.id) || order;
    
    console.log('Generating bill for order:', order.id);
    console.log('Current order documents:', currentOrder.documents);
    
    // Check if a bill with identical payment details already exists
    const existingBills = (currentOrder.documents || []).filter((doc: any) => doc.type === 'Invoice/Bill');
    console.log('Existing bills found:', existingBills.length);
    
    const duplicateBill = existingBills.find((bill: any) => {
      // Compare bill details to detect duplicates
      const billMatch = bill.billDetails && 
             JSON.stringify(bill.billDetails) === JSON.stringify({
               netAmount: currentOrder.billing?.netAmount,
               amountPaid: currentOrder.billing?.amountPaid,
               discount: currentOrder.billing?.discount,
               balanceDue: currentOrder.billing?.balanceDue
             });
      console.log('Comparing bill:', bill.billDetails, 'Match:', billMatch);
      return billMatch;
    });

    if (duplicateBill) {
      console.log('Duplicate bill found, showing error popup');
      setBillExistsMessage('Bill with the same payment details already generated and available in documents');
      setShowBillExistsPopup(true);
      return;
    }

    // Set flag to prevent double generation
    setIsGeneratingBill(true);

    // Get payment activity log for payment received info
    const latestPayment = (order.paymentActivityLog || []).length > 0 
      ? order.paymentActivityLog[order.paymentActivityLog.length - 1]
      : null;

    // Create HTML bill matching inspection module design
    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bill_Invoice_${order.billing?.billId || order.id}.html</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20mm; background: #f3f6fb; color: #2c3e50; }
          * { box-sizing: border-box; }
          @page { size: A4; margin: 0; }
          @media print { body { background: white; } }
          .report-header { text-align: center; margin-bottom: 28px; padding: 20px 10px; background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); color: white; border-radius: 12px; }
          .report-logo { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; margin: 0 auto 12px; display: block; border: 3px solid white; }
          .report-header h1 { margin: 0 0 6px 0; font-size: 28px; letter-spacing: 0.3px; }
          .report-header p { margin: 0; font-size: 13px; opacity: 0.9; }
          .report-card { background: white; padding: 20px; border-radius: 10px; margin-bottom: 18px; box-shadow: 0 6px 16px rgba(25, 42, 70, 0.08); border: 1px solid #e6ecf5; }
          .card-title { font-size: 17px; margin: 0 0 14px 0; padding-bottom: 10px; border-bottom: 2px solid #eef2f8; display: flex; align-items: center; gap: 8px; }
          .card-title.blue { color: #3498db; }
          .card-title.green { color: #27ae60; }
          .card-title.red { color: #e74c3c; }
          .card-title.orange { color: #f39c12; }
          .card-title.purple { color: #9b59b6; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 18px; font-size: 13px; }
          .label { font-weight: 600; color: #2c3e50; display: block; margin-bottom: 4px; }
          .value { color: #5a6b7d; }
          
          /* Services Table */
          .services-table { width: 100%; border-collapse: collapse; margin: 14px 0; }
          .services-table thead { background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%); color: white; }
          .services-table th { padding: 12px 15px; text-align: left; font-size: 13px; font-weight: 600; }
          .services-table td { padding: 10px 15px; border-bottom: 1px solid #e6ecf5; font-size: 13px; }
          .services-table tbody tr:hover { background: #f8f9fa; }
          
          /* Summary Section */
          .summary-box { background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%); padding: 18px; border-radius: 8px; margin-top: 14px; border-left: 5px solid #3498db; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.5); font-size: 13px; }
          .summary-row:last-child { border-bottom: none; }
          .summary-label { font-weight: 600; color: #2c3e50; }
          .summary-value { font-weight: 600; color: #2c3e50; }
          .grand-total { background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); color: white; padding: 14px 18px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 16px; font-weight: 700; }
          
          /* Payment Info */
          .payment-info-box { background: #e8f5e9; padding: 16px; border-radius: 8px; border-left: 5px solid #27ae60; margin-top: 14px; }
          .payment-info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .payment-info-label { font-weight: 600; color: #1b5e20; }
          .payment-info-value { color: #2c3e50; }
          
          /* Footer */
          .footer { margin-top: 28px; padding-top: 18px; border-top: 2px solid #e6ecf5; text-align: center; color: #7f8c8d; font-size: 11px; }
          .footer p { margin: 4px 0; }
        </style>
      </head>
      <body>
        <div class="report-header">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPoCJV5AIkhwzaOSgnWDVpRIZITDAkRDsf5A&s" alt="Logo" class="report-logo" />
          <h1>💵 Bill / Invoice</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="report-card">
          <h2 class="card-title blue">📋 Bill Information</h2>
          <div class="info-grid">
            <div><span class="label">Bill ID</span><span class="value">${order.billing?.billId || 'N/A'}</span></div>
            <div><span class="label">Job Order ID</span><span class="value">${order.id}</span></div>
            <div><span class="label">Bill Date</span><span class="value">${new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
            <div><span class="label">Order Type</span><span class="value">${order.orderType}</span></div>
          </div>
        </div>

        <div class="report-card">
          <h2 class="card-title green">👤 Customer Information</h2>
          <div class="info-grid">
            <div><span class="label">Name</span><span class="value">${order.customerName}</span></div>
            <div><span class="label">Mobile</span><span class="value">${order.mobile}</span></div>
            <div><span class="label">Email</span><span class="value">${order.customerDetails?.email || 'N/A'}</span></div>
            <div><span class="label">Customer Since</span><span class="value">${order.customerDetails?.customerSince || 'N/A'}</span></div>
          </div>
        </div>

        <div class="report-card">
          <h2 class="card-title red">🚗 Vehicle Information</h2>
          <div class="info-grid">
            <div><span class="label">Vehicle Unique ID</span><span class="value">${order.vehicleDetails?.vehicleId || 'N/A'}</span></div>
            <div><span class="label">Owned By</span><span class="value">${order.vehicleDetails?.ownedBy || 'N/A'}</span></div>
            <div><span class="label">Make</span><span class="value">${order.vehicleDetails?.make || 'N/A'}</span></div>
            <div><span class="label">Model</span><span class="value">${order.vehicleDetails?.model || 'N/A'}</span></div>
            <div><span class="label">Year</span><span class="value">${order.vehicleDetails?.year || 'N/A'}</span></div>
            <div><span class="label">Vehicle Type</span><span class="value">${order.vehicleDetails?.type || 'N/A'}</span></div>
            <div><span class="label">Color</span><span class="value">${order.vehicleDetails?.color || 'N/A'}</span></div>
            <div><span class="label">Plate Number</span><span class="value">${order.vehicleDetails?.plateNumber || order.vehiclePlate || 'N/A'}</span></div>
            <div><span class="label">VIN</span><span class="value">${order.vehicleDetails?.vin || 'N/A'}</span></div>
            <div><span class="label">Registration Date</span><span class="value">${order.vehicleDetails?.registrationDate || 'N/A'}</span></div>
          </div>
        </div>

        ${order.services && order.services.length > 0 ? `
        <div class="report-card">
          <h2 class="card-title orange">🔧 Services Provided</h2>
          <table class="services-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.services.map((service: any) => `
                <tr>
                  <td>${typeof service === 'string' ? service : (service.name || service)}</td>
                  <td style="text-align: right;">${service.price && service.price > 0 ? 'QAR ' + parseFloat(service.price).toFixed(2) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="report-card">
          <h2 class="card-title purple">💰 Payment Summary</h2>
          <div class="summary-box">
            <div class="summary-row">
              <span class="summary-label">Total Amount:</span>
              <span class="summary-value">${order.billing?.totalAmount || 'QAR 0.00'}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Discount:</span>
              <span class="summary-value">${order.billing?.discount || 'QAR 0.00'}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Net Amount:</span>
              <span class="summary-value">${order.billing?.netAmount || 'QAR 0.00'}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Amount Paid:</span>
              <span class="summary-value">${order.billing?.amountPaid || 'QAR 0.00'}</span>
            </div>
            <div class="grand-total">
              <span>Balance Due:</span>
              <span>${order.billing?.balanceDue || 'QAR 0.00'}</span>
            </div>
          </div>

          ${latestPayment ? `
          <div class="payment-info-box">
            <div class="payment-info-row">
              <span class="payment-info-label">Payment Received By:</span>
              <span class="payment-info-value">${latestPayment.cashierName || 'N/A'}</span>
            </div>
            <div class="payment-info-row">
              <span class="payment-info-label">Payment Method:</span>
              <span class="payment-info-value">${latestPayment.paymentMethod || 'N/A'}</span>
            </div>
            <div class="payment-info-row">
              <span class="payment-info-label">Date & Time:</span>
              <span class="payment-info-value">${latestPayment.timestamp || 'N/A'}</span>
            </div>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>Thank you for your business! This is an electronically generated document.</p>
          <p>Rodeo Drive - Service Management System</p>
          <p>© ${new Date().getFullYear()} All Rights Reserved</p>
        </div>
      </body>
      </html>
    `;

    // Convert HTML to data URL
    const blob = new Blob([billHTML], { type: 'text/html' });
    const reader = new FileReader();
    reader.onloadend = () => {
      const billData = reader.result;
      if (typeof billData !== 'string') {
        setIsGeneratingBill(false);
        alert('Unable to generate bill document. Please try again.');
        return;
      }
      
      // Save to documents with bill details for duplicate checking
      const updatedOrders = allOrders.map((o: any) => {
        if (o.id === order.id) {
          const documents = [...(o.documents || [])];
          documents.push({
            id: `DOC-${Date.now()}`,
            name: `Bill_${order.billing?.billId}_${Date.now()}.html`,
            type: 'Invoice/Bill',
            category: 'Billing',
            uploadDate: new Date().toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            uploadedBy: currentUser?.name || 'System User',
            fileData: billData,
            billReference: order.billing?.billId,
            billDetails: {
              netAmount: order.billing?.netAmount,
              amountPaid: order.billing?.amountPaid,
              discount: order.billing?.discount,
              balanceDue: order.billing?.balanceDue
            }
          });
          return { ...o, documents };
        }
        return o;
      });

      setAllOrders(updatedOrders);
      localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
      
      // Update selectedOrder to show new document
      const updatedSelectedOrder = updatedOrders.find((o: any) => o.id === order.id);
      if (updatedSelectedOrder) {
        setSelectedOrder(updatedSelectedOrder ?? null);
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = billData;
      link.download = `Bill_${order.billing?.billId}_${Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success popup with message about document card
      setBillGeneratedMessage(`Bill generated successfully! The document has been added to the Documents section.`);
      setShowBillGeneratedPopup(true);
      
      // Reset the generating flag
      setIsGeneratingBill(false);
    };
    reader.readAsDataURL(blob);
  };

  const handlePaymentChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPaymentForm((prev: PaymentFormState) => {
      const updated = { ...prev, [name]: value } as PaymentFormState;
      const clampedDiscount = clampDiscountAmount(parseFloat(updated.discount) || 0, paymentDiscountLimit);
      updated.discount = clampedDiscount.toString();

      if (name === 'discount' || name === 'amountToPay') {
        const amountToPay = parseFloat(updated.amountToPay) || 0;
        const balance = prev.netAmount - prev.amountPaid - clampedDiscount - amountToPay;
        updated.balance = balance > 0 ? balance : 0;
      }
      // Clear file when payment method changes from Transfer
      if (name === 'paymentMethod' && value !== 'Transfer') {
        updated.transferProof = null;
        updated.transferProofName = '';
      }
      return updated;
    });
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid file (JPG, PNG, or PDF)');
        e.target.value = '';
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const transferProof = typeof reader.result === 'string' || reader.result instanceof ArrayBuffer
          ? reader.result
          : null;

        setPaymentForm((prev: PaymentFormState) => ({
          ...prev,
          transferProof,
          transferProofName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShowCancelConfirmation = (orderId: string) => {
    setCancelOrderId(orderId);
    setShowCancelConfirmation(true);
  };

  const handleCancelOrder = () => {
    if (!cancelOrderId) return;

    // Find the order to cancel
    const orderToCancel = allOrders.find(order => order.id === cancelOrderId);
    if (!orderToCancel) return;

    // Check if order is already cancelled
    if (orderToCancel.workStatus === 'Cancelled') {
      console.log('Showing cancel error popup for already cancelled order:', cancelOrderId);
      setErrorMessage(`Job Order ${cancelOrderId} is already cancelled.`);
      setShowErrorPopup(true);
      setShowCancelConfirmation(false);
      setCancelOrderId(null);
      return;
    }

    // Create a cancelled version of the order
    const cancelledOrder = {
      ...orderToCancel,
      workStatus: 'Cancelled'
    };

    // Update the order status in jobOrders storage
    const updatedOrders = allOrders.map(order => 
      order.id === cancelOrderId ? cancelledOrder : order
    );
    
    setAllOrders(updatedOrders);
    localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
    
    setShowCancelConfirmation(false);
    setSubmittedOrderId(cancelOrderId);
    setLastAction('cancel');
    setShowSuccessPopup(true);
    setCancelOrderId(null);
  };

  const handleSavePayment = () => {
    if (!paymentForm.paymentMethod) {
      alert('Please select a payment method.');
      return;
    }
    const amountToPayValue = parseFloat(paymentForm.amountToPay);
    if (!Number.isFinite(amountToPayValue) || amountToPayValue <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    // Validate transfer proof upload
    if (paymentForm.paymentMethod === 'Transfer' && !paymentForm.transferProof) {
      alert('Please upload proof of transfer document.');
      return;
    }

    const updatedOrders = allOrders.map(order => {
      if (order.id === paymentForm.orderId) {
        const paymentDiscountMeta = getPaymentDiscountMeta(order);
        const discount = clampDiscountAmount(parseFloat(paymentForm.discount) || 0, paymentDiscountMeta.maxEditableDiscount);
        const amountToPay = amountToPayValue;
        const netAmount = paymentForm.netAmount;
        const totalPaid = paymentForm.amountPaid + amountToPay;
        const adjustedNetAmount = netAmount - discount;

        let paymentStatus = 'Unpaid';
        if (totalPaid > 0 && totalPaid < adjustedNetAmount) {
          paymentStatus = 'Partially Paid';
        } else if (totalPaid >= adjustedNetAmount) {
          paymentStatus = 'Fully Paid';
        }

        // Add transfer proof to documents if Transfer payment method
        const documents = [...(order.documents || [])];
        if (paymentForm.paymentMethod === 'Transfer' && paymentForm.transferProof) {
          documents.push({
            id: `DOC-${Date.now()}`,
            name: paymentForm.transferProofName,
            type: 'Transfer Proof',
            category: 'Payment',
            uploadDate: new Date().toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            uploadedBy: currentUser?.name || 'System User',
            fileData: paymentForm.transferProof,
            paymentReference: `Payment #${(order.paymentActivityLog?.length || 0) + 1}`
          });
        }

        const updatedOrder = {
          ...order,
          paymentStatus,
          documents,
          billing: {
            ...order.billing,
            discount: `QAR ${discount.toFixed(2)}`,
            amountPaid: `QAR ${totalPaid.toFixed(2)}`,
            balanceDue: `QAR ${Math.max(0, adjustedNetAmount - totalPaid).toFixed(2)}`,
            paymentMethod: paymentForm.paymentMethod
          },
          paymentActivityLog: [
            ...(order.paymentActivityLog || []),
            {
              serial: (order.paymentActivityLog?.length || 0) + 1,
              amount: `QAR ${amountToPay.toFixed(2)}`,
              discount: `QAR ${discount.toFixed(2)}`,
              paymentMethod: paymentForm.paymentMethod,
              cashierName: currentUser?.name || 'System User',
              timestamp: new Date().toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          ]
        };

        return updatedOrder;
      }
      return order;
    });

    setAllOrders(updatedOrders);
    localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
    
    // Update selectedOrder to reflect the new payment
    const updatedSelectedOrder = updatedOrders.find((o: any) => o.id === paymentForm.orderId);
    if (updatedSelectedOrder) {
      setSelectedOrder(updatedSelectedOrder ?? null);
    }
    
    const message = paymentForm.paymentMethod === 'Transfer' 
      ? `Payment of QAR ${parseFloat(paymentForm.amountToPay).toFixed(2)} saved successfully!\nTransfer proof has been uploaded to documents.`
      : `Payment of QAR ${parseFloat(paymentForm.amountToPay).toFixed(2)} saved successfully!`;
    
    // Show success message in the payment popup
    setSuccessMessage(message);
    setShowSuccessPopup(true);
  };

  const openRefundPopup = (orderId: string) => {
    const order = allOrders.find(o => o.id === orderId);
    
    if (!order) {
      alert('Error: Order not found. Please refresh the page and try again.');
      return;
    }
    
    // Only allow refund if order is cancelled and payment status is Fully Paid or Partially Paid
    if (order.workStatus !== 'Cancelled' || (order.paymentStatus !== 'Fully Paid' && order.paymentStatus !== 'Partially Paid')) {
      alert('Refund can only be initiated for cancelled orders with Fully Paid or Partially Paid status.');
      return;
    }
    
    if (!order.billing) {
      alert('Error: No billing information available for this order.');
      return;
    }

    try {
      const amountPaid = parseFloat(order.billing.amountPaid.replace(/[^0-9.-]+/g, '')) || 0;
      
      if (amountPaid <= 0) {
        alert('No payment has been made on this order. Cannot initiate refund.');
        return;
      }

      setRefundForm({
        orderId,
        paidAmount: amountPaid,
        refundType: 'Full Refund',
        refundAmount: amountPaid,
        maxRefundAmount: amountPaid
      });
      setShowRefundPopup(true);
    } catch (err: unknown) {
      alert('Error processing refund request. Please try again.');
      console.error(err);
    }
  };

  const closeRefundPopup = () => {
    setShowRefundPopup(false);
    setRefundForm({
      orderId: '',
      paidAmount: 0,
      refundType: 'Full Refund',
      refundAmount: 0,
      maxRefundAmount: 0
    });
  };

  const handleRefundChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRefundForm((prev: RefundFormState) => {
      const updated = { ...prev, [name]: value } as RefundFormState;
      
      if (name === 'refundType') {
        if (value === 'Full Refund') {
          updated.refundAmount = prev.paidAmount;
        } else {
          updated.refundAmount = 0;
        }
      }
      
      // Validate refund amount doesn't exceed paid amount
      if (name === 'refundAmount') {
        const refundAmount = parseFloat(value) || 0;
        if (refundAmount > prev.maxRefundAmount) {
          updated.refundAmount = prev.maxRefundAmount;
        }
      }
      
      return updated;
    });
  };

  const handleSaveRefund = () => {
    if (!refundForm.refundAmount || refundForm.refundAmount <= 0) {
      alert('Please enter a valid refund amount.');
      return;
    }

    if (refundForm.refundAmount > refundForm.maxRefundAmount) {
      alert(`Refund amount cannot exceed the paid amount of QAR ${refundForm.maxRefundAmount.toFixed(2)}`);
      return;
    }

    const updatedOrders = allOrders.map(order => {
      if (order.id === refundForm.orderId) {
        const currentAmountPaid = parseFloat(order.billing.amountPaid.replace(/[^0-9.-]+/g, '')) || 0;
        const refundAmount = Number(refundForm.refundAmount);
        const newAmountPaid = currentAmountPaid - refundAmount;
        const netAmount = parseFloat(order.billing.netAmount.replace(/[^0-9.-]+/g, '')) || 0;
        const newBalanceDue = netAmount - newAmountPaid;

        let paymentStatus = 'Unpaid';
        if (newAmountPaid > 0 && newAmountPaid < netAmount) {
          paymentStatus = 'Partially Paid';
        } else if (newAmountPaid >= netAmount) {
          paymentStatus = 'Fully Paid';
        } else if (newAmountPaid === 0) {
          // If amount paid is now zero after refund, mark as Fully Refunded
          paymentStatus = 'Fully Refunded';
        }

        const updatedOrder = {
          ...order,
          paymentStatus,
          movedToExitPermit: paymentStatus === 'Fully Refunded' ? true : false,
          billing: {
            ...order.billing,
            amountPaid: `QAR ${newAmountPaid.toFixed(2)}`,
            balanceDue: `QAR ${Math.max(0, newBalanceDue).toFixed(2)}`
          },
          paymentActivityLog: [
            ...(order.paymentActivityLog || []),
            {
              serial: (order.paymentActivityLog?.length || 0) + 1,
              amount: `QAR -${refundAmount.toFixed(2)}`,
              discount: 'QAR 0.00',
              paymentMethod: 'Refund',
              cashierName: currentUser?.name || 'System User',
              timestamp: new Date().toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          ]
        };

        return updatedOrder;
      }
      return order;
    });

    setAllOrders(updatedOrders);
    localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
    
    // Update selectedOrder to reflect the refund
    const updatedSelectedOrder = updatedOrders.find((o: any) => o.id === refundForm.orderId);
    if (updatedSelectedOrder) {
      setSelectedOrder(updatedSelectedOrder ?? null);
    }
    
    // Show success message in the refund popup
    const refundAmount = Number(refundForm.refundAmount).toFixed(2);
    const isFullRefund = updatedSelectedOrder?.paymentStatus === 'Fully Refunded';
    const successMsg = isFullRefund 
      ? `Full Refund of QAR ${refundAmount} processed successfully!\nOrder has been moved to Exit Permit Module.`
      : `Partial Refund of QAR ${refundAmount} processed successfully!`;
    
    setSuccessMessage(successMsg);
    setShowSuccessPopup(true);
  };

  const formatWorkStatus = (status: string) => {
    switch (status) {
      case 'New Request': return 'pim-status-new-request';
      case 'Inspection': return 'pim-status-inspection';
      case 'Inprogress': return 'pim-status-inprogress';
      case 'Quality Check': return 'pim-status-quality-check';
      case 'Ready': return 'pim-status-ready';
      case 'Completed': return 'pim-status-completed';
      case 'Cancelled': return 'pim-status-cancelled';
      default: return 'pim-status-inprogress';
    }
  };

  const formatPaymentStatus = (status: string) => {
    switch (status) {
      case 'Fully Paid': return 'pim-payment-full';
      case 'Partially Paid': return 'pim-payment-partial';
      case 'Unpaid': return 'pim-payment-unpaid';
      default: return 'pim-payment-unpaid';
    }
  };

  const formatOrderType = (type: string) => {
    return type === 'New Job Order' ? 'pim-order-type-new-job' : 'pim-order-type-service';
  };

  const getStepStatusClass = (stepStatus: string) => {
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

  const getStepIcon = (stepStatus: string) => {
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

  const formatStepStatus = (status: string) => {
    switch (status) {
      case 'New': return 'pim-status-new';
      case 'Completed': return 'pim-status-completed';
      case 'InProgress': return 'pim-status-inprogress';
      case 'Pending': return 'pim-status-pending';
      case 'Upcoming': return 'pim-status-pending';
      default: return 'pim-status-pending';
    }
  };

  const formatServiceStatus = (status: string) => {
    switch (status) {
      case 'Completed': return 'pim-status-completed';
      case 'InProgress': return 'pim-status-inprogress';
      case 'Pending Approval': return 'pim-status-pending-approval';
      case 'Paused': return 'pim-status-paused';
      case 'New': return 'pim-status-new';
      case 'Postponed': return 'pim-status-postponed';
      default: return 'pim-status-new';
    }
  };

  const getQualityCheckResult = (order: any, service: any, index: number) => {
    if (service && typeof service === 'object') {
      return service.qualityCheckResult || service.qcResult || service.qcStatus || service.qualityStatus || null;
    }

    const storedResults = order?.qualityCheckResults;
    if (!storedResults) return null;

    if (Array.isArray(storedResults)) {
      return storedResults[index] || null;
    }

    if (typeof storedResults === 'object') {
      const serviceName = typeof service === 'string' ? service : 'Service';
      return storedResults[serviceName] || storedResults[index] || null;
    }

    return null;
  };

  const getAdditionalServiceStatusClass = (status: string) => {
    switch (status) {
      case 'Pending Approval': return 'pim-pending';
      case 'Approved': return 'pim-approved';
      case 'Declined': return 'pim-declined';
      default: return 'pim-pending';
    }
  };

  const combinedSelectedServices = selectedOrder?.orderType === 'Service Order'
    ? [...(selectedOrder.serviceOrderReference?.services || []), ...(selectedOrder.services || [])]
    : (selectedOrder?.services || []);

  if (showDetailsScreen && selectedOrder) {
    return (
      <div className="pim-details-screen">
        <div className="pim-details-header">
          <div className="pim-details-title-container">
            <h2><i className="fas fa-clipboard-list"></i> Job Order Details - {selectedOrder.id}</h2>
          </div>
          <button className="pim-btn-close-details" onClick={closeDetailsView}>
            <i className="fas fa-times"></i> Close Details
          </button>
        </div>
        <div className="pim-details-body">
          <div className="pim-details-grid">
            {/* Job Order Summary */}
            <div className="epm-detail-card">
              <h3><i className="fas fa-info-circle"></i> Job Order Summary</h3>
              <div className="epm-card-content">
                <div className="epm-info-item">
                  <span className="epm-info-label">Job Order ID</span>
                  <span className="epm-info-value">{selectedOrder.id}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Order Type</span>
                  <span className="epm-info-value"><span className={`epm-order-type-badge ${selectedOrder.orderType === 'New Job Order' ? 'epm-order-type-new-job' : 'epm-order-type-service'}`}>{selectedOrder.orderType}</span></span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Request Create Date</span>
                  <span className="epm-info-value">{selectedOrder.jobOrderSummary?.createDate || selectedOrder.createDate}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Created By</span>
                  <span className="epm-info-value">{selectedOrder.jobOrderSummary?.createdBy || 'Not specified'}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Expected Delivery Date</span>
                  <span className="epm-info-value">{selectedOrder.jobOrderSummary?.expectedDelivery || 'Not specified'}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Work Status</span>
                  <span className="epm-info-value"><span className={`epm-status-badge ${formatWorkStatus(selectedOrder.workStatus)}`}>{selectedOrder.workStatus}</span></span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Payment Status</span>
                  <span className="epm-info-value"><span className={`epm-status-badge ${selectedOrder.paymentStatus === 'Fully Paid' ? 'epm-payment-full' : selectedOrder.paymentStatus === 'Partially Paid' ? 'epm-payment-partial' : 'epm-payment-unpaid'}`}>{selectedOrder.paymentStatus}</span></span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Exit Permit Status</span>
                  <span className="epm-info-value">
                    <span className={`epm-status-badge ${selectedOrder.exitPermitStatus === 'Created' ? 'epm-payment-full' : 'epm-payment-unpaid'}`}>
                      {selectedOrder.exitPermitStatus || 'Not Created'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Roadmap */}
            {selectedOrder.roadmap && (
              <div className="pim-detail-card">
                <h3><i className="fas fa-map-signs"></i> Job Order Roadmap</h3>
                <div className="pim-roadmap-container">
                  <div className="pim-roadmap-steps">
                    {selectedOrder.roadmap.map((step: any, idx: number) => (
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
            )}

            {/* Customer Details */}
            {selectedOrder.customerDetails && (
              <PermissionGate moduleId="payment" optionId="payment_customer">
                <div className="pim-detail-card">
                  <h3><i className="fas fa-user"></i> Customer Information</h3>
                  <div className="pim-card-content">
                  <div className="pim-info-item">
                    <span className="pim-info-label">Customer ID</span>
                    <span className="pim-info-value">{selectedOrder.customerDetails.customerId || 'New Customer'}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Customer Name</span>
                    <span className="pim-info-value">{selectedOrder.customerName}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Mobile Number</span>
                    <span className="pim-info-value">{selectedOrder.mobile || 'Not provided'}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Email Address</span>
                    <span className="pim-info-value">{selectedOrder.customerDetails.email || 'Not provided'}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Home Address</span>
                    <span className="pim-info-value">{selectedOrder.customerDetails.address || 'Not provided'}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Registered Vehicles</span>
                    <span className="pim-info-value">
                      <span className="count-badge">{selectedOrder.customerDetails.registeredVehicles || '0 vehicles'}</span>
                    </span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Completed Services</span>
                    <span className="pim-info-value">
                      <span className="count-badge">{selectedOrder.customerDetails.completedServicesCount ?? 0} services</span>
                    </span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Customer Since</span>
                    <span className="pim-info-value">{selectedOrder.customerDetails.customerSince || 'Not specified'}</span>
                  </div>
                </div>
              </div>
              </PermissionGate>
            )}

            {/* Vehicle Details */}
            {selectedOrder.vehicleDetails && (
              <PermissionGate moduleId="payment" optionId="payment_vehicle">
                <div className="pim-detail-card">
                  <h3><i className="fas fa-car"></i> Vehicle Information</h3>
                  <div className="pim-card-content">
                  <div className="pim-info-item">
                    <span className="pim-info-label">Vehicle Unique ID</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.vehicleId || 'N/A'}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Owned By</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.ownedBy || 'N/A'}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Make</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.make || 'N/A'}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Model</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.model || 'N/A'}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Year</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.year || 'N/A'}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Vehicle Type</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.type || 'N/A'}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Color</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.color || 'N/A'}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Plate Number</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.plateNumber || selectedOrder.vehiclePlate || 'N/A'}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">VIN</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.vin || 'N/A'}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Registration Date</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.registrationDate || 'N/A'}</span>
                  </div>
                </div>
              </div>
              </PermissionGate>
            )}

            {/* Services */}
            {combinedSelectedServices.length > 0 && (
              <PermissionGate moduleId="payment" optionId="payment_services">
                <div className="pim-detail-card">
                  <h3><i className="fas fa-tasks"></i> Services Summary</h3>
                  <div className="pim-services-list">
                    {combinedSelectedServices.map((service: any, idx: number) => (
                      <div key={idx} className="pim-service-item">
                        <div className="pim-service-header">
                          <span className="pim-service-name">{typeof service === 'string' ? service : service.name}</span>
                          <span className={`pim-status-badge ${formatServiceStatus(typeof service === 'string' ? 'New' : service.status)}`}>
                            {typeof service === 'string' ? 'New' : service.status}
                          </span>
                        </div>
                        <div className="pim-service-timeline">
                          <div className="pim-timeline-item">
                            <i className="fas fa-play-circle"></i>
                            <span className="pim-timeline-label">Started:</span>
                            <span className="pim-timeline-value">{typeof service === 'string' ? 'Not started' : (service.started || 'Not started')}</span>
                          </div>
                          <div className="pim-timeline-item">
                            <i className="fas fa-flag-checkered"></i>
                            <span className="pim-timeline-label">Ended:</span>
                            <span className="pim-timeline-value">{typeof service === 'string' ? 'Not completed' : (service.ended || 'Not completed')}</span>
                          </div>
                          <div className="pim-timeline-item">
                            <i className="fas fa-clock"></i>
                            <span className="pim-timeline-label">Duration:</span>
                            <span className="pim-timeline-value">{typeof service === 'string' ? 'N/A' : service.duration}</span>
                          </div>
                          <div className="pim-timeline-item">
                            <i className="fas fa-user-cog"></i>
                            <span className="pim-timeline-label">Technician:</span>
                            <span className="pim-timeline-value">{typeof service === 'string' ? 'Not assigned' : service.technician}</span>
                          </div>
                        </div>
                        {typeof service !== 'string' && service.notes && (
                          <div className="pim-service-notes">
                            <span className="pim-notes-label">Notes:</span>
                            <span className="pim-notes-value">{service.notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </PermissionGate>
            )}

            {/* Additional Services Requests */}
            <PermissionGate moduleId="payment" optionId="payment_services">
              {selectedOrder.additionalServiceRequests && selectedOrder.additionalServiceRequests.map((request: any, idx: number) => (
                <div key={idx} className={`pim-additional-services ${getAdditionalServiceStatusClass(request.status)}`}>
                  <div className="pim-additional-header">
                    Additional Services Request {idx > 0 ? `#${idx + 1}` : ''}
                  </div>
                  <div className="pim-card-body">
                    <div className="pim-info-item">
                      <div className="pim-info-label">Request ID</div>
                      <div className="pim-info-value">{request.requestId}</div>
                    </div>
                    <div className="pim-info-item">
                      <div className="pim-info-label">Request Date</div>
                      <div className="pim-info-value">{request.requestDate}</div>
                    </div>
                    <div className="pim-info-item">
                      <div className="pim-info-label">Requested Service</div>
                      <div className="pim-info-value">{request.requestedService}</div>
                    </div>
                    <div className="pim-info-item">
                      <div className="pim-info-label">Status</div>
                      <div className="pim-info-value" style={{ fontWeight: 600 }}>
                        {request.status}
                      </div>
                    </div>
                    <div className="pim-info-item">
                      <div className="pim-info-label">Customer Notes</div>
                      <div className="pim-info-value">{request.customerNotes}</div>
                    </div>
                    <div className="pim-info-item">
                      <div className="pim-info-label">Estimated Price</div>
                      <div className="pim-info-value">{request.estimatedPrice}</div>
                    </div>
                  </div>
                </div>
              ))}
            </PermissionGate>

            {/* Customer Notes Card */}
            {selectedOrder.customerNotes && (
              <PermissionGate moduleId="payment" optionId="payment_notes">
                <div className="pim-detail-card" style={{ backgroundColor: '#fffbea', borderLeft: '4px solid #f59e0b' }}>
                  <h3><i className="fas fa-comment-dots"></i> Customer Notes</h3>
                  <div style={{ padding: '15px 20px', whiteSpace: 'pre-wrap', color: '#78350f', fontSize: '14px', lineHeight: '1.6' }}>
                    {selectedOrder.customerNotes}
                  </div>
                </div>
              </PermissionGate>
            )}

            <PermissionGate moduleId="payment" optionId="payment_quality">
              <div className="pim-detail-card" style={{ backgroundColor: '#e8f4f1', borderLeft: '4px solid #16a085' }}>
                <h3><i className="fas fa-clipboard-check"></i> Quality Check List</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {combinedSelectedServices.length > 0 ? (
                    combinedSelectedServices.map((service: any, idx: number) => {
                      const serviceName = typeof service === 'string' ? service : service.name;
                      const result = getQualityCheckResult(selectedOrder, service, idx) || 'Not Evaluated';
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
            </PermissionGate>

            {/* Billing Card */}
            <PermissionGate moduleId="payment" optionId="payment_billing">
              <div className="epm-detail-card">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '2px solid #e5e7eb'
              }}>
                <h3 style={{ margin: 0 }}>
                  <i className="fas fa-receipt"></i> Billing & Invoices
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <PermissionGate moduleId="payment" optionId="payment_pay">
                    <button 
                      type="button" 
                      className="pim-btn-payment" 
                      onClick={() => openPaymentPopup(selectedOrder.id)}
                      style={{ margin: 0 }}
                    >
                      <i className="fas fa-credit-card"></i> Payment
                    </button>
                  </PermissionGate>
                  <PermissionGate moduleId="payment" optionId="payment_refund">
                    {(selectedOrder.workStatus === 'Cancelled' || selectedOrder.paymentStatus === 'Fully Paid' || selectedOrder.paymentStatus === 'Partially Paid') && (
                      <button 
                        type="button" 
                        className="pim-btn-payment" 
                        onClick={() => openRefundPopup(selectedOrder.id)}
                        style={{ margin: 0, backgroundColor: '#f59e0b' }}
                      >
                        <i className="fas fa-undo"></i> Refund
                      </button>
                    )}
                  </PermissionGate>
                  <PermissionGate moduleId="payment" optionId="payment_generatebill">
                    <button 
                      type="button" 
                      className="pim-btn-download-bill"
                      onClick={() => generateBillPDF(selectedOrder)}
                      disabled={isGeneratingBill}
                      style={{ opacity: isGeneratingBill ? 0.5 : 1, cursor: isGeneratingBill ? 'not-allowed' : 'pointer' }}
                    >
                      <i className="fas fa-file-invoice-dollar"></i> {isGeneratingBill ? 'Generating...' : 'Generate Bill'}
                    </button>
                  </PermissionGate>
                </div>
              </div>
              
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
                      {selectedOrder.billing?.billId || 'N/A'}
                    </span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label"><i className="fas fa-calculator"></i> Total Bill Amount</span>
                    <span className="epm-info-value" style={{ fontSize: '17px' }}>{selectedOrder.billing?.totalAmount || 'N/A'}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label"><i className="fas fa-tag"></i> Total Discount</span>
                    <span className="epm-info-value" style={{ color: '#27ae60', fontSize: '17px' }}>{selectedOrder.billing?.discount || 'N/A'}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label"><i className="fas fa-money-bill-wave"></i> Net Amount</span>
                    <span className="epm-info-value" style={{ fontSize: '18px', fontWeight: '700', color: '#1e40af' }}>
                      {selectedOrder.billing?.netAmount || 'N/A'}
                    </span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label"><i className="fas fa-check-circle"></i> Amount Paid</span>
                    <span className="epm-info-value" style={{ color: '#27ae60', fontSize: '17px' }}>{selectedOrder.billing?.amountPaid || 'N/A'}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label"><i className="fas fa-exclamation-circle"></i> Balance Due</span>
                    <span className="epm-info-value" style={{ color: '#dc2626', fontSize: '17px', fontWeight: '600' }}>
                      {selectedOrder.billing?.balanceDue || 'N/A'}
                    </span>
                  </div>
                </div>
                {selectedOrder.billing?.paymentMethod && (
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #bae6fd' }}>
                    <div className="epm-info-item">
                      <span className="epm-info-label">Payment Method</span>
                      <span className="epm-info-value">
                        <span className={`epm-payment-method-badge ${
                          selectedOrder.billing.paymentMethod === 'Cash' ? 'epm-payment-method-cash' :
                          selectedOrder.billing.paymentMethod === 'Card' ? 'epm-payment-method-card' : 
                          'epm-payment-method-transfer'
                        }`}>
                          {selectedOrder.billing.paymentMethod}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Invoices Section */}
              {selectedOrder.billing?.invoices && selectedOrder.billing.invoices.length > 0 && (
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
                    Invoice Details ({selectedOrder.billing.invoices.length})
                  </div>
                  {selectedOrder.billing.invoices.map((invoice: any, idx: number) => (
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
                          color: '#1f2937' 
                        }}>
                          Invoice #{invoice.number}
                        </span>
                        <span className="epm-info-value" style={{ 
                          fontSize: '16px', 
                          fontWeight: '700', 
                          color: '#0369a1' 
                        }}>
                          {invoice.amount}
                        </span>
                      </div>
                      <div className="epm-invoice-details">
                        <div className="epm-detail-row">
                          <span className="epm-detail-label"><i className="fas fa-tag" style={{ marginRight: '6px', color: '#f59e0b' }}></i>Discount:</span>
                          <span className="epm-detail-value" style={{ color: '#27ae60' }}>{invoice.discount}</span>
                        </div>
                        {invoice.paymentMethod && (
                          <div className="epm-detail-row">
                            <span className="epm-detail-label"><i className="fas fa-wallet" style={{ marginRight: '6px', color: '#8b5cf6' }}></i>Payment Method:</span>
                            <span className="epm-detail-value">
                              <span className={`epm-payment-method-badge ${
                                invoice.paymentMethod === 'Cash' ? 'epm-payment-method-cash' :
                                invoice.paymentMethod === 'Card' ? 'epm-payment-method-card' : 
                                'epm-payment-method-transfer'
                              }`}>
                                {invoice.paymentMethod}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="epm-invoice-services">
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: '#64748b', 
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <i className="fas fa-list-ul" style={{ color: '#3b82f6' }}></i>
                          Services Included:
                        </div>
                        {invoice.services.map((service: any, sIdx: number) => (
                          <div key={sIdx} className="epm-service-in-invoice">
                            <i className="fas fa-check-circle" style={{ color: '#27ae60', marginRight: '10px' }}></i>
                            {service}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </PermissionGate>

            {/* Payment Activity Log */}
            {selectedOrder.paymentActivityLog && selectedOrder.paymentActivityLog.length > 0 && (
              <PermissionGate moduleId="payment" optionId="payment_paymentlog">
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
                      {[...selectedOrder.paymentActivityLog].reverse().map((payment, idx) => (
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
              </PermissionGate>
            )}

            {/* Exit Permit Details */}
            <PermissionGate moduleId="payment" optionId="payment_exitpermit">
              <div className="epm-detail-card">
                <h3><i className="fas fa-id-card"></i> Exit Permit Details</h3>
                <div className="epm-card-content">
                <div className="epm-info-item">
                  <span className="epm-info-label">Permit ID</span>
                  <span className="epm-info-value">{selectedOrder.exitPermit?.permitId || 'N/A'}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Create Date</span>
                  <span className="epm-info-value">{selectedOrder.exitPermit?.createDate || 'N/A'}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Next Service Date</span>
                  <span className="epm-info-value">{selectedOrder.exitPermit?.nextServiceDate || 'N/A'}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Created By</span>
                  <span className="epm-info-value">{selectedOrder.exitPermit?.createdBy || 'N/A'}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Collected By</span>
                  <span className="epm-info-value">{selectedOrder.exitPermit?.collectedBy || 'N/A'}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Mobile Number</span>
                  <span className="epm-info-value">{selectedOrder.exitPermit?.collectedByMobile || 'N/A'}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Permit Status</span>
                  <span className="epm-info-value">
                    <span className={`epm-status-badge ${selectedOrder.exitPermitStatus === 'Created' ? 'epm-payment-full' : 'epm-payment-unpaid'}`}>
                      {selectedOrder.exitPermitStatus || 'Not Created'}
                    </span>
                  </span>
                </div>
                </div>
              </div>
            </PermissionGate>

            {/* Documents Section */}
            {selectedOrder.documents && selectedOrder.documents.length > 0 && (
              <PermissionGate moduleId="payment" optionId="payment_documents">
                <div className="pim-detail-card">
                  <h3><i className="fas fa-folder-open"></i> Documents</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedOrder.documents.map((doc: any, idx: number) => (
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
                                {doc.type} • {doc.category}
                                {doc.paymentReference && ` • ${doc.paymentReference}`}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#6b7280', marginLeft: '30px' }}>
                            <span>
                              <i className="fas fa-calendar-alt" style={{ marginRight: '5px' }}></i>
                              {doc.uploadDate}
                            </span>
                            <span>
                              <i className="fas fa-user" style={{ marginRight: '5px' }}></i>
                              {doc.uploadedBy}
                            </span>
                          </div>
                        </div>
                        <PermissionGate moduleId="payment" optionId="payment_download">
                          <button
                            onClick={() => {
                              // Create download link
                              const link = document.createElement('a');
                              link.href = doc.fileData;
                              link.download = doc.name;
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
              </PermissionGate>
            )}
          </div>
        </div>

        {/* Popups in Details Screen - rendered before closing */}
        {createPortal(
          <>
            {/* Error Popup for Already Cancelled Order */}
            <ErrorPopup 
              isVisible={showErrorPopup}
              onClose={() => setShowErrorPopup(false)}
              message={errorMessage}
            />

            {/* Bill Already Exists Popup */}
            <ErrorPopup 
              isVisible={showBillExistsPopup}
              onClose={() => setShowBillExistsPopup(false)}
              message={billExistsMessage}
            />

            {/* Bill Generated Popup */}
            {showBillGeneratedPopup && (
              <SuccessPopup 
                isVisible={true}
                onClose={() => setShowBillGeneratedPopup(false)}
                message={
                  <>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4CAF50', display: 'block', marginBottom: '15px' }}>
                      <i className="fas fa-file-pdf"></i> Bill Generated Successfully!
                    </span>
                    <span style={{ fontSize: '1.1rem', color: '#333', display: 'block', marginTop: '10px' }}>
                      {billGeneratedMessage}
                    </span>
                  </>
                }
              />
            )}

            {/* Payment Success Popup */}
            {showSuccessPopup && (
              <SuccessPopup 
                isVisible={true}
                onClose={() => {
                  setShowSuccessPopup(false);
                  closePaymentPopup();
                  closeRefundPopup();
                }}
                message={
                  <>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4CAF50', display: 'block', marginBottom: '15px' }}>
                      <i className="fas fa-check-circle"></i> Success!
                    </span>
                    <span style={{ fontSize: '1.1rem', color: '#333', display: 'block', marginTop: '10px', whiteSpace: 'pre-line' }}>
                      {successMessage}
                    </span>
                  </>
                }
              />
            )}

            {/* Payment Popup */}
            {showPaymentPopup && currentPaymentOrder && (
              <div className="cancel-modal-overlay active">
                <div className="cancel-modal" style={{ maxWidth: '600px', width: '90%' }}>
                  <div className="cancel-modal-header">
                    <h3>
                      <i className="fas fa-credit-card"></i> Record Payment - {currentPaymentOrder.id}
                    </h3>
                  </div>
                  <div className="cancel-modal-body">
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                        <div>
                          <strong>Net Amount:</strong>
                          <div style={{ color: '#1e40af', fontWeight: '600', fontSize: '16px' }}>QAR {paymentForm.netAmount?.toFixed(2)}</div>
                        </div>
                        <div>
                          <strong>Amount Paid:</strong>
                          <div style={{ color: '#059669', fontWeight: '600', fontSize: '16px' }}>QAR {paymentForm.amountPaid?.toFixed(2)}</div>
                        </div>
                        <div>
                          <strong>Balance Due:</strong>
                          <div style={{ color: '#dc2626', fontWeight: '600', fontSize: '16px' }}>QAR {paymentForm.balance?.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <PermissionGate moduleId="payment" optionId="payment_discountfield">
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Additional Discount (QAR)</label>
                          <input
                            type="number"
                            name="discount"
                            value={paymentForm.discount}
                            onChange={handlePaymentChange}
                            min="0"
                            max={paymentDiscountLimit}
                            step="0.01"
                            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                          />
                          <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                            Role cap: QAR {paymentDiscountLimit.toFixed(2)} ({paymentDiscountRolePercent.toFixed(2)}% of total). Remaining additional: QAR {Math.max(0, paymentDiscountLimit - initialPaymentDiscount).toFixed(2)}
                          </div>
                        </div>
                      </PermissionGate>

                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Amount to Pay (QAR) *</label>
                        <input
                          type="number"
                          name="amountToPay"
                          value={paymentForm.amountToPay}
                          onChange={handlePaymentChange}
                          min="0"
                          step="0.01"
                          required
                          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Payment Method *</label>
                        <select
                          name="paymentMethod"
                          value={paymentForm.paymentMethod}
                          onChange={handlePaymentChange}
                          required
                          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                        >
                          <option value="">Select Payment Method</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="Transfer">Transfer</option>
                        </select>
                      </div>

                      {paymentForm.paymentMethod === 'Transfer' && (
                        <div>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Upload Transfer Proof *</label>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={handleFileUpload}
                            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                          />
                          {paymentForm.transferProofName && (
                            <div style={{ marginTop: '8px', fontSize: '13px', color: '#059669' }}>
                              <i className="fas fa-check-circle"></i> {paymentForm.transferProofName}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="cancel-modal-actions" style={{ marginTop: '25px' }}>
                      <button className="btn-cancel" onClick={closePaymentPopup}>
                        <i className="fas fa-times"></i> Cancel
                      </button>
                      <button className="btn-confirm-cancel" onClick={handleSavePayment} style={{ backgroundColor: '#059669' }}>
                        <i className="fas fa-check"></i> Record Payment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Refund Popup */}
            {showRefundPopup && (
              <div className="cancel-modal-overlay active">
                <div className="cancel-modal" style={{ maxWidth: '500px', width: '90%' }}>
                  <div className="cancel-modal-header">
                    <h3>
                      <i className="fas fa-undo"></i> Process Refund - {refundForm.orderId}
                    </h3>
                  </div>
                  <div className="cancel-modal-body">
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                      <div style={{ fontSize: '14px' }}>
                        <strong>Amount Paid:</strong>
                        <div style={{ color: '#92400e', fontWeight: '600', fontSize: '18px' }}>QAR {refundForm.paidAmount?.toFixed(2)}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Refund Type *</label>
                        <select
                          name="refundType"
                          value={refundForm.refundType}
                          onChange={handleRefundChange}
                          required
                          style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                        >
                          <option value="Full Refund">Full Refund</option>
                          <option value="Partial Refund">Partial Refund</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Refund Amount (QAR) *</label>
                        <input
                          type="number"
                          name="refundAmount"
                          value={refundForm.refundAmount}
                          onChange={handleRefundChange}
                          min="0"
                          max={refundForm.maxRefundAmount}
                          step="0.01"
                          disabled={refundForm.refundType === 'Full Refund'}
                          required
                          style={{ 
                            width: '100%', 
                            padding: '10px', 
                            border: '1px solid #d1d5db', 
                            borderRadius: '6px', 
                            fontSize: '14px',
                            backgroundColor: refundForm.refundType === 'Full Refund' ? '#f3f4f6' : 'white'
                          }}
                        />
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                          Maximum refund amount: QAR {refundForm.maxRefundAmount?.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="cancel-modal-actions" style={{ marginTop: '25px' }}>
                      <button className="btn-cancel" onClick={closeRefundPopup}>
                        <i className="fas fa-times"></i> Cancel
                      </button>
                      <button className="btn-confirm-cancel" onClick={handleSaveRefund} style={{ backgroundColor: '#f59e0b' }}>
                        <i className="fas fa-check"></i> Process Refund
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
      </div>
    );
  }

  return (
    <>
      <div className="pim-container">
        {/* Header */}
        <header className="pim-header">
          <div className="pim-header-left">
            <h1><i className="fas fa-file-invoice-dollar"></i> Payment & Invoice Management</h1>
          </div>
        </header>

        {/* Search Section */}
        <section className="pim-search-section">
          <div className="pim-search-container">
            <i className="fas fa-search pim-search-icon"></i>
            <input
              type="text"
              className="pim-smart-search-input"
              placeholder="Search by any details"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="pim-search-stats">
            Showing payment records (Unpaid or Partially Paid status)
          </div>
        </section>

        {/* Results Section */}
        <section className="pim-results-section">
          <div className="pim-section-header">
            <h2><i className="fas fa-list"></i> Payment & Invoice Records</h2>
            <div className="pim-pagination-controls">
              <label htmlFor="pageSizeSelect">Records per page:</label>
              <select
                id="pageSizeSelect"
                className="pim-page-size-select"
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
          </div>

          {paginatedData.length === 0 ? (
            <div className="pim-empty-state">
              <div className="pim-empty-icon"><i className="fas fa-search"></i></div>
              <div className="pim-empty-text">No matching job orders found</div>
              <div className="pim-empty-subtext">Try adjusting your search terms or clear the search to see all records</div>
            </div>
          ) : (
            <>
              <div className="pim-table-wrapper">
                <table className="pim-job-order-table">
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
                    {paginatedData.map(order => (
                      <tr key={order.id}>
                        <td className="pim-date-column">{order.createDate}</td>
                        <td>{order.id}</td>
                        <td><span className={`pim-order-type-badge ${formatOrderType(order.orderType)}`}>{order.orderType}</span></td>
                        <td>{order.customerName}</td>
                        <td>{order.mobile}</td>
                        <td>{order.vehiclePlate}</td>
                        <td><span className={`pim-status-badge ${formatWorkStatus(order.workStatus)}`}>{order.workStatus}</span></td>
                        <td><span className={`pim-status-badge ${formatPaymentStatus(order.paymentStatus)}`}>{order.paymentStatus}</span></td>
                        <td>
                          <PermissionGate moduleId="payment" optionId="payment_actions">
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

                {/* Action Dropdown Menu */}
                {activeDropdown && typeof document !== 'undefined' && createPortal(
                  <div className="action-dropdown-menu show action-dropdown-menu-fixed" style={{top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`}}>
                    <PermissionGate moduleId="payment" optionId="payment_viewdetails">
                      <button className="dropdown-item view" onClick={() => {
                        const order = allOrders.find(o => o.id === activeDropdown);
                        if (order) {
                          setSelectedOrder(order);
                          setShowDetailsScreen(true);
                          setActiveDropdown(null);
                        }
                      }}>
                        <i className="fas fa-eye"></i> View Details
                      </button>
                    </PermissionGate>
                    <PermissionGate moduleId="payment" optionId="payment_cancel">
                      <>
                        <div className="dropdown-divider"></div>
                        <button className="dropdown-item delete" onClick={() => handleShowCancelConfirmation(activeDropdown)}>
                          <i className="fas fa-times-circle"></i> Cancel Order
                        </button>
                      </>
                    </PermissionGate>
                  </div>,
                  document.body
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pim-pagination">
                  <button
                    className="pim-pagination-btn"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <div className="pim-page-numbers">
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
                          className={`pim-pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className="pim-pagination-btn"
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

        {/* Footer */}
        <footer className="pim-footer">
          <p>Service Management System © 2023 | Payment & Invoice Management Module</p>
        </footer>

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
        {showSuccessPopup && lastAction === 'cancel' && (
          <SuccessPopup 
            isVisible={true}
            onClose={() => {
              setShowSuccessPopup(false);
              setLastAction('cancel');
            }}
            message={
              <>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4CAF50', display: 'block', marginBottom: '15px' }}>
                  <i className="fas fa-check-circle"></i> Order Cancelled Successfully!
                </span>
                <span style={{ fontSize: '1.1rem', color: '#333', display: 'block', marginTop: '10px' }}>
                  <strong>Job Order ID:</strong> <span style={{ color: '#2196F3', fontWeight: '600' }}>{submittedOrderId}</span>
                </span>
              </>
            }
          />
        )}
      </div>

      {/* Popups rendered outside container to avoid overflow:hidden clipping */}
      {createPortal(
        <>
          {/* Error Popup for Already Cancelled Order */}
          <ErrorPopup 
            isVisible={showErrorPopup}
            onClose={() => setShowErrorPopup(false)}
            message={errorMessage}
          />

          {/* Bill Already Exists Popup */}
          <ErrorPopup 
            isVisible={showBillExistsPopup}
            onClose={() => setShowBillExistsPopup(false)}
            message={billExistsMessage}
          />

          {/* Bill Generated Popup */}
          {showBillGeneratedPopup && (
            <SuccessPopup 
              isVisible={true}
              onClose={() => setShowBillGeneratedPopup(false)}
              message={
                <>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4CAF50', display: 'block', marginBottom: '15px' }}>
                    <i className="fas fa-file-pdf"></i> Bill Generated Successfully!
                  </span>
                  <span style={{ fontSize: '1.1rem', color: '#333', display: 'block', marginTop: '10px' }}>
                    {billGeneratedMessage}
                  </span>
                </>
              }
            />
          )}
        </>,
        document.body
      )}
    </>
  );
}