import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ExitPermitManagement.css';
import { getStoredJobOrders, updateCompletedServiceCounts } from './demoData';
import SuccessPopup from './SuccessPopup';
import ErrorPopup from './ErrorPopup';
import PermissionGate from './PermissionGate';

// Demo Job Orders Data
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
      exitPermitStatus: 'Not Created',
      
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
        permitId: null,
        createDate: null,
        nextServiceDate: null,
        createdBy: null,
        collectedBy: null,
        collectedByMobile: null
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
      exitPermitStatus: 'Not Created',
      
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
        },
        {
          step: 'Inspection',
          stepStatus: 'completed',
          startTimestamp: '15 Oct 2023, 09:00 AM',
          endTimestamp: '15 Oct 2023, 10:00 AM',
          actionBy: 'Michael Brown (Inspector)',
          status: 'Completed'
        },
        {
          step: 'In Progress',
          stepStatus: 'cancelled',
          startTimestamp: '15 Oct 2023, 10:00 AM',
          endTimestamp: '15 Oct 2023, 10:30 AM',
          actionBy: 'Customer Request',
          status: 'Cancelled'
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
          status: 'Cancelled',
          started: '15 Oct 2023, 10:00 AM',
          ended: null,
          duration: 'Cancelled',
          technician: 'Michael Brown',
          notes: 'Order cancelled by customer before completion.'
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
            status: 'Cancelled',
            paymentMethod: null,
            services: ['Engine Diagnostic']
          }
        ]
      },
      
      exitPermit: {
        permitId: null,
        createDate: null,
        nextServiceDate: null,
        createdBy: null,
        collectedBy: null,
        collectedByMobile: null
      },
      
      paymentActivityLog: []
    },
    {
      id: 'JO-2023-001243',
      orderType: 'New Job Order',
      customerName: 'Mohammed Ali',
      mobile: '+971 52 456 7890',
      vehiclePlate: 'AUH-XY456',
      workStatus: 'Ready',
      paymentStatus: 'Fully Paid',
      createDate: '13 Oct 2023',
      exitPermitStatus: 'Not Created',
      
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
        },
        {
          step: 'Inspection',
          stepStatus: 'completed',
          startTimestamp: '13 Oct 2023, 01:30 PM',
          endTimestamp: '14 Oct 2023, 08:30 AM',
          actionBy: 'Ahmed Rahman (Inspector)',
          status: 'Completed'
        },
        {
          step: 'In Progress',
          stepStatus: 'completed',
          startTimestamp: '14 Oct 2023, 08:30 AM',
          endTimestamp: '14 Oct 2023, 03:45 PM',
          actionBy: 'Ahmed Rahman (Technician)',
          status: 'Completed'
        },
        {
          step: 'Quality Check',
          stepStatus: 'completed',
          startTimestamp: '14 Oct 2023, 04:00 PM',
          endTimestamp: '15 Oct 2023, 09:00 AM',
          actionBy: 'Sarah Miller (Quality Inspector)',
          status: 'Completed'
        },
        {
          step: 'Ready for Delivery',
          stepStatus: 'completed',
          startTimestamp: '15 Oct 2023, 09:00 AM',
          endTimestamp: '15 Oct 2023, 05:30 PM',
          actionBy: 'Lisa Park (Supervisor)',
          status: 'Completed'
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
        }
      ],
      
      billing: {
        billId: 'BILL-2023-001243',
        totalAmount: 'QAR 3,200.00',
        discount: 'QAR 200.00',
        netAmount: 'QAR 3,000.00',
        amountPaid: 'QAR 3,000.00',
        balanceDue: 'QAR 0.00',
        paymentMethod: 'Cash',
        invoices: [
          {
            number: 'INV-2023-001243-1',
            amount: 'QAR 2,000.00',
            discount: 'QAR 150.00',
            status: 'Paid',
            paymentMethod: 'Cash',
            services: ['Annual Maintenance Service']
          }
        ]
      },
      
      exitPermit: {
        permitId: null,
        createDate: null,
        nextServiceDate: null,
        createdBy: null,
        collectedBy: null,
        collectedByMobile: null
      },
      
      paymentActivityLog: [
        {
          serial: 1,
          amount: 'QAR 3,000.00',
          discount: 'QAR 200.00',
          paymentMethod: 'Cash',
          cashierName: 'Robert Chen',
          timestamp: '15 Oct 2023, 04:15 PM'
        }
      ]
    },
    {
      id: 'JO-2023-001242',
      orderType: 'Service Order',
      customerName: 'Fatima Rahman',
      mobile: '+971 56 321 0987',
      vehiclePlate: 'RAK-7890Z',
      workStatus: 'Completed',
      paymentStatus: 'Fully Paid',
      createDate: '12 Oct 2023',
      exitPermitStatus: 'Created',
      
      jobOrderSummary: {
        createDate: '12 Oct 2023, 11:20 AM',
        createdBy: 'Lisa Park (Sales Agent)',
        expectedDelivery: '15 Oct 2023, 02:00 PM'
      },
      
      roadmap: [
        {
          step: 'New Request',
          stepStatus: 'completed',
          startTimestamp: '12 Oct 2023, 11:20 AM',
          endTimestamp: '12 Oct 2023, 03:00 PM',
          actionBy: 'Lisa Park (Sales Agent)',
          status: 'Completed'
        },
        {
          step: 'Inspection',
          stepStatus: 'completed',
          startTimestamp: '12 Oct 2023, 03:00 PM',
          endTimestamp: '13 Oct 2023, 10:15 AM',
          actionBy: 'David Lee (Inspector)',
          status: 'Completed'
        },
        {
          step: 'In Progress',
          stepStatus: 'completed',
          startTimestamp: '13 Oct 2023, 10:15 AM',
          endTimestamp: '13 Oct 2023, 11:30 AM',
          actionBy: 'David Lee (Technician)',
          status: 'Completed'
        },
        {
          step: 'Quality Check',
          stepStatus: 'completed',
          startTimestamp: '13 Oct 2023, 11:45 AM',
          endTimestamp: '13 Oct 2023, 12:45 PM',
          actionBy: 'Michael Brown (Quality Inspector)',
          status: 'Completed'
        },
        {
          step: 'Ready for Delivery',
          stepStatus: 'completed',
          startTimestamp: '13 Oct 2023, 01:00 PM',
          endTimestamp: '13 Oct 2023, 02:00 PM',
          actionBy: 'Lisa Park (Supervisor)',
          status: 'Completed'
        },
        {
          step: 'Exit Permit Issued',
          stepStatus: 'completed',
          startTimestamp: '13 Oct 2023, 02:00 PM',
          endTimestamp: '13 Oct 2023, 02:00 PM',
          actionBy: 'System User',
          status: 'Completed'
        }
      ],
      
      customerDetails: {
        customerId: 'CUST-2023-001242',
        email: 'fatima.r@example.com',
        registeredVehicles: '2 vehicles',
        customerSince: '22 Nov 2022'
      },
      
      vehicleDetails: {
        vehicleId: 'VEH-001242',
        ownedBy: 'Fatima Rahman',
        make: 'Honda',
        model: 'Civic',
        year: '2022',
        type: 'Sedan',
        color: 'Blue',
        vin: '2HGFG4B58FH123456',
        registrationDate: '25 Nov 2022'
      },
      
      services: [
        {
          name: 'Battery Replacement',
          status: 'Completed',
          started: '13 Oct 2023, 10:15 AM',
          ended: '13 Oct 2023, 11:30 AM',
          duration: '1 hour 15 minutes',
          technician: 'David Lee',
          notes: 'Replaced with OEM battery. System reset performed.'
        }
      ],
      
      billing: {
        billId: 'BILL-2023-001242',
        totalAmount: 'QAR 850.00',
        discount: 'QAR 50.00',
        netAmount: 'QAR 800.00',
        amountPaid: 'QAR 800.00',
        balanceDue: 'QAR 0.00',
        paymentMethod: 'Transfer',
        invoices: [
          {
            number: 'INV-2023-001242-1',
            amount: 'QAR 850.00',
            discount: 'QAR 50.00',
            status: 'Paid',
            paymentMethod: 'Transfer',
            services: ['Battery Replacement']
          }
        ]
      },
      
      exitPermit: {
        permitId: 'PERMIT-2023-001242',
        createDate: '13 Oct 2023, 12:45 PM',
        nextServiceDate: '12 Apr 2024',
        createdBy: 'Michael Brown (Supervisor)',
        collectedBy: 'Fatima Rahman (Customer)',
        collectedByMobile: '+971 56 321 0987'
      },
      
      paymentActivityLog: [
        {
          serial: 1,
          amount: 'QAR 850.00',
          discount: 'QAR 50.00',
          paymentMethod: 'Transfer',
          cashierName: 'Lisa Park',
          timestamp: '13 Oct 2023, 11:45 AM'
        }
      ]
    }
  ];

  // Add more demo records
  const orderTypes = ['New Job Order', 'Service Order'];
  const paymentMethods = ['Cash', 'Card', 'Transfer', 'Cheque'];
  
  for (let i = 1; i <= 30; i++) {
    const templateIndex = i % 4;
    const template = baseOrders[templateIndex];
    const orderTypeIndex = i % orderTypes.length;
    
    const newOrder = JSON.parse(JSON.stringify(template));
    newOrder.id = `JO-2023-00${239 - i}`;
    newOrder.orderType = orderTypes[orderTypeIndex];
    newOrder.customerName = `Customer ${239 - i}`;
    newOrder.mobile = `+971 5${Math.floor(Math.random() * 9)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`;
    newOrder.vehiclePlate = `${['DXB', 'SHJ', 'AUH', 'RAK', 'FJH', 'AJM'][Math.floor(Math.random() * 6)]}-${Math.floor(1000 + Math.random() * 9000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    
    const random = Math.random();
    
    if (random < 0.4) {
      newOrder.workStatus = 'Ready';
      newOrder.paymentStatus = 'Fully Paid';
      newOrder.exitPermitStatus = 'Not Created';
      newOrder.exitPermit = {
        permitId: null,
        createDate: null,
        nextServiceDate: null,
        createdBy: null,
        collectedBy: null,
        collectedByMobile: null
      };
    } else if (random < 0.6) {
      newOrder.workStatus = 'Completed';
      newOrder.paymentStatus = 'Fully Paid';
      newOrder.exitPermitStatus = 'Created';
      newOrder.exitPermit = {
        permitId: `PERMIT-2023-00${239 - i}`,
        createDate: `${Math.floor(Math.random() * 30) + 1} Oct 2023, 03:15 PM`,
        nextServiceDate: `${Math.floor(Math.random() * 30) + 1} Apr 2024`,
        createdBy: 'System Admin',
        collectedBy: `${newOrder.customerName} (Customer)`,
        collectedByMobile: newOrder.mobile
      };
    } else if (random < 0.7) {
      newOrder.workStatus = 'Ready';
      newOrder.paymentStatus = Math.random() > 0.5 ? 'Partially Paid' : 'Unpaid';
      newOrder.exitPermitStatus = 'Not Created';
      newOrder.exitPermit = {
        permitId: null,
        createDate: null,
        nextServiceDate: null,
        createdBy: null,
        collectedBy: null,
        collectedByMobile: null
      };
    } else if (random < 0.9) {
      newOrder.workStatus = 'Cancelled';
      newOrder.paymentStatus = Math.random() > 0.5 ? 'Fully Refunded' : 'Unpaid';
      newOrder.exitPermitStatus = 'Not Created';
      newOrder.exitPermit = {
        permitId: null,
        createDate: null,
        nextServiceDate: null,
        createdBy: null,
        collectedBy: null,
        collectedByMobile: null
      };
    } else {
      newOrder.workStatus = 'Cancelled';
      newOrder.paymentStatus = Math.random() > 0.5 ? 'Fully Refunded' : 'Unpaid';
      newOrder.exitPermitStatus = 'Created';
      newOrder.exitPermit = {
        permitId: `PERMIT-2023-00${239 - i}`,
        createDate: `${Math.floor(Math.random() * 30) + 1} Oct 2023, 03:15 PM`,
        nextServiceDate: 'N/A',
        createdBy: 'System Admin',
        collectedBy: `${newOrder.customerName} (Customer)`,
        collectedByMobile: newOrder.mobile
      };
    }
    
    const randomDay = Math.floor(Math.random() * 30) + 1;
    newOrder.createDate = `${randomDay} Oct 2023`;
    
    if (newOrder.services) {
      newOrder.services.forEach(service => {
        service.status = (newOrder.workStatus === 'Ready' || newOrder.workStatus === 'Completed') ? 'Completed' : 'Cancelled';
        if (service.status === 'Completed') {
          service.started = `${randomDay} Oct 2023, 09:00 AM`;
          service.ended = `${randomDay} Oct 2023, 12:00 PM`;
          service.duration = '3 hours';
        } else {
          service.started = `${randomDay} Oct 2023, 09:00 AM`;
          service.ended = null;
          service.duration = 'Cancelled';
        }
      });
    }
    
    if (newOrder.paymentStatus === 'Fully Paid' || newOrder.paymentStatus === 'Partially Paid') {
      const methodIndex = Math.floor(Math.random() * paymentMethods.length);
      if (newOrder.billing) {
        newOrder.billing.paymentMethod = paymentMethods[methodIndex];
        if (newOrder.paymentStatus === 'Fully Paid') {
          newOrder.billing.amountPaid = newOrder.billing.netAmount;
          newOrder.billing.balanceDue = 'QAR 0.00';
        } else {
          const netAmount = parseFloat(newOrder.billing.netAmount.replace('QAR ', '').replace(',', ''));
          const paidAmount = netAmount * 0.5;
          newOrder.billing.amountPaid = `QAR ${paidAmount.toFixed(2)}`;
          newOrder.billing.balanceDue = `QAR ${(netAmount - paidAmount).toFixed(2)}`;
        }
        if (newOrder.billing.invoices) {
          newOrder.billing.invoices.forEach(invoice => {
            invoice.status = newOrder.paymentStatus === 'Fully Paid' ? 'Paid' : 'Partially Paid';
            invoice.paymentMethod = paymentMethods[methodIndex];
          });
        }
      }
    }
    
    baseOrders.push(newOrder);
  }
  
  return baseOrders;
};

// Helper Functions
const getWorkStatusClass = (status) => {
  switch(status) {
    case 'Ready': return 'epm-status-completed';
    case 'Cancelled': return 'epm-status-cancelled';
    default: return 'epm-status-inprogress';
  }
};

const getServiceStatusClass = (status) => {
  switch(status) {
    case 'Completed': return 'epm-status-completed';
    case 'Cancelled': return 'epm-status-cancelled';
    default: return 'epm-status-new';
  }
};

const getAdditionalServiceStatusClass = (status) => {
  switch(status) {
    case 'Pending Approval': return 'epm-pending';
    case 'Approved': return 'epm-approved';
    case 'Declined': return 'epm-declined';
    default: return 'epm-pending';
  }
};

const getPaymentMethodClass = (method) => {
  switch(method) {
    case 'Cash': return 'epm-payment-method-cash';
    case 'Card': return 'epm-payment-method-card';
    case 'Transfer': return 'epm-payment-method-transfer';
    case 'Cheque': return 'epm-payment-method-cheque';
    default: return '';
  }
};

const getStepStatusClass = (stepStatus) => {
  switch(stepStatus.toLowerCase()) {
    case 'completed': return 'epm-step-completed';
    case 'active': return 'epm-step-active';
    case 'inprogress': return 'epm-step-inprogress';
    case 'pending': return 'epm-step-pending';
    case 'cancelled': return 'epm-step-cancelled';
    case 'upcoming': return 'epm-step-upcoming';
    default: return 'epm-step-upcoming';
  }
};

const getStepIcon = (stepStatus) => {
  switch(stepStatus.toLowerCase()) {
    case 'completed': return 'fas fa-check-circle';
    case 'active': return 'fas fa-play-circle';
    case 'inprogress': return 'fas fa-play-circle';
    case 'pending': return 'fas fa-clock';
    case 'cancelled': return 'fas fa-times-circle';
    case 'upcoming': return 'fas fa-circle';
    default: return 'fas fa-circle';
  }
};

const getStatusBadgeClass = (status) => {
  switch(status) {
    case 'New': return 'epm-status-new';
    case 'InProgress': return 'epm-status-inprogress';
    case 'Completed': return 'epm-status-completed';
    case 'Pending': return 'epm-status-pending';
    case 'Cancelled': return 'epm-status-cancelled';
    default: return 'epm-status-pending';
  }
};

const parseDateString = (dateStr) => {
  const parts = dateStr.split(' ');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const monthStr = parts[1];
    const year = parseInt(parts[2]);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months.indexOf(monthStr);
    return new Date(year, month, day);
  }
  return new Date();
};

const formatDateForDisplay = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Exit Permit Management Component
const ExitPermitManagement = ({ currentUser }) => {
  const [allOrders, setAllOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showDetailsScreen, setShowDetailsScreen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showExitPermitModal, setShowExitPermitModal] = useState(false);
  const [currentOrderForPermit, setCurrentOrderForPermit] = useState(null);
  const [exitPermitForm, setExitPermitForm] = useState({
    collectedBy: '',
    mobileNumber: '',
    nextServiceDate: ''
  });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [lastAction, setLastAction] = useState('cancel');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showExitPermitSuccessPopup, setShowExitPermitSuccessPopup] = useState(false);
  const [successPermitId, setSuccessPermitId] = useState('');
  const [successOrderId, setSuccessOrderId] = useState('');

  useEffect(() => {
    const orders = getStoredJobOrders();
    setAllOrders(orders);
  }, []);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isDropdownButton = event.target.closest('.btn-action-dropdown');
      const isDropdownMenu = event.target.closest('.action-dropdown-menu');
      
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
  const filterJobOrdersForExitPermit = () => {
    return allOrders.filter(order => {
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
  const performSmartSearch = (query) => {
    if (!query.trim()) {
      return filterJobOrdersForExitPermit();
    }
    
    const terms = query.toLowerCase().split(' ').filter(term => term.trim());
    let results = filterJobOrdersForExitPermit();
    
    terms.forEach(term => {
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

  const matchesTerm = (order, term) => {
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

  const handleSearchInput = (e) => {
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

  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const openDetailsView = (orderId) => {
    const order = allOrders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowDetailsScreen(true);
    }
  };

  const closeDetailsView = () => {
    setShowDetailsScreen(false);
    setSelectedOrder(null);
  };

  const openExitPermitModal = (orderId) => {
    const order = allOrders.find(o => o.id === orderId);
    
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
    const updatedOrders = allOrders.map(order => 
      order.id === cancelOrderId ? cancelledOrder : order
    );
    
    setAllOrders(updatedOrders);
    localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
    updateCompletedServiceCounts();
    
    setLastAction('cancel');
    setShowSuccessPopup(true);
    setShowCancelConfirmation(false);
  };

  const handleCreateExitPermit = (e) => {
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
    
    const updatedOrders = allOrders.map(order => {
      if (order.id === currentOrderForPermit.id) {
        // Update the roadmap to mark "Ready for Delivery" step as completed
        const updatedRoadmap = order.roadmap ? order.roadmap.map(step => {
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

        return {
          ...order,
          workStatus: finalWorkStatus,
          exitPermit: {
            permitId,
            createDate,
            nextServiceDate: nextServiceDateDisplay,
            createdBy: currentUser?.name || 'System User',
            collectedBy,
            collectedByMobile: mobileNumber
          },
          exitPermitStatus: 'Created',
          roadmap: finalRoadmap
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
const JobOrderSummaryCard = ({ order }) => {
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

const RoadmapCard = ({ order }) => {
  if (!order.roadmap || order.roadmap.length === 0) return null;

  const formatStepStatus = (status) => {
    switch (status) {
      case 'New': return 'epm-status-new';
      case 'Completed': return 'epm-status-completed';
      case 'InProgress': return 'epm-status-inprogress';
      case 'Pending': return 'epm-status-pending';
      case 'Upcoming': return 'epm-status-pending';
      default: return 'epm-status-pending';
    }
  };

  const getStepStatusClass = (stepStatus) => {
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

  const getStepIcon = (stepStatus) => {
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
          {order.roadmap.map((step, idx) => (
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

const CustomerDetailsCard = ({ order }) => {
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

const VehicleDetailsCard = ({ order }) => {
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

const DocumentsCard = ({ order }) => {
  const documents = Array.isArray(order.documents) ? order.documents : []

  if (documents.length === 0) return null;

  return (
    <div className="epm-detail-card">
      <h3><i className="fas fa-folder-open"></i> Documents</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {documents.map((doc, idx) => (
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
            </PermissionGate>
          </div>
        ))}
      </div>
    </div>
  );
};

const ServicesCard = ({ order }) => {
  const combinedServices = order.orderType === 'Service Order'
    ? [...(order.serviceOrderReference?.services || []), ...(order.services || [])]
    : (order.services || []);

  return (
    <div className="epm-detail-card">
      <h3><i className="fas fa-tasks"></i> Services Summary</h3>
      <div className="epm-services-list">
        {combinedServices.length > 0 ? (
          combinedServices.map((service, idx) => (
            <div key={idx} className="epm-service-item">
              <div className="epm-service-header">
                <span className="epm-service-name">{typeof service === 'string' ? service : service.name}</span>
                <span className={`epm-status-badge ${getServiceStatusClass(typeof service === 'string' ? 'New' : service.status)}`}>{typeof service === 'string' ? 'New' : service.status}</span>
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
                  <span className="epm-timeline-value">{typeof service === 'string' ? 'Not assigned' : service.technician}</span>
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

const AdditionalServicesRequestCard = ({ request, index }) => {
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

const CustomerNotesCard = ({ order }) => {
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

const BillingCard = ({ order }) => {
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
          {order.billing.invoices.map((invoice, idx) => (
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
                {invoice.services?.map((service, sidx) => (
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

const PaymentActivityLogCard = ({ order }) => {
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
            {[...order.paymentActivityLog].reverse().map((payment, idx) => (
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

const ExitPermitCard = ({ order }) => {
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

const QualityCheckListCard = ({ order }) => {
  const services = order.orderType === 'Service Order'
    ? [...(order.serviceOrderReference?.services || []), ...(order.services || [])]
    : (order.services || []);

  const getQualityCheckResult = (service, index) => {
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
          services.map((service, idx) => {
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

export default ExitPermitManagement;
