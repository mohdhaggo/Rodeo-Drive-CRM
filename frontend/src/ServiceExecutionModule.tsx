import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ServiceExecutionModule.css';
import { getStoredJobOrders } from './demoData';
import ServiceSummaryCard from './ServiceSummaryCard';
import AddServiceScreen from './AddServiceScreen';
import { PRODUCT_CATALOG } from './productCatalog';
import PermissionGate from './PermissionGate';
import { useApprovalRequests } from './ApprovalRequestsContext.tsx';
import { getAllUsers, getTechnicians, getSupervisorsAndManagers } from './userService';
import SuccessPopup from './SuccessPopup';
import { useRolePermissions, hasOptionAccess } from './roleAccess';

// Helper function to normalize service fields for compatibility
const normalizeServices = (services) => {
    return (services || []).map(service => ({
        ...service,
        started: service.startTime || service.started || 'Not started',
        ended: service.endTime || service.ended || 'Not completed',
        technician: service.assignedTo || service.technician || 
                   (service.technicians && service.technicians.length > 0 ? service.technicians[0] : 'Not assigned')
    }));
};

const ServiceExecutionModule = ({ currentUser }) => {
    // Ensure approval requests exist for all services with Pending Approval
    const { addRequest, requests, removeRequest } = useApprovalRequests();
    
    // Get user permissions
    const permissions = useRolePermissions();
    
    // Get demo jobs from the shared demo data (same as Job Order Management)
    const allJobs = getStoredJobOrders();
    
    // Get real users from the system
    const systemUsers = getAllUsers();
    const technicians = getTechnicians();
    const supervisors = getSupervisorsAndManagers();
    
    // Function to determine if an order should be auto-assigned as unassigned
    // Orders transition to unassigned when they move past Inspection step
    const shouldBeUnassigned = (job) => {
        if (!job.roadmap || job.roadmap.length === 0) return false;
        
        // Find the Inspection step
        const inspectionStep = job.roadmap.find(s => s.step === 'Inspection');
        const inprogressStep = job.roadmap.find(s => s.step === 'Inprogress');
        
        // If order has completed Inspection (stepStatus is 'Completed') 
        // and is now in Inprogress, it should be unassigned and ready for pickup
        if (inspectionStep?.stepStatus === 'Completed' && inprogressStep?.stepStatus === 'Active') {
            return true;
        }
        
        return false;
    };
    
    // Distribute assignees to jobs for display purposes
    // Check for explicit assignment first, then auto-assign based on rules
    const jobsWithAssignees = allJobs.map((job, idx) => {
        // Auto-assign to 'unassigned' if order has transitioned from Inspection
        if (shouldBeUnassigned(job)) {
            return {
                ...job,
                assignee: 'unassigned',
                assignedTo: null,
                assignedToUser: null,
                autoAssigned: true // Flag to indicate this was auto-assigned
            };
        }
        
        // Check if order has an explicit assignedToUser field set
        if (job.assignedToUser && job.assignedToUser.name) {
            // Use the saved assignment
            const assigneeType = job.assignedToUser.name === currentUser?.name 
                ? 'me' 
                : supervisors.some(s => s.name === job.assignedToUser.name) 
                    ? 'team' 
                    : 'unassigned';
            
            return {
                ...job,
                assignee: assigneeType,
                assignedTo: job.assignedToUser.name,
                assignedToUser: job.assignedToUser,
                autoAssigned: false
            };
        }
        
        // Otherwise, distribute to real users from the system (for backwards compatibility)
        const assigneeOptions = ['me', 'unassigned', 'team'];
        const assigneeType = assigneeOptions[idx % assigneeOptions.length];
        
        let assignedUser = null;
        if (assigneeType === 'me' && currentUser) {
            assignedUser = currentUser;
        } else if (assigneeType === 'team' && supervisors.length > 0) {
            assignedUser = supervisors[idx % supervisors.length];
        }
        
        return {
            ...job,
            assignee: assigneeType,
            assignedTo: assignedUser ? assignedUser.name : null,
            assignedToUser: assignedUser,
            autoAssigned: false
        };
    });

    const [mockJobs, setMockJobs] = useState(jobsWithAssignees);

    // On mount and after every job refresh, ensure all services with Pending Approval have a request
    useEffect(() => {
        mockJobs.forEach(job => {
            (job.services || []).forEach(service => {
                if (service.status === 'Pending Approval') {
                    const alreadyExists = requests.some(r => r.id === service.id && r.status === 'pending');
                    if (!alreadyExists) {
                        addRequest({
                            id: service.id,
                            customer: job.customerName,
                            vehicle: job.vehiclePlate,
                            priority: service.priority || 'normal',
                            requestedBy: service.assignedTo || 'Unknown',
                            requestDate: new Date().toLocaleString(),
                            status: 'pending',
                            ...service
                        });
                    }
                }
            });
        });
    }, [mockJobs, requests, addRequest]);
    
    // Refresh jobs periodically to catch status updates from Job Order Management
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            const updatedJobs = getStoredJobOrders();
            const refreshedJobs = updatedJobs.map((job, idx) => {
                if (shouldBeUnassigned(job)) {
                    return {
                        ...job,
                        assignee: 'unassigned',
                        assignedTo: null,
                        assignedToUser: null,
                        autoAssigned: true
                    };
                }
                
                // Check if order has an explicit assignedToUser field set
                if (job.assignedToUser && job.assignedToUser.name) {
                    // Use the saved assignment
                    const assigneeType = job.assignedToUser.name === currentUser?.name 
                        ? 'me' 
                        : supervisors.some(s => s.name === job.assignedToUser.name) 
                            ? 'team' 
                            : 'unassigned';
                    
                    return {
                        ...job,
                        assignee: assigneeType,
                        assignedTo: job.assignedToUser.name,
                        assignedToUser: job.assignedToUser,
                        autoAssigned: false
                    };
                }
                
                // Otherwise, distribute to real users from the system
                const assigneeOptions = ['me', 'unassigned', 'team'];
                const assigneeType = assigneeOptions[idx % assigneeOptions.length];
                let assignedUser = null;
                
                if (assigneeType === 'me' && currentUser) {
                    assignedUser = currentUser;
                } else if (assigneeType === 'team' && supervisors.length > 0) {
                    assignedUser = supervisors[idx % supervisors.length];
                }
                
                return {
                    ...job,
                    assignee: assigneeType,
                    assignedTo: assignedUser ? assignedUser.name : null,
                    assignedToUser: assignedUser,
                    autoAssigned: false
                };
            });
            setMockJobs(refreshedJobs);
        }, 2000); // Check every 2 seconds for updates
        
        return () => clearInterval(refreshInterval);
    }, [currentUser, supervisors]);
    const [currentTab, setCurrentTab] = useState('assigned');
    const [currentSearch, setCurrentSearch] = useState('');
    const [currentDetailsJob, setCurrentDetailsJob] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showAddServiceScreen, setShowAddServiceScreen] = useState(false);
    const [showAddServiceSuccessPopup, setShowAddServiceSuccessPopup] = useState(false);
    const [addServiceSuccessData, setAddServiceSuccessData] = useState({ orderId: '', invoiceId: '' });
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

    // Ensure current tab is accessible when permissions change
    useEffect(() => {
        if (!isTabAccessible(currentTab)) {
            // If current tab is not accessible, find and switch to the first accessible tab
            const tabs = ['assigned', 'unassigned', 'team'];
            for (const tab of tabs) {
                if (isTabAccessible(tab)) {
                    setCurrentTab(tab);
                    return;
                }
            }
            // If no tabs are accessible, default to 'assigned'
            setCurrentTab('assigned');
        }
    }, [permissions]);
    const [cancelOrderId, setCancelOrderId] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

    const parseAmount = (value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const cleaned = value.replace(/[^0-9.-]/g, '');
        const parsed = parseFloat(cleaned);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const formatAmount = (value) => `QAR ${Number(value || 0).toLocaleString()}`;

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

    // Use real technicians and supervisors from system users
    const technicianNames = technicians.map(t => t.name);
    const assigneeNames = [...supervisors.map(s => s.name), ...(currentUser ? [currentUser.name] : [])];
    const filterJobsByTabAndRoadmap = (tab, query) => {
        let filtered = [];
        if (tab === 'assigned') {
            // Show jobs where the next service to execute is assigned to the current user
            filtered = mockJobs.filter(j => {
                const nextService = j.services?.find(s => s.status !== 'Completed' && s.status !== 'Cancelled' && s.status !== 'Postponed');
                return nextService && nextService.assignedTo === currentUser?.name;
            });
        } else if (tab === 'unassigned') {
            // Show jobs where the next service to execute is unassigned
            filtered = mockJobs.filter(j => {
                const nextService = j.services?.find(s => s.status !== 'Completed' && s.status !== 'Cancelled' && s.status !== 'Postponed');
                return nextService && !nextService.assignedTo;
            });
        } else {
            // Show jobs where the next service to execute is assigned to another user
            filtered = mockJobs.filter(j => {
                const nextService = j.services?.find(s => s.status !== 'Completed' && s.status !== 'Cancelled' && s.status !== 'Postponed');
                return nextService && nextService.assignedTo && nextService.assignedTo !== currentUser?.name;
            });
        }
        filtered = filtered.filter(job => {
            const inprogressStep = job.roadmap?.find(s => s.step === 'Inprogress');
            return inprogressStep && inprogressStep.stepStatus === 'Active';
        });
        if (query.trim()) {
            const q = query.toLowerCase();
            filtered = filtered.filter(j => 
                j.id.toLowerCase().includes(q) ||
                j.customerName?.toLowerCase().includes(q) ||
                j.vehiclePlate?.toLowerCase().includes(q) ||
                j.mobile?.toLowerCase().includes(q)
            );
        }
        return filtered;
    };

    const getTabCounts = () => {
        // Count jobs where the next service to execute is assigned to the current user
        const assigned = mockJobs.filter(j => {
            const nextService = j.services?.find(s => s.status !== 'Completed' && s.status !== 'Cancelled' && s.status !== 'Postponed');
            return nextService && nextService.assignedTo === currentUser?.name && j.roadmap?.find(s => s.step === 'Inprogress' && s.stepStatus === 'Active');
        }).length;
        // Count jobs where the next service to execute is unassigned
        const unassigned = mockJobs.filter(j => {
            const nextService = j.services?.find(s => s.status !== 'Completed' && s.status !== 'Cancelled' && s.status !== 'Postponed');
            return nextService && !nextService.assignedTo && j.roadmap?.find(s => s.step === 'Inprogress' && s.stepStatus === 'Active');
        }).length;
        // Count jobs where the next service to execute is assigned to another user
        const team = mockJobs.filter(j => {
            const nextService = j.services?.find(s => s.status !== 'Completed' && s.status !== 'Cancelled' && s.status !== 'Postponed');
            return nextService && nextService.assignedTo && nextService.assignedTo !== currentUser?.name && j.roadmap?.find(s => s.step === 'Inprogress' && s.stepStatus === 'Active');
        }).length;
        return { assigned, unassigned, team };
    };

    const getStatusClass = (status) => {
        const statusMap = {
            'Inprogress': 'status-inprogress',
            'Completed': 'status-completed',
            'Cancelled': 'status-cancelled',
            'Postponed': 'status-postponed',
            'Pending Approval': 'status-pending-approval',
            'Pending': 'status-pending'
        };
        return statusMap[status] || 'status-pending';
    };

    // Returns the next uncompleted service in arranged order
    const getCurrentService = (job) => {
        if (!job.services) return null;
        // Find the first service that is not completed/cancelled/postponed
        return job.services.find(s => s.status !== 'Completed' && s.status !== 'Cancelled' && s.status !== 'Postponed') || null;
    };

    // Get all assigned users for a job
    const getAssignedUsers = (job) => {
        if (!job.services) return [];
        const assignedUsers = [...new Set(job.services
            .filter(s => s.assignedTo)
            .map(s => s.assignedTo)
        )];
        return assignedUsers;
    };

    const getTabPrefix = () => {
        if (currentTab === 'assigned') return 'serviceexec_assigned';
        if (currentTab === 'unassigned') return 'serviceexec_unassigned';
        return 'serviceexec_team';
    };

    // Check if a tab has permission
    const isTabAccessible = (tabName) => {
        const tabPermissionId = `serviceexec_${tabName}`;
        return hasOptionAccess(permissions, 'serviceexec', tabPermissionId);
    };

    const openDetailsView = (jobId) => {
        const job = mockJobs.find(j => j.id === jobId);
        if (job) {
            // Ensure all services have IDs
            let services = (job.services || []).map((s, idx) => ({
                ...s,
                id: s.id || `service-${idx}-${Date.now()}`,
                order: s.order || (idx + 1),
                status: s.status || 'Pending',
                assignedTo: s.assignedTo || null,
                technicians: s.technicians || [],
                startTime: s.startTime || null,
                endTime: s.endTime || null,
            }));
            
            const jobWithServices = { 
                ...job,
                services: services
            };
            setCurrentDetailsJob(jobWithServices);
            setEditMode(false);
            setShowAddServiceScreen(false);
            setShowAddServiceSuccessPopup(false);
            setShowDetails(true);
        }
    };

    const closeDetails = () => {
        // Save service changes to localStorage before closing
        if (currentDetailsJob) {
            const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]');
            const updatedOrders = storedOrders.map(order => {
                if (order.id === currentDetailsJob.id) {
                    return {
                        ...order,
                        services: normalizeServices(currentDetailsJob.services)
                    };
                }
                return order;
            });
            localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
        }
        
        setShowDetails(false);
        setCurrentDetailsJob(null);
        setEditMode(false);
        setShowAddServiceScreen(false);
        setShowAddServiceSuccessPopup(false);
    };

    const handleEditToggle = () => setEditMode(!editMode);

    const handleServicesReorder = (reorderedServices) => {
        if (!currentDetailsJob) return;
        const updatedJob = { ...currentDetailsJob, services: reorderedServices };
        setCurrentDetailsJob(updatedJob);
    };

    const handleServiceUpdate = (serviceId, updates) => {
        if (!currentDetailsJob) return;
        // If updating to Postponed or Cancelled, remove pending approval for this service
        if (updates.status === 'Postponed' || updates.status === 'Cancelled') {
            removeRequest(serviceId);
        }
        const updatedJob = { ...currentDetailsJob };
        let services = updatedJob.services || [];
        // Ensure services have IDs
        services = services.map((s, idx) => ({
            ...s,
            id: s.id || `service-${idx}-${Date.now()}`,
        }));
        const service = services.find(s => s.id === serviceId);
        if (!service) return;
        Object.assign(service, updates);
        updatedJob.services = services;
        setCurrentDetailsJob(updatedJob);
        // Persist to localStorage immediately
        const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]');
        const updatedOrders = storedOrders.map(order => {
            if (order.id === updatedJob.id) {
                return {
                    ...order,
                    services: normalizeServices(updatedJob.services)
                };
            }
            return order;
        });
        localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
    };

    const handleAddService = () => {
      if (currentDetailsJob) {
        setShowAddServiceScreen(true);
      }
    };

    const handleAddServiceSubmit = ({ selectedServices, discountPercent }) => {
      if (!currentDetailsJob || !selectedServices || selectedServices.length === 0) {
        setShowAddServiceScreen(false);
        return;
      }

      const now = new Date();
      const year = now.getFullYear();
      const invoiceNumber = `INV-${year}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
      const billId = currentDetailsJob.billing?.billId || `BILL-${year}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

      const subtotal = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
      const discount = (subtotal * (discountPercent || 0)) / 100;
      const netAmount = subtotal - discount;

      const existingTotal = parseAmount(currentDetailsJob.billing?.totalAmount);
      const existingDiscount = parseAmount(currentDetailsJob.billing?.discount);
      const existingNet = parseAmount(currentDetailsJob.billing?.netAmount);
      const existingPaid = parseAmount(currentDetailsJob.billing?.amountPaid);

      const updatedBilling = {
        billId,
        totalAmount: formatAmount(existingTotal + subtotal),
        discount: formatAmount(existingDiscount + discount),
        netAmount: formatAmount(existingNet + netAmount),
        amountPaid: formatAmount(existingPaid),
        balanceDue: formatAmount((existingNet + netAmount) - existingPaid),
        paymentMethod: currentDetailsJob.billing?.paymentMethod || null,
        invoices: [
          ...(currentDetailsJob.billing?.invoices || []),
          {
            number: invoiceNumber,
            amount: formatAmount(netAmount),
            discount: formatAmount(discount),
            status: 'Unpaid',
            paymentMethod: null,
            services: selectedServices.map(s => s.name)
          }
        ]
      };

      const timestamp = Date.now();
      const newServiceEntries = selectedServices.map((service, idx) => ({
        id: `service-${timestamp}-${idx}`,
        name: service.name,
        price: service.price || 0,
        status: 'New',
        started: 'Not started',
        ended: 'Not completed',
        duration: 'Not started',
        technician: 'Not assigned',
        assignedTo: null,
        technicians: [],
        startTime: null,
        endTime: null,
        notes: 'Added from Service Execution details'
      }));

      const updatedJob = {
        ...currentDetailsJob,
        services: [...(currentDetailsJob.services || []), ...newServiceEntries],
        billing: updatedBilling
      };

      const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]');
      const updatedOrders = storedOrders.map(order =>
        order.id === currentDetailsJob.id ? updatedJob : order
      );

      localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
      setMockJobs(updatedOrders);
      setCurrentDetailsJob(updatedJob);

      setAddServiceSuccessData({ orderId: currentDetailsJob.id, invoiceId: invoiceNumber });
      setShowAddServiceSuccessPopup(true);
      setShowAddServiceScreen(false);
    };

    const allServicesCompleted = currentDetailsJob?.services?.every((s) => 
        s.status === 'Postponed' || s.status === 'Cancelled' || s.status === 'Completed'
    ) ?? false;

    const handleFinishWork = () => {
        if (!currentDetailsJob) return;
        const updatedJob = { ...currentDetailsJob };
        const allCancelled = updatedJob.services && updatedJob.services.length > 0 && updatedJob.services.every(s => s.status === 'Cancelled');
        if (allCancelled) {
            // Mark all roadmap steps as Cancelled
            if (updatedJob.roadmap) {
                updatedJob.roadmap.forEach(step => {
                    step.stepStatus = 'Cancelled';
                    step.endTimestamp = new Date().toLocaleString();
                });
            }
            updatedJob.workStatus = 'Cancelled';
            setCurrentDetailsJob(updatedJob);
            // Update jobOrders in localStorage
            const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]');
            const updatedOrders = storedOrders.map(order => {
                if (order.id === updatedJob.id) {
                    return {
                        ...order,
                        roadmap: updatedJob.roadmap,
                        workStatus: 'Cancelled',
                        paymentStatus: 'Fully Refunded',
                        services: normalizeServices(updatedJob.services),
                        // Move to exit permit module by setting a flag (example)
                        exitPermitReady: true
                    };
                }
                return order;
            });
            localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
            setSuccessMessage('This request is cancelled and moved to Exit Permit module.');
            setShowSuccessPopup(true);
            return;
        }
        // ...existing code for normal finish work...
        // Update roadmap steps
        const inprogressStep = updatedJob.roadmap.find(s => s.step === 'Inprogress');
        if (inprogressStep) {
            inprogressStep.stepStatus = 'Completed';
            inprogressStep.endTimestamp = new Date().toLocaleString();
        }
        const qcStep = updatedJob.roadmap.find(s => s.step === 'Quality Check');
        if (qcStep) {
            qcStep.stepStatus = 'Active';
            qcStep.startTimestamp = new Date().toLocaleString();
        }
        // Update workStatus for all modules
        updatedJob.workStatus = 'Quality Check';
        setCurrentDetailsJob(updatedJob);
        // Update jobOrders in localStorage
        const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]');
        const updatedOrders = storedOrders.map(order => {
            if (order.id === updatedJob.id) {
                // Update roadmap and workStatus
                return {
                    ...order,
                    roadmap: updatedJob.roadmap,
                    workStatus: 'Quality Check',
                    services: normalizeServices(updatedJob.services)
                };
            }
            return order;
        });
        localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
        setSuccessMessage('Work finished! Status changed to Quality Check.');
        setShowSuccessPopup(true);
    };

    const handleReassignOrder = (orderId, newAssignedUser) => {
        // Get current jobs from localStorage
        const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]');
        
        // Update the specific order with new assignment
        const updatedOrders = storedOrders.map(order => {
            if (order.id === orderId) {
                return {
                    ...order,
                    assignedToUser: newAssignedUser,
                    assignedTo: newAssignedUser ? newAssignedUser.name : null
                };
            }
            return order;
        });
        
        // Save back to localStorage
        localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));
        
        // Update current job in view if it's the one being edited
        if (currentDetailsJob?.id === orderId) {
            setCurrentDetailsJob(prev => ({
                ...prev,
                assignedToUser: newAssignedUser,
                assignedTo: newAssignedUser ? newAssignedUser.name : null
            }));
        }
        
        // Refresh mockJobs to show the update immediately
        const refreshedJobs = updatedOrders.map((job, idx) => {
            if (job.shouldBeUnassigned) {
                return {
                    ...job,
                    assignee: 'unassigned',
                    assignedTo: null,
                    assignedToUser: null,
                    autoAssigned: true
                };
            }
            
            if (job.assignedToUser && job.assignedToUser.name) {
                const assigneeType = job.assignedToUser.name === currentUser?.name 
                    ? 'me' 
                    : supervisors.some(s => s.name === job.assignedToUser.name) 
                        ? 'team' 
                        : 'unassigned';
                
                return {
                    ...job,
                    assignee: assigneeType,
                    assignedTo: job.assignedToUser.name,
                    assignedToUser: job.assignedToUser,
                    autoAssigned: false
                };
            }
            
            const assigneeOptions = ['me', 'unassigned', 'team'];
            const assigneeType = assigneeOptions[idx % assigneeOptions.length];
            let assignedUser = null;
            
            if (assigneeType === 'me' && currentUser) {
                assignedUser = currentUser;
            } else if (assigneeType === 'team' && supervisors.length > 0) {
                assignedUser = supervisors[idx % supervisors.length];
            }
            
            return {
                ...job,
                assignee: assigneeType,
                assignedTo: assignedUser ? assignedUser.name : null,
                assignedToUser: assignedUser,
                autoAssigned: false
            };
        });
        setMockJobs(refreshedJobs);
    };

    const handleShowCancelConfirmation = (orderId) => {
        setCancelOrderId(orderId);
        setShowCancelConfirmation(true);
    };

    const handleCancelOrder = () => {
        if (!cancelOrderId) return;

        // Find the order to cancel
        const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]');
        const orderToCancel = storedOrders.find(order => order.id === cancelOrderId);
        if (!orderToCancel) return;

        // Create a cancelled version of the order
        const cancelledOrder = {
            ...orderToCancel,
            workStatus: 'Cancelled',
            paymentStatus: 'Fully Refunded'
        };

        // Update the order status in jobOrders storage
        const updatedOrders = storedOrders.map(order =>
            order.id === cancelOrderId ? cancelledOrder : order
        );
        localStorage.setItem('jobOrders', JSON.stringify(updatedOrders));

        // Refresh the mock jobs
        setMockJobs(updatedOrders);

        setShowCancelConfirmation(false);
        setCancelOrderId(null);
        alert(`Order ${cancelOrderId} has been cancelled successfully.`);
    };

    const filteredJobs = filterJobsByTabAndRoadmap(currentTab, currentSearch);
    const counts = getTabCounts();
    const tabTitle = currentTab === 'assigned' ? 'Assigned to me' : currentTab === 'unassigned' ? 'Unassigned tasks' : 'Team tasks';
    
    // Pagination logic
    const totalPages = Math.ceil(filteredJobs.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredJobs.length);
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);
    
    // Reset to page 1 when changing tabs or search
    useEffect(() => {
        setCurrentPage(1);
    }, [currentTab, currentSearch]);
    
    // Reset to page 1 when page size changes
    useEffect(() => {
        setCurrentPage(1);
    }, [pageSize]);

    // Show details screen when selected
    if (showDetails && currentDetailsJob) {
      if (showAddServiceScreen) {
        return (
          <div className="service-execution-wrapper">
            <AddServiceScreen
              order={currentDetailsJob}
              onClose={() => setShowAddServiceScreen(false)}
              onSubmit={handleAddServiceSubmit}
              products={PRODUCT_CATALOG}
              moduleId="serviceexec"
              permissionId={`${getTabPrefix()}_pricesummary`}
            />
          </div>
        );
      }

      return (
        <div className="service-execution-wrapper">
          <div className="service-details-screen">
            <div className="service-details-header">
              <div className="service-details-title-container">
                <h2><i className="fas fa-clipboard-list"></i> Job Order Details - {currentDetailsJob.id}</h2>
              </div>
              <button className="service-btn-close-details" onClick={closeDetails}>
                <i className="fas fa-times"></i> Close Details
              </button>
            </div>
            <div className="service-details-body">
              <div className="service-details-grid">
                      <PermissionGate moduleId="serviceexec" optionId={`${getTabPrefix()}_summary`}>
                        <JobOrderSummaryCard order={currentDetailsJob} />
                      </PermissionGate>
                      {currentDetailsJob.roadmap && currentDetailsJob.roadmap.length > 0 && (
                        <PermissionGate moduleId="serviceexec" optionId={`${getTabPrefix()}_roadmap`}>
                          <RoadmapCard order={currentDetailsJob} />
                        </PermissionGate>
                      )}
                      <PermissionGate moduleId="serviceexec" optionId={`${getTabPrefix()}_customer`}>
                        <div className="epm-detail-card">
                          <h3><i className="fas fa-user"></i> Customer Information</h3>
                          <div className="epm-card-content">
                            <div className="epm-info-item">
                              <span className="epm-info-label">Customer ID</span>
                              <span className="epm-info-value">{currentDetailsJob.customerDetails?.customerId || 'New Customer'}</span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Customer Name</span>
                              <span className="epm-info-value">{currentDetailsJob.customerName}</span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Mobile Number</span>
                              <span className="epm-info-value">{currentDetailsJob.mobile || 'Not provided'}</span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Email Address</span>
                              <span className="epm-info-value">{currentDetailsJob.customerDetails?.email || 'Not provided'}</span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Home Address</span>
                              <span className="epm-info-value">{currentDetailsJob.customerDetails?.address || 'Not provided'}</span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Registered Vehicles</span>
                              <span className="epm-info-value">
                                <span className="count-badge">{currentDetailsJob.customerDetails?.registeredVehiclesCount ?? 1} {(currentDetailsJob.customerDetails?.registeredVehiclesCount ?? 1) === 1 ? 'vehicle' : 'vehicles'}</span>
                              </span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Completed Services</span>
                              <span className="epm-info-value">
                                <span className="count-badge">{currentDetailsJob.customerDetails?.completedServicesCount ?? 0} {(currentDetailsJob.customerDetails?.completedServicesCount ?? 0) === 1 ? 'service' : 'services'}</span>
                              </span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Customer Since</span>
                              <span className="epm-info-value">{currentDetailsJob.customerDetails?.customerSince || 'Not specified'}</span>
                            </div>
                          </div>
                        </div>
                      </PermissionGate>
                      <PermissionGate moduleId="serviceexec" optionId={`${getTabPrefix()}_vehicle`}>
                        <div className="epm-detail-card">
                          <h3><i className="fas fa-car"></i> Vehicle Information</h3>
                          <div className="epm-card-content">
                            <div className="epm-info-item">
                              <span className="epm-info-label">Vehicle Unique ID</span>
                              <span className="epm-info-value">{currentDetailsJob.vehicleDetails?.vehicleId || 'N/A'}</span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Owned By</span>
                              <span className="epm-info-value">{currentDetailsJob.vehicleDetails?.ownedBy || 'N/A'}</span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Make</span>
                              <span className="epm-info-value">{currentDetailsJob.vehicleDetails?.make || 'N/A'}</span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Model</span>
                              <span className="epm-info-value">{currentDetailsJob.vehicleDetails?.model || 'N/A'}</span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Year</span>
                              <span className="epm-info-value">{currentDetailsJob.vehicleDetails?.year || 'N/A'}</span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Vehicle Type</span>
                              <span className="epm-info-value">{currentDetailsJob.vehicleDetails?.type || 'N/A'}</span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Color</span>
                              <span className="epm-info-value">{currentDetailsJob.vehicleDetails?.color || 'N/A'}</span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Plate Number</span>
                              <span className="epm-info-value">{currentDetailsJob.vehicleDetails?.plateNumber || currentDetailsJob.vehiclePlate || 'N/A'}</span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">VIN</span>
                              <span className="epm-info-value">{currentDetailsJob.vehicleDetails?.vin || 'N/A'}</span>
                            </div>
                            <div className="epm-info-item">
                              <span className="epm-info-label">Registration Date</span>
                              <span className="epm-info-value">{currentDetailsJob.vehicleDetails?.registrationDate || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </PermissionGate>
                      <PermissionGate moduleId="serviceexec" optionId={`${getTabPrefix()}_services`}>
                        <ServiceSummaryCard
                          jobId={currentDetailsJob.id}
                          services={currentDetailsJob.services || []}
                          referenceServices={currentDetailsJob.serviceOrderReference?.services || []}
                          onServicesReorder={handleServicesReorder}
                          onServiceUpdate={handleServiceUpdate}
                          onAddService={handleAddService}
                          onFinishWork={handleFinishWork}
                          allServicesCompleted={allServicesCompleted}
                          editMode={editMode}
                          setEditMode={setEditMode}
                          availableTechs={technicianNames}
                          availableAssignees={assigneeNames}
                          tabPrefix={getTabPrefix()}
                        />
                      </PermissionGate>
                      {currentDetailsJob.customerNotes && (
                        <PermissionGate moduleId="serviceexec" optionId={`${getTabPrefix()}_notes`}>
                          <CustomerNotesCard order={currentDetailsJob} />
                        </PermissionGate>
                      )}
                      <PermissionGate moduleId="serviceexec" optionId={`${getTabPrefix()}_quality`}>
                        <QualityCheckListCard order={currentDetailsJob} />
                      </PermissionGate>
                      <PermissionGate moduleId="serviceexec" optionId={`${getTabPrefix()}_billing`}>
                        <BillingCard order={currentDetailsJob} />
                      </PermissionGate>
                      <PermissionGate moduleId="serviceexec" optionId={`${getTabPrefix()}_paymentlog`}>
                        <PaymentActivityLogCard order={currentDetailsJob} />
                      </PermissionGate>
                      <PermissionGate moduleId="serviceexec" optionId={`${getTabPrefix()}_exitpermit`}>
                        <ExitPermitDetailsCard order={currentDetailsJob} />
                      </PermissionGate>
                      <PermissionGate moduleId="serviceexec" optionId={`${getTabPrefix()}_documents`}>
                        <DocumentsCard order={currentDetailsJob} />
                      </PermissionGate>
                        </div>
                    </div>
                    {/* SuccessPopup for finish work feedback */}
                    <SuccessPopup
                        isVisible={showSuccessPopup}
                        onClose={() => {
                            setShowSuccessPopup(false);
                            closeDetails();
                        }}
                        message={successMessage}
                    />
                    <SuccessPopup
                      isVisible={showAddServiceSuccessPopup}
                      onClose={() => setShowAddServiceSuccessPopup(false)}
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
                </div>
            </div>
        );
    }

    return (
        <div className="service-execution-wrapper">
            <div className="app-container">
                <header className="app-header"><div className="header-left"><h1><i className="fas fa-clipboard-check"></i> Services & Work Management</h1></div></header>
                <div className="task-tabs">
                    {isTabAccessible('assigned') && (
                        <div className={`task-tab ${currentTab === 'assigned' ? 'active' : ''}`} onClick={() => setCurrentTab('assigned')}><i className="fas fa-user-check"></i> Assign to me ({counts.assigned})</div>
                    )}
                    {isTabAccessible('unassigned') && (
                        <div className={`task-tab ${currentTab === 'unassigned' ? 'active' : ''}`} onClick={() => setCurrentTab('unassigned')}><i className="fas fa-user-slash"></i> Unassigned tasks ({counts.unassigned})</div>
                    )}
                    {isTabAccessible('team') && (
                        <div className={`task-tab ${currentTab === 'team' ? 'active' : ''}`} onClick={() => setCurrentTab('team')}><i className="fas fa-users"></i> Team tasks ({counts.team})</div>
                    )}
                </div>
                <section className="search-section"><div className="search-container"><i className="fas fa-search search-icon"></i><input type="text" className="smart-search-input" placeholder="Search by Job ID, Customer, Plate..." value={currentSearch} onChange={(e) => setCurrentSearch(e.target.value)} /></div></section>
                <section className="results-section"><div className="section-header"><h2><i className="fas fa-tasks"></i> {tabTitle}</h2><div className="pim-pagination-controls">
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
                    </div></div>
                    {filteredJobs.length === 0 ? (<div className="empty-state"><div className="empty-text">No tasks in this view</div></div>) : (
                        <>
                        <div className="table-wrapper"><table className="job-order-table"><thead><tr><th>Create Date</th><th>Job Card ID</th><th>Order Type</th><th>Customer Name</th><th>Vehicle Plate</th><th>Assigned To</th><th>Assigned Service</th><th>Actions</th></tr></thead><tbody>{paginatedJobs.map(job => {
                            const currentService = getCurrentService(job);
                            const serviceDisplay = currentService 
                                ? `${currentService.name} (${currentService.status})` 
                                : 'No active services';
                            const assignedToDisplay = currentService && currentService.assignedTo ? currentService.assignedTo : '—';
                            return (
                                <tr key={job.id}>
                                    <td>{job.createDate}</td>
                                    <td><strong>{job.id}</strong></td>
                                    <td>{job.orderType}</td>
                                    <td>{job.customerName}</td>
                                    <td>{job.vehiclePlate}</td>
                                    <td>{assignedToDisplay}</td>
                                    <td>{serviceDisplay}</td>
                                    <td>
                                        <PermissionGate moduleId="serviceexec" optionId={`${getTabPrefix()}_actions`}>
                                            <div className="action-dropdown-container">
                                                <button
                                                    className={`btn-action-dropdown ${activeDropdown === job.id ? 'active' : ''}`}
                                                    onClick={(e) => {
                                                        const isActive = activeDropdown === job.id;
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
                                                        setActiveDropdown(job.id);
                                                    }}
                                                >
                                                    <i className="fas fa-cogs"></i> Actions <i className="fas fa-chevron-down"></i>
                                                </button>
                                            </div>
                                        </PermissionGate>
                                    </td>
                                </tr>
                            );
                        })}</tbody></table>

              {/* Action Dropdown Menu */}
              {activeDropdown && typeof document !== 'undefined' && createPortal(
                <PermissionGate moduleId="serviceexec" optionId={`${getTabPrefix()}_actions`}>
                  <div className="action-dropdown-menu show action-dropdown-menu-fixed" style={{top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`}}>
                    <button className="dropdown-item view" onClick={() => {
                      openDetailsView(activeDropdown);
                      setActiveDropdown(null);
                    }}>
                      <i className="fas fa-eye"></i> View Details
                    </button>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item delete" onClick={() => handleShowCancelConfirmation(activeDropdown)}>
                      <i className="fas fa-times-circle"></i> Cancel Order
                    </button>
                  </div>
                </PermissionGate>,
                document.body
              )}
            </div>
            
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
                <div className="service-footer">
                  <p>Service Management System &copy; 2023 | Service Execution Module</p>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            <PermissionGate moduleId="serviceexec" optionId={`${getTabPrefix()}_actions`}>
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
            </PermissionGate>
        </div>
    );
};

function getWorkStatusClass(status) {
  const statusMap = {
    'New Request': 'epm-status-new',
    'Inspection': 'epm-status-inspection',
    'Inprogress': 'epm-status-inprogress',
    'In Progress': 'epm-status-inprogress',
    'Quality Check': 'epm-status-pending',
    'Ready': 'epm-status-completed',
    'Completed': 'epm-status-completed',
    'Cancelled': 'epm-status-cancelled'
  };
  return statusMap[status] || 'epm-status-inprogress';
}

function getPaymentStatusClass(status) {
  if (status === 'Fully Paid' || status === 'Paid') return 'epm-payment-full';
  if (status === 'Partially Paid') return 'epm-payment-partial';
  return 'epm-payment-unpaid';
}

function getPaymentMethodClass(method) {
  if (!method) return '';
  const normalized = method.toLowerCase();
  if (normalized.includes('cash')) return 'epm-payment-method-cash';
  if (normalized.includes('card')) return 'epm-payment-method-card';
  if (normalized.includes('transfer')) return 'epm-payment-method-transfer';
  return 'epm-payment-method-card';
}

function CustomerNotesCard({ order }) {
  return (
    <div className="epm-detail-card" style={{ backgroundColor: '#fffbea', borderLeft: '4px solid #f59e0b' }}>
      <h3><i className="fas fa-comment-dots"></i> Customer Notes</h3>
      <div style={{ padding: '15px 20px', whiteSpace: 'pre-wrap', color: '#78350f', fontSize: '14px', lineHeight: '1.6' }}>
        {order.customerNotes}
      </div>
    </div>
  );
}

function BillingCard({ order }) {
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
}

function QualityCheckListCard({ order }) {
  const combinedServices = order.orderType === 'Service Order'
    ? [...(order.serviceOrderReference?.services || []), ...(order.services || [])]
    : (Array.isArray(order.services) ? order.services : []);

  const getStoredResult = (serviceName, index) => {
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

  const getQualityCheckResult = (service, index) => {
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
        {combinedServices.length > 0 ? (
          combinedServices.map((service, idx) => {
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

function DocumentsCard({ order }) {
  const documents = Array.isArray(order.documents) ? order.documents : []

  if (documents.length === 0) return null;

  return (
    <div className="pim-detail-card">
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

function PaymentActivityLogCard({ order }) {
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

function ExitPermitDetailsCard({ order }) {
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

function JobOrderSummaryCard({ order }) {
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

function RoadmapCard({ order }) {
  if (!order.roadmap || order.roadmap.length === 0) return null;

  const getStepStatusClass = (stepStatus) => {
    switch (stepStatus) {
      case 'Completed': return 'sem-step-completed';
      case 'Active': return 'sem-step-active';
      case 'InProgress': return 'sem-step-active';
      case 'Pending': return 'sem-step-pending';
      case 'Cancelled': return 'sem-step-cancelled';
      case 'Upcoming': return 'sem-step-upcoming';
      default: return 'sem-step-upcoming';
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
      case 'New': return 'sem-status-new';
      case 'Completed': return 'sem-status-completed';
      case 'InProgress': return 'sem-status-inprogress';
      case 'Pending': return 'sem-status-pending';
      case 'Upcoming': return 'sem-status-pending';
      default: return 'sem-status-pending';
    }
  };

  return (
    <div className="epm-detail-card">
      <h3><i className="fas fa-map-signs"></i> Job Order Roadmap</h3>
      <div className="sem-roadmap-container">
        <div className="sem-roadmap-steps">
          {order.roadmap.map((step, idx) => (
            <div key={idx} className={`sem-roadmap-step ${getStepStatusClass(step.stepStatus)}`}>
              <div className="sem-step-icon">
                <i className={getStepIcon(step.stepStatus)}></i>
              </div>
              <div className="sem-step-content">
                <div className="sem-step-header">
                  <div className="sem-step-name">{step.step}</div>
                  <span className={`sem-status-badge ${formatStepStatus(step.status)}`}>{step.status}</span>
                </div>
                <div className="sem-step-details">
                  <div className="sem-step-detail">
                    <span className="sem-detail-label">Started</span>
                    <span className="sem-detail-value">{step.startTimestamp || 'Not started'}</span>
                  </div>
                  <div className="sem-step-detail">
                    <span className="sem-detail-label">Ended</span>
                    <span className="sem-detail-value">{step.endTimestamp || 'Not completed'}</span>
                  </div>
                  <div className="sem-step-detail">
                    <span className="sem-detail-label">Action By</span>
                    <span className="sem-detail-value">{step.actionBy || 'Not assigned'}</span>
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

export default ServiceExecutionModule;