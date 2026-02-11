import React, { useState, useEffect } from 'react';
import './ServiceExecutionModule.css';
import { getStoredJobOrders } from './demoData';
import ServiceSummaryCard from './ServiceSummaryCard';

const ServiceExecutionModule = () => {
    // Get demo jobs from the shared demo data (same as Job Order Management)
    const allJobs = getStoredJobOrders();
    
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
    // Orders that have completed Inspection are automatically set to 'unassigned'
    const assigneeOptions = ['me', 'unassigned', 'team'];
    const jobsWithAssignees = allJobs.map((job, idx) => {
        // Auto-assign to 'unassigned' if order has transitioned from Inspection
        if (shouldBeUnassigned(job)) {
            return {
                ...job,
                assignee: 'unassigned',
                assignedTo: null,
                autoAssigned: true // Flag to indicate this was auto-assigned
            };
        }
        
        // Otherwise, distribute manually to support mixed assignment scenarios
        return {
            ...job,
            assignee: assigneeOptions[idx % assigneeOptions.length],
            assignedTo: idx % 3 === 0 ? null : (idx % 3 === 1 ? 'John S.' : 'David C.'),
            autoAssigned: false
        };
    });

    const [mockJobs, setMockJobs] = useState(jobsWithAssignees);
    
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
                        autoAssigned: true
                    };
                }
                return {
                    ...job,
                    assignee: assigneeOptions[idx % assigneeOptions.length],
                    assignedTo: idx % 3 === 0 ? null : (idx % 3 === 1 ? 'John S.' : 'David C.'),
                    autoAssigned: false
                };
            });
            setMockJobs(refreshedJobs);
        }, 2000); // Check every 2 seconds for updates
        
        return () => clearInterval(refreshInterval);
    }, []);
    const [currentTab, setCurrentTab] = useState('assigned');
    const [currentSearch, setCurrentSearch] = useState('');
    const [currentDetailsJob, setCurrentDetailsJob] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [approvalMessage, setApprovalMessage] = useState('');
    const [showDetails, setShowDetails] = useState(false);
    const [pageSize, setPageSize] = useState(20);

    const technicians = ['Mike T.', 'Anna P.', 'Omar K.', 'Elena R.', 'Tom B.'];
    const assignees = ['John S.', 'Lisa M.', 'David C.', 'Sarah M.'];
    const productCatalog = [
        { name: 'Wheel Protection', price: 600 },
        { name: 'Front Bumper Protection', price: 1500 },
        { name: 'Glass Protection', price: 800 }
    ];

    const filterJobsByTabAndRoadmap = (tab, query) => {
        let filtered = [];
        if (tab === 'assigned') filtered = mockJobs.filter(j => j.assignee === 'me');
        else if (tab === 'unassigned') filtered = mockJobs.filter(j => j.assignee === 'unassigned');
        else filtered = mockJobs.filter(j => j.assignee === 'team');

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
        const assigned = mockJobs.filter(j => j.assignee === 'me' && j.roadmap?.find(s => s.step === 'Inprogress' && s.stepStatus === 'Active')).length;
        const unassigned = mockJobs.filter(j => j.assignee === 'unassigned' && j.roadmap?.find(s => s.step === 'Inprogress' && s.stepStatus === 'Active')).length;
        const team = mockJobs.filter(j => j.assignee === 'team' && j.roadmap?.find(s => s.step === 'Inprogress' && s.stepStatus === 'Active')).length;
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
            setApprovalMessage('');
            setShowDetails(true);
        }
    };

    const closeDetails = () => {
        setShowDetails(false);
        setCurrentDetailsJob(null);
        setEditMode(false);
        setApprovalMessage('');
    };

    const handleEditToggle = () => setEditMode(!editMode);

    const handleServicesReorder = (reorderedServices) => {
        if (!currentDetailsJob) return;
        const updatedJob = { ...currentDetailsJob, services: reorderedServices };
        setCurrentDetailsJob(updatedJob);
    };

    const handleServiceUpdate = (serviceId, updates) => {
        if (!currentDetailsJob) return;
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
    };

    const handleAddService = async (serviceName, price) => {
        return new Promise((resolve) => {
            setApprovalMessage(`📤 Approval request sent for "${serviceName}" ($${price}) - waiting...`);
            setTimeout(() => {
                const isApproved = confirm(`Manager approval for "${serviceName}" ($${price})? OK = APPROVE, Cancel = DECLINE`);
                if (isApproved) {
                    const newId = 's' + Date.now();
                    const newService = { 
                        id: newId, 
                        name: serviceName, 
                        status: 'Pending', 
                        assignedTo: null, 
                        technicians: [], 
                        order: (currentDetailsJob?.services?.length || 0) + 1, 
                        startTime: null, 
                        endTime: null 
                    };
                    if (currentDetailsJob) {
                        const updatedJob = { ...currentDetailsJob };
                        updatedJob.services = [...(updatedJob.services || []), newService];
                        setCurrentDetailsJob(updatedJob);
                    }
                    setApprovalMessage(`✅ Approved! Service "${serviceName}" added.`);
                    setTimeout(() => setApprovalMessage(''), 3000);
                    resolve(true);
                } else {
                    setApprovalMessage('❌ Request declined. Service not added.');
                    setTimeout(() => setApprovalMessage(''), 3000);
                    resolve(false);
                }
            }, 500);
        });
    };

    const allServicesCompleted = currentDetailsJob?.services?.every((s) => 
        s.status === 'Postponed' || s.status === 'Cancelled' || s.status === 'Completed'
    ) ?? false;

    const handleFinishWork = () => {
        if (!currentDetailsJob) return;
        const updatedJob = { ...currentDetailsJob };
        const inprogressStep = updatedJob.roadmap.find(s => s.step === 'Inprogress');
        if (inprogressStep) { inprogressStep.stepStatus = 'Completed'; inprogressStep.endTimestamp = new Date().toLocaleString(); }
        const qcStep = updatedJob.roadmap.find(s => s.step === 'Quality Check');
        if (qcStep) { qcStep.stepStatus = 'Active'; qcStep.startTimestamp = new Date().toLocaleString(); }
        setCurrentDetailsJob(updatedJob);
        alert('✅ Roadmap updated!');
    };

    const filteredJobs = filterJobsByTabAndRoadmap(currentTab, currentSearch);
    const counts = getTabCounts();
    const tabTitle = currentTab === 'assigned' ? 'Assigned to me' : currentTab === 'unassigned' ? 'Unassigned tasks' : 'Team tasks';

    // Show details screen when selected
    if (showDetails && currentDetailsJob) {
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
                            <JobOrderSummaryCard order={currentDetailsJob} />
                            <RoadmapCard order={currentDetailsJob} />

                            <div className="epm-detail-card">
                                <h3><i className="fas fa-user"></i> Customer Information</h3>
                                <div className="epm-card-content">
                                    <div className="epm-info-grid">
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-id-card"></i> Customer ID</span><span className="epm-info-value">{currentDetailsJob.customerDetails?.customerId || currentDetailsJob.id}</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-user-circle"></i> Customer Name</span><span className="epm-info-value">{currentDetailsJob.customerName}</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-phone"></i> Mobile Number</span><span className="epm-info-value">{currentDetailsJob.mobile}</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-envelope"></i> Email Address</span><span className="epm-info-value">{currentDetailsJob.customerDetails?.email || '—'}</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-home"></i> Home Address</span><span className="epm-info-value">{currentDetailsJob.customerDetails?.address || 'Not provided'}</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-car"></i> Registered Vehicles</span><span className="epm-info-value">{currentDetailsJob.customerDetails?.vehicleCount || 1} vehicle</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-check-circle"></i> Completed Services</span><span className="epm-info-value">{currentDetailsJob.customerDetails?.completedServices || 0} services</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-calendar-alt"></i> Customer Since</span><span className="epm-info-value">{currentDetailsJob.customerDetails?.registrationDate || '11 Feb 2026'}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="epm-detail-card">
                                <h3><i className="fas fa-car"></i> Vehicle Information</h3>
                                <div className="epm-card-content">
                                    <div className="epm-info-grid">
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-hashtag"></i> Vehicle ID</span><span className="epm-info-value">{currentDetailsJob.vehicleDetails?.vehicleId || 'VEH-' + currentDetailsJob.id}</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-cube"></i> Make & Model</span><span className="epm-info-value">{currentDetailsJob.vehicleDetails?.make} {currentDetailsJob.vehicleDetails?.model}</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-calendar"></i> Year</span><span className="epm-info-value">{currentDetailsJob.vehicleDetails?.year || 'N/A'}</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-sitemap"></i> Vehicle Type</span><span className="epm-info-value">{currentDetailsJob.vehicleDetails?.type || 'Sedan'}</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-palette"></i> Color</span><span className="epm-info-value">{currentDetailsJob.vehicleDetails?.color || 'Not specified'}</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-id-badge"></i> License Plate</span><span className="epm-info-value">{currentDetailsJob.vehiclePlate}</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-barcode"></i> VIN</span><span className="epm-info-value">{currentDetailsJob.vehicleDetails?.vin || 'Not provided'}</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-user-tag"></i> Owned By</span><span className="epm-info-value">{currentDetailsJob.customerName}</span></div>
                                        <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-calendar-check"></i> Registration Date</span><span className="epm-info-value">{currentDetailsJob.vehicleDetails?.registrationDate || 'N/A'}</span></div>
                                    </div>
                                </div>
                            </div>

                            <ServiceSummaryCard
                                jobId={currentDetailsJob.id}
                                services={currentDetailsJob.services || []}
                                onServicesReorder={handleServicesReorder}
                                onServiceUpdate={handleServiceUpdate}
                                onAddService={handleAddService}
                                onFinishWork={handleFinishWork}
                                allServicesCompleted={allServicesCompleted}
                                editMode={editMode}
                                setEditMode={setEditMode}
                            />

                            <div className="epm-detail-card">
                                <h3><i className="fas fa-file-invoice"></i> Billing</h3>
                                <div className="epm-card-content">
                                    <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-dollar-sign"></i> Total Amount</span><span className="epm-info-value">{currentDetailsJob.billing?.totalAmount || '—'}</span></div>
                                    {currentDetailsJob.billing?.discount && <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-percent"></i> Discount</span><span className="epm-info-value">{currentDetailsJob.billing.discount}</span></div>}
                                    {currentDetailsJob.billing?.netAmount && <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-calculator"></i> Net Amount</span><span className="epm-info-value">{currentDetailsJob.billing.netAmount}</span></div>}
                                    {currentDetailsJob.billing?.balanceDue && <div className="epm-info-item"><span className="epm-info-label"><i className="fas fa-credit-card"></i> Balance Due</span><span className="epm-info-value">{currentDetailsJob.billing.balanceDue}</span></div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="service-execution-wrapper">
            <div className="app-container">
                <header className="app-header"><div className="header-left"><h1><i className="fas fa-clipboard-check"></i> Services & Work Management</h1></div></header>
                <div className="task-tabs">
                    <div className={`task-tab ${currentTab === 'assigned' ? 'active' : ''}`} onClick={() => setCurrentTab('assigned')}><i className="fas fa-user-check"></i> Assign to me ({counts.assigned})</div>
                    <div className={`task-tab ${currentTab === 'unassigned' ? 'active' : ''}`} onClick={() => setCurrentTab('unassigned')}><i className="fas fa-user-slash"></i> Unassigned tasks ({counts.unassigned})</div>
                    <div className={`task-tab ${currentTab === 'team' ? 'active' : ''}`} onClick={() => setCurrentTab('team')}><i className="fas fa-users"></i> Team tasks ({counts.team})</div>
                </div>
                <section className="search-section"><div className="search-container"><i className="fas fa-search search-icon"></i><input type="text" className="smart-search-input" placeholder="Search by Job ID, Customer, Plate..." value={currentSearch} onChange={(e) => setCurrentSearch(e.target.value)} /></div></section>
                <section className="results-section"><div className="section-header"><h2><i className="fas fa-tasks"></i> {tabTitle}</h2></div>
                    {filteredJobs.length === 0 ? (<div className="empty-state"><div className="empty-text">No tasks in this view</div></div>) : (
                        <div className="table-wrapper"><table className="job-order-table"><thead><tr><th>Create Date</th><th>Job Card ID</th><th>Order Type</th><th>Customer Name</th><th>Mobile</th><th>Plate</th><th>Status</th><th>Assigned To</th><th>Actions</th></tr></thead><tbody>{filteredJobs.map(job => (<tr key={job.id}><td>{job.createDate}</td><td><strong>{job.id}</strong></td><td>{job.orderType}</td><td>{job.customerName}</td><td>{job.mobile}</td><td>{job.vehiclePlate}</td><td><span className="status-badge status-inprogress">Inprogress</span></td><td>{job.assignedTo || '—'}</td><td><button className="btn-view" onClick={() => openDetailsView(job.id)}><i className="fas fa-eye"></i> View</button></td></tr>))}</tbody></table></div>
                    )}
                </section>
            </div>
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
          <span className="epm-info-value"><span className={`epm-status-badge ${getWorkStatusClass(order.workStatus)}`}>{order.workStatus || 'Not specified'}</span></span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Payment Status</span>
          <span className="epm-info-value"><span className={`epm-status-badge ${getPaymentStatusClass(order.jobOrderSummary?.paymentStatus)}`}>{order.jobOrderSummary?.paymentStatus || 'Not specified'}</span></span>
        </div>
        <div className="epm-info-item">
          <span className="epm-info-label">Exit Permit Status</span>
          <span className="epm-info-value"><span className={`epm-status-badge ${order.jobOrderSummary?.exitPermitStatus === 'Approved' ? 'epm-permit-created' : 'epm-status-pending'}`}>{order.jobOrderSummary?.exitPermitStatus || 'Not specified'}</span></span>
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