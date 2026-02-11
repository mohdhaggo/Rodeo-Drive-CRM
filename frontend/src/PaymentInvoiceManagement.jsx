import React, { useState, useEffect } from 'react';
import './PaymentInvoiceManagement.css';
import { getStoredJobOrders } from './demoData';

export default function PaymentInvoiceManagement() {
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
  const [allOrders, setAllOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showDetailsScreen, setShowDetailsScreen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [currentPaymentOrder, setCurrentPaymentOrder] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    discount: '0',
    amountToPay: '',
    paymentMethod: '',
    transferProof: null,
    transferProofName: '',
    balance: 0
  });
  const [currentUser] = useState({
    name: 'System User',
    role: 'Cashier'
  });

  // Calculate pagination
  const totalPages = Math.ceil(searchResults.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = searchResults.slice(startIndex, endIndex);

  useEffect(() => {
    const orders = getStoredJobOrders();
    setAllOrders(orders);
  }, []);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(allOrders.filter(o => o.paymentStatus !== 'Fully Paid'));
    } else {
      const query = searchQuery.toLowerCase();
      const results = allOrders.filter(order => {
        if (order.paymentStatus === 'Fully Paid') return false;
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
        setSelectedOrder(updatedOrder);
      }
    }
  }, [allOrders]);

  const openDetailsView = (orderId) => {
    const order = allOrders.find(o => o.id === orderId);
    setSelectedOrder(order);
    setShowDetailsScreen(true);
  };

  const closeDetailsView = () => {
    setShowDetailsScreen(false);
    setSelectedOrder(null);
  };

  const openPaymentPopup = (orderId) => {
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
      const netAmount = parseFloat(order.billing.netAmount.replace(/[^0-9.-]+/g, '')) || 0;
      const amountPaid = parseFloat(order.billing.amountPaid.replace(/[^0-9.-]+/g, '')) || 0;
      const discount = parseFloat(order.billing.discount.replace(/[^0-9.-]+/g, '')) || 0;
      const balance = netAmount - amountPaid - discount;

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
    setPaymentForm({
      discount: '',
      amountToPay: '',
      paymentMethod: '',
      transferProof: null,
      transferProofName: ''
    });
  };

  const generateBillPDF = (order) => {
    // Create HTML content for the bill
    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; color: #1a1a1a; }
          .bill-title { font-size: 20px; margin-top: 10px; color: #666; }
          .section { margin: 20px 0; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
          .info-label { font-weight: 600; color: #555; }
          .info-value { color: #333; }
          .total-section { background-color: #f8f9fa; padding: 15px; margin-top: 20px; border-radius: 5px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
          .grand-total { font-size: 18px; font-weight: bold; color: #1a1a1a; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f8f9fa; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Rodeo Drive CRM</div>
          <div class="bill-title">INVOICE / BILL</div>
        </div>

        <div class="section">
          <div class="section-title">Bill Information</div>
          <div class="info-row">
            <span class="info-label">Bill ID:</span>
            <span class="info-value">${order.billing?.billId || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Job Order ID:</span>
            <span class="info-value">${order.id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Order Type:</span>
            <span class="info-value">${order.orderType}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Customer Information</div>
          <div class="info-row">
            <span class="info-label">Customer Name:</span>
            <span class="info-value">${order.customerName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Mobile:</span>
            <span class="info-value">${order.mobile}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Vehicle Plate:</span>
            <span class="info-value">${order.vehiclePlate}</span>
          </div>
        </div>

        ${order.services && order.services.length > 0 ? `
        <div class="section">
          <div class="section-title">Services</div>
          <table>
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Status</th>
                <th>Technician</th>
              </tr>
            </thead>
            <tbody>
              ${order.services.map(service => `
                <tr>
                  <td>${service.name}</td>
                  <td>${service.status}</td>
                  <td>${service.technician}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="total-section">
          <div class="total-row">
            <span class="info-label">Total Amount:</span>
            <span class="info-value">${order.billing?.totalAmount || 'QAR 0.00'}</span>
          </div>
          <div class="total-row">
            <span class="info-label">Discount:</span>
            <span class="info-value">${order.billing?.discount || 'QAR 0.00'}</span>
          </div>
          <div class="total-row grand-total">
            <span class="info-label">Net Amount:</span>
            <span class="info-value">${order.billing?.netAmount || 'QAR 0.00'}</span>
          </div>
          <div class="total-row">
            <span class="info-label">Amount Paid:</span>
            <span class="info-value">${order.billing?.amountPaid || 'QAR 0.00'}</span>
          </div>
          <div class="total-row" style="color: ${order.billing?.balanceDue !== 'QAR 0.00' ? '#dc2626' : '#059669'}; font-weight: bold;">
            <span class="info-label">Balance Due:</span>
            <span class="info-value">${order.billing?.balanceDue || 'QAR 0.00'}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Rodeo Drive CRM - Service Management System</p>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </body>
      </html>
    `;

    // Convert HTML to data URL
    const blob = new Blob([billHTML], { type: 'text/html' });
    const reader = new FileReader();
    reader.onloadend = () => {
      const billData = reader.result;
      
      // Save to documents
      const updatedOrders = allOrders.map(o => {
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
            uploadedBy: currentUser.name,
            fileData: billData,
            billReference: order.billing?.billId
          });
          return { ...o, documents };
        }
        return o;
      });

      setAllOrders(updatedOrders);
      localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));

      // Open in new window for printing/saving
      const printWindow = window.open('', '_blank');
      printWindow.document.write(billHTML);
      printWindow.document.close();
      
      alert('Bill generated and saved to documents!');
    };
    reader.readAsDataURL(blob);
  };

  const downloadLatestBill = (order) => {
    const billDocs = (order.documents || []).filter(doc => doc.type === 'Invoice/Bill');
    
    if (billDocs.length === 0) {
      // Generate new bill if none exists
      generateBillPDF(order);
    } else {
      // Download the latest bill
      const latestBill = billDocs[billDocs.length - 1];
      const link = document.createElement('a');
      link.href = latestBill.fileData;
      link.download = latestBill.name;
      link.click();
      
      // Open in new window
      const printWindow = window.open('', '_blank');
      fetch(latestBill.fileData)
        .then(response => response.text())
        .then(html => {
          printWindow.document.write(html);
          printWindow.document.close();
        });
    }
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'discount' || name === 'amountToPay') {
        const discount = parseFloat(updated.discount) || 0;
        const amountToPay = parseFloat(updated.amountToPay) || 0;
        const balance = prev.netAmount - prev.amountPaid - discount - amountToPay;
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
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
        setPaymentForm(prev => ({
          ...prev,
          transferProof: reader.result,
          transferProofName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePayment = () => {
    if (!paymentForm.paymentMethod) {
      alert('Please select a payment method.');
      return;
    }
    if (paymentForm.amountToPay <= 0) {
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
        const discount = parseFloat(paymentForm.discount) || 0;
        const amountToPay = parseFloat(paymentForm.amountToPay);
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
            uploadedBy: currentUser.name,
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
              cashierName: currentUser.name,
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
    
    const successMessage = paymentForm.paymentMethod === 'Transfer' 
      ? `Payment of QAR ${parseFloat(paymentForm.amountToPay).toFixed(2)} saved successfully!\nTransfer proof has been uploaded to documents.`
      : `Payment of QAR ${parseFloat(paymentForm.amountToPay).toFixed(2)} saved successfully!`;
    
    alert(successMessage);
    closePaymentPopup();
  };

  const formatWorkStatus = (status) => {
    switch (status) {
      case 'New Request': return 'pim-status-new-request';
      case 'Inspection': return 'pim-status-inspection';
      case 'Inprogress': return 'pim-status-inprogress';
      case 'Quality Check': return 'pim-status-quality-check';
      case 'Ready': return 'pim-status-ready';
      case 'Completed': return 'pim-status-completed';
      default: return 'pim-status-inprogress';
    }
  };

  const formatPaymentStatus = (status) => {
    switch (status) {
      case 'Fully Paid': return 'pim-payment-full';
      case 'Partially Paid': return 'pim-payment-partial';
      case 'Unpaid': return 'pim-payment-unpaid';
      default: return 'pim-payment-unpaid';
    }
  };

  const formatOrderType = (type) => {
    return type === 'New Job Order' ? 'pim-order-type-new-job' : 'pim-order-type-service';
  };

  const getStepStatusClass = (stepStatus) => {
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

  const getStepIcon = (stepStatus) => {
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

  const formatStepStatus = (status) => {
    switch (status) {
      case 'New': return 'pim-status-new';
      case 'Completed': return 'pim-status-completed';
      case 'InProgress': return 'pim-status-inprogress';
      case 'Pending': return 'pim-status-pending';
      case 'Upcoming': return 'pim-status-pending';
      default: return 'pim-status-pending';
    }
  };

  const formatServiceStatus = (status) => {
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

  const getAdditionalServiceStatusClass = (status) => {
    switch (status) {
      case 'Pending Approval': return 'pim-pending';
      case 'Approved': return 'pim-approved';
      case 'Declined': return 'pim-declined';
      default: return 'pim-pending';
    }
  };

  const formatInvoiceStatus = (status) => {
    switch (status) {
      case 'Paid': return 'pim-payment-full';
      case 'Partially Paid': return 'pim-payment-partial';
      case 'Unpaid': return 'pim-payment-unpaid';
      default: return 'pim-payment-unpaid';
    }
  };

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
                  <span className="epm-info-value"><span className={`epm-status-badge ${selectedOrder.workStatus === 'Ready' ? 'epm-status-completed' : selectedOrder.workStatus === 'In Progress' ? 'epm-status-inprogress' : 'epm-status-new'}`}>{selectedOrder.workStatus}</span></span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Payment Status</span>
                  <span className="epm-info-value"><span className={`epm-status-badge ${selectedOrder.paymentStatus === 'Fully Paid' ? 'epm-payment-full' : selectedOrder.paymentStatus === 'Partially Paid' ? 'epm-payment-partial' : 'epm-payment-unpaid'}`}>{selectedOrder.paymentStatus}</span></span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Exit Permit Status</span>
                  <span className="epm-info-value"><span className={`epm-status-badge epm-permit-created`}>Created</span></span>
                </div>
              </div>
            </div>

            {/* Roadmap */}
            {selectedOrder.roadmap && (
              <div className="pim-detail-card">
                <h3><i className="fas fa-map-signs"></i> Job Order Roadmap</h3>
                <div className="pim-roadmap-container">
                  <div className="pim-roadmap-steps">
                    {selectedOrder.roadmap.map((step, idx) => (
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
              <div className="pim-detail-card">
                <h3><i className="fas fa-user"></i> Customer Details</h3>
                <div className="pim-card-content">
                  <div className="pim-info-item">
                    <span className="pim-info-label">Customer ID</span>
                    <span className="pim-info-value">{selectedOrder.customerDetails.customerId}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Customer Name</span>
                    <span className="pim-info-value">{selectedOrder.customerName}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Mobile Number</span>
                    <span className="pim-info-value">{selectedOrder.mobile}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Email Address</span>
                    <span className="pim-info-value">{selectedOrder.customerDetails.email}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Registered Vehicles</span>
                    <span className="pim-info-value">{selectedOrder.customerDetails.registeredVehicles}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Customer Since</span>
                    <span className="pim-info-value">{selectedOrder.customerDetails.customerSince}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Details */}
            {selectedOrder.vehicleDetails && (
              <div className="pim-detail-card">
                <h3><i className="fas fa-car"></i> Vehicle Details</h3>
                <div className="pim-card-content">
                  <div className="pim-info-item">
                    <span className="pim-info-label">Vehicle ID</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.vehicleId}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Owned By</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.ownedBy}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Make</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.make}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Model</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.model}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Year</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.year}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Type</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.type}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Color</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.color}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Plate Number</span>
                    <span className="pim-info-value">{selectedOrder.vehiclePlate}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">VIN</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.vin}</span>
                  </div>
                  <div className="pim-info-item">
                    <span className="pim-info-label">Registration Date</span>
                    <span className="pim-info-value">{selectedOrder.vehicleDetails.registrationDate}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Services */}
            {selectedOrder.services && selectedOrder.services.length > 0 && (
              <div className="pim-detail-card">
                <h3><i className="fas fa-tasks"></i> Services Summary</h3>
                <div className="pim-services-list">
                  {selectedOrder.services.map((service, idx) => (
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
                          <span className="pim-timeline-value">{service.started || 'Not started'}</span>
                        </div>
                        <div className="pim-timeline-item">
                          <i className="fas fa-flag-checkered"></i>
                          <span className="pim-timeline-label">Ended:</span>
                          <span className="pim-timeline-value">{service.ended || 'Not completed'}</span>
                        </div>
                        <div className="pim-timeline-item">
                          <i className="fas fa-clock"></i>
                          <span className="pim-timeline-label">Duration:</span>
                          <span className="pim-timeline-value">{service.duration}</span>
                        </div>
                        <div className="pim-timeline-item">
                          <i className="fas fa-user-cog"></i>
                          <span className="pim-timeline-label">Technician:</span>
                          <span className="pim-timeline-value">{service.technician}</span>
                        </div>
                      </div>
                      {service.notes && (
                        <div className="pim-service-notes">
                          <span className="pim-notes-label">Notes:</span>
                          <span className="pim-notes-value">{service.notes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Services Requests */}
            {selectedOrder.additionalServiceRequests && selectedOrder.additionalServiceRequests.map((request, idx) => (
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

            {/* Customer Notes Card */}
            {selectedOrder.customerNotes && (
              <div className="pim-detail-card" style={{ backgroundColor: '#fffbea', borderLeft: '4px solid #f59e0b' }}>
                <h3><i className="fas fa-comment-dots"></i> Customer Notes</h3>
                <div style={{ padding: '15px 20px', whiteSpace: 'pre-wrap', color: '#78350f', fontSize: '14px', lineHeight: '1.6' }}>
                  {selectedOrder.customerNotes}
                </div>
              </div>
            )}

            {/* Billing Card */}
            <div className="pim-detail-card">
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
                  <button 
                    type="button" 
                    className="pim-btn-payment" 
                    onClick={() => openPaymentPopup(selectedOrder.id)}
                    style={{ margin: 0 }}
                  >
                    <i className="fas fa-credit-card"></i> Payment
                  </button>
                  <button 
                    type="button" 
                    className="pim-btn-download-bill"
                    onClick={() => downloadLatestBill(selectedOrder)}
                  >
                    <i className="fas fa-download"></i> Download Bill
                  </button>
                </div>
              </div>
              <div className="pim-card-content">
                <div className="pim-info-item">
                  <span className="pim-info-label">Bill ID</span>
                  <span className="pim-info-value">{selectedOrder.billing?.billId}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Total Amount</span>
                  <span className="pim-info-value">{selectedOrder.billing?.totalAmount}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Discount</span>
                  <span className="pim-info-value">{selectedOrder.billing?.discount}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Net Amount</span>
                  <span className="pim-info-value">{selectedOrder.billing?.netAmount}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Amount Paid</span>
                  <span className="pim-info-value">{selectedOrder.billing?.amountPaid}</span>
                </div>
                <div className="pim-info-item">
                  <span className="pim-info-label">Balance Due</span>
                  <span className="pim-info-value">{selectedOrder.billing?.balanceDue}</span>
                </div>
              </div>

              {/* Invoices */}
              {selectedOrder.billing?.invoices && selectedOrder.billing.invoices.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  {selectedOrder.billing.invoices.map((invoice, idx) => (
                    <div key={idx} className="pim-invoice-item">
                      <div className="pim-invoice-header">
                        <span>Invoice #{invoice.number}</span>
                        <span>Amount: {invoice.amount}</span>
                        <span>Status: <span className={`pim-status-badge ${formatInvoiceStatus(invoice.status)}`}>{invoice.status}</span></span>
                      </div>
                      <div className="pim-invoice-details">
                        <div className="pim-detail-row">
                          <span className="pim-detail-label">Discount:</span>
                          <span className="pim-detail-value">{invoice.discount}</span>
                        </div>
                        {invoice.paymentMethod && (
                          <div className="pim-detail-row">
                            <span className="pim-detail-label">Payment Method:</span>
                            <span className="pim-detail-value">{invoice.paymentMethod}</span>
                          </div>
                        )}
                      </div>
                      <div className="pim-invoice-services">
                        {invoice.services.map((service, sIdx) => (
                          <div key={sIdx} className="pim-service-in-invoice">
                            • {service}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Activity Log */}
            {selectedOrder.paymentActivityLog && selectedOrder.paymentActivityLog.length > 0 && (
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
            )}

            {/* Documents Section */}
            {selectedOrder.documents && selectedOrder.documents.length > 0 && (
              <div className="pim-detail-card">
                <h3><i className="fas fa-folder-open"></i> Documents</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedOrder.documents.map((doc, idx) => (
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Popup */}
        {showPaymentPopup && (
          <div className="pim-payment-popup-overlay">
            <div className="pim-payment-popup">
              <h3><i className="fas fa-credit-card"></i> Process Payment</h3>
              <form>
                <div className="pim-payment-form-group">
                  <label>Net Amount</label>
                  <input type="text" value={`QAR ${paymentForm.netAmount?.toFixed(2)}`} readOnly />
                </div>
                <div className="pim-payment-form-group">
                  <label>Discount (QAR)</label>
                  <input
                    type="number"
                    name="discount"
                    min="0"
                    step="0.01"
                    value={paymentForm.discount}
                    onChange={handlePaymentChange}
                    placeholder="Enter discount amount"
                  />
                </div>
                <div className="pim-payment-form-group">
                  <label>Amount to be Paid (QAR)</label>
                  <input
                    type="number"
                    name="amountToPay"
                    min="0"
                    step="0.01"
                    value={paymentForm.amountToPay}
                    onChange={handlePaymentChange}
                    placeholder="Enter payment amount"
                  />
                </div>
                <div className="pim-payment-form-group">
                  <label>Balance (QAR)</label>
                  <input type="text" value={`QAR ${paymentForm.balance?.toFixed(2)}`} readOnly />
                </div>
                <div className="pim-payment-form-group">
                  <label>Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={paymentForm.paymentMethod}
                    onChange={handlePaymentChange}
                  >
                    <option value="">Select Payment Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="PayLater">PayLater</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                {paymentForm.paymentMethod === 'Transfer' && (
                  <div className="pim-payment-form-group">
                    <label style={{ color: '#dc2626', fontWeight: '600' }}>
                      <i className="fas fa-asterisk" style={{ fontSize: '8px', marginRight: '5px' }}></i>
                      Proof of Transfer (Required)
                    </label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileUpload}
                      style={{
                        padding: '10px',
                        border: '2px dashed #e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                    {paymentForm.transferProofName && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#15803d',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <i className="fas fa-check-circle"></i>
                        <span>{paymentForm.transferProofName}</span>
                      </div>
                    )}
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginTop: '6px'
                    }}>
                      Accepted formats: JPG, PNG, PDF (Max 5MB)
                    </div>
                  </div>
                )}
                <div className="pim-payment-actions">
                  <button type="button" className="pim-btn-save-payment" onClick={handleSavePayment}>
                    <i className="fas fa-save"></i> Save Payment
                  </button>
                  <button type="button" className="pim-btn-cancel-payment" onClick={closePaymentPopup}>
                    <i className="fas fa-times"></i> Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
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
                        <button className="pim-btn-view" onClick={() => openDetailsView(order.id)}>
                          <i className="fas fa-eye"></i> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* Payment Popup */}
      {showPaymentPopup && (
        <div className="pim-payment-popup-overlay">
          <div className="pim-payment-popup">
            <h3><i className="fas fa-credit-card"></i> Process Payment</h3>
            <form>
              <div className="pim-payment-form-group">
                <label>Net Amount</label>
                <input type="text" value={`QAR ${paymentForm.netAmount?.toFixed(2)}`} readOnly />
              </div>
              <div className="pim-payment-form-group">
                <label>Discount (QAR)</label>
                <input
                  type="number"
                  name="discount"
                  min="0"
                  step="0.01"
                  value={paymentForm.discount}
                  onChange={handlePaymentChange}
                  placeholder="Enter discount amount"
                />
              </div>
              <div className="pim-payment-form-group">
                <label>Amount to be Paid (QAR)</label>
                <input
                  type="number"
                  name="amountToPay"
                  min="0"
                  step="0.01"
                  value={paymentForm.amountToPay}
                  onChange={handlePaymentChange}
                  placeholder="Enter payment amount"
                />
              </div>
              <div className="pim-payment-form-group">
                <label>Balance (QAR)</label>
                <input type="text" value={`QAR ${paymentForm.balance?.toFixed(2)}`} readOnly />
              </div>
              <div className="pim-payment-form-group">
                <label>Payment Method</label>
                <select
                  name="paymentMethod"
                  value={paymentForm.paymentMethod}
                  onChange={handlePaymentChange}
                >
                  <option value="">Select Payment Method</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="PayLater">PayLater</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              {paymentForm.paymentMethod === 'Transfer' && (
                <div className="pim-payment-form-group">
                  <label style={{ color: '#dc2626', fontWeight: '600' }}>
                    <i className="fas fa-asterisk" style={{ fontSize: '8px', marginRight: '5px' }}></i>
                    Proof of Transfer (Required)
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileUpload}
                    style={{
                      padding: '10px',
                      border: '2px dashed #e5e7eb',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  />
                  {paymentForm.transferProofName && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <i className="fas fa-check-circle"></i>
                      <span>{paymentForm.transferProofName}</span>
                    </div>
                  )}
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '6px'
                  }}>
                    Accepted formats: JPG, PNG, PDF (Max 5MB)
                  </div>
                </div>
              )}
              <div className="pim-payment-actions">
                <button type="button" className="pim-btn-save-payment" onClick={handleSavePayment}>
                  <i className="fas fa-save"></i> Save Payment
                </button>
                <button type="button" className="pim-btn-cancel-payment" onClick={closePaymentPopup}>
                  <i className="fas fa-times"></i> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
