import React, { useState } from 'react';
import './SalesApprovals.css';

const SalesApprovals = () => {
  const [showDetailsPage, setShowDetailsPage] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [selectedDecision, setSelectedDecision] = useState('');
  
  // Form states
  const [approveNotes, setApproveNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [customerCommunication, setCustomerCommunication] = useState('');
  
  // Filter states - Pending
  const [searchInput, setSearchInput] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');

  // Sample data for pending requests
  const [pendingRequests] = useState([
    {
      id: "JC-2023-0452",
      requestId: "APR-2023-0452",
      customer: "Robert Chen",
      contact: "(555) 123-4567",
      vehicle: "ABC-1234",
      assignedTo: "John Smith",
      pendingSince: "2 hours",
      totalAdded: "$320.00",
      priority: "high",
      currentAmount: "$450.00",
      proposedAmount: "$320.00",
      combinedAmount: "$770.00",
      currentServices: [
        { name: "Oil Change", amount: "$80.00" },
        { name: "Brake Inspection", amount: "$120.00" },
        { name: "Tire Rotation", amount: "$60.00" },
        { name: "Air Filter Replacement", amount: "$190.00" }
      ],
      proposedServices: [
        { name: "Brake Pad Replacement", amount: "$180.00" },
        { name: "Wheel Alignment", amount: "$140.00" }
      ],
      invoice: "INV-2023-0452",
      paymentStatus: "Unpaid",
      requestedBy: "Operations Team (Sarah Johnson)",
      requestDate: "Nov 15, 2023 10:30 AM",
      vehicleDetails: "Toyota Camry 2020",
      isPending: true
    },
    {
      id: "JC-2023-0451",
      requestId: "APR-2023-0451",
      customer: "Maria Garcia",
      contact: "(555) 987-6543",
      vehicle: "XYZ-7890",
      assignedTo: "Jane Doe",
      pendingSince: "5 hours",
      totalAdded: "$150.00",
      priority: "normal",
      currentAmount: "$280.00",
      proposedAmount: "$150.00",
      combinedAmount: "$430.00",
      currentServices: [
        { name: "Basic Service", amount: "$120.00" },
        { name: "AC Gas Top-up", amount: "$160.00" }
      ],
      proposedServices: [
        { name: "Cabin Air Filter", amount: "$75.00" },
        { name: "Wiper Blades", amount: "$75.00" }
      ],
      invoice: "INV-2023-0451",
      paymentStatus: "Paid",
      requestedBy: "Operations Team (Mike Brown)",
      requestDate: "Nov 15, 2023 9:15 AM",
      vehicleDetails: "Honda Civic 2021",
      isPending: true
    },
    {
      id: "JC-2023-0450",
      requestId: "APR-2023-0450",
      customer: "James Wilson",
      contact: "(555) 456-7890",
      vehicle: "DEF-5678",
      assignedTo: "John Smith",
      pendingSince: "1 day",
      totalAdded: "$520.00",
      priority: "high",
      currentAmount: "$600.00",
      proposedAmount: "$520.00",
      combinedAmount: "$1,120.00",
      currentServices: [
        { name: "Major Service", amount: "$350.00" },
        { name: "Brake Fluid Change", amount: "$250.00" }
      ],
      proposedServices: [
        { name: "Timing Belt Replacement", amount: "$320.00" },
        { name: "Water Pump Replacement", amount: "$200.00" }
      ],
      invoice: "INV-2023-0450",
      paymentStatus: "Partial",
      requestedBy: "Operations Team (Alex Chen)",
      requestDate: "Nov 14, 2023 2:45 PM",
      vehicleDetails: "Ford F-150 2019",
      isPending: true
    }
  ]);

  const getFilteredPending = () => {
    return pendingRequests.filter(request => {
      const matchesSearch = searchInput === '' || 
        request.id.toLowerCase().includes(searchInput.toLowerCase()) ||
        request.customer.toLowerCase().includes(searchInput.toLowerCase()) ||
        request.vehicle.toLowerCase().includes(searchInput.toLowerCase());
      
      const matchesPriority = priorityFilter === '' || request.priority === priorityFilter;
      
      let matchesDuration = true;
      if (durationFilter === '<24h') {
        matchesDuration = !request.pendingSince.includes('day');
      } else if (durationFilter === '24-48h') {
        matchesDuration = request.pendingSince.includes('1 day');
      } else if (durationFilter === '>48h') {
        matchesDuration = request.pendingSince.includes('days') && !request.pendingSince.includes('1 day');
      }
      
      return matchesSearch && matchesPriority && matchesDuration;
    });
  };

  const getCurrentRequest = () => {
    return pendingRequests.find(req => req.id === currentRequestId);
  };

  const calculateIncrease = (current, added) => {
    const currentNum = parseFloat(current.replace('$', '').replace(',', ''));
    const addedNum = parseFloat(added.replace('$', '').replace(',', ''));
    return Math.round((addedNum / currentNum) * 100);
  };

  const viewDetails = (requestId) => {
    setCurrentRequestId(requestId);
    setShowDetailsPage(true);
    setSelectedDecision('');
  };

  const backToDashboard = () => {
    setShowDetailsPage(false);
    setSelectedDecision('');
    setApproveNotes('');
    setDeclineReason('');
    setCustomerCommunication('');
  };

  const handleApprove = () => {
    if (!currentRequestId) return;
    
    alert(`Request ${currentRequestId} approved successfully!${approveNotes ? '\n\nNotes: ' + approveNotes : ''}\n\nA new invoice has been generated and added to the job card.`);
    
    setApproveNotes('');
    setSelectedDecision('');
    backToDashboard();
  };

  const handleDecline = () => {
    if (!currentRequestId) return;
    
    if (!declineReason) {
      alert("Please select a decline reason.");
      return;
    }
    
    if (!customerCommunication.trim()) {
      alert("Please provide customer communication details.");
      return;
    }
    
    alert(`Request ${currentRequestId} declined.\n\nReason: ${getDeclineReasonText(declineReason)}\n\nCommunication Details: ${customerCommunication}`);
    
    setDeclineReason('');
    setCustomerCommunication('');
    setSelectedDecision('');
    backToDashboard();
  };

  const getDeclineReasonText = (value) => {
    const reasons = {
      'customer_refused': 'Customer refused additional services',
      'budget': 'Budget constraints',
      'alternative': 'Suggested alternative solution',
      'duplicate': 'Duplicate request',
      'other': 'Other'
    };
    return reasons[value] || value;
  };

  const clearPendingFilters = () => {
    setSearchInput('');
    setPriorityFilter('');
    setDurationFilter('');
  };

  const filteredPending = getFilteredPending();
  const highPriorityCount = pendingRequests.filter(req => req.priority === 'high').length;

  if (showDetailsPage) {
    const request = getCurrentRequest();
    if (!request) return null;

    const increase = calculateIncrease(request.currentAmount, request.totalAdded);

    return (
      <div className="sa-details-page">
        <div className="sa-details-header">
          <h1>Request Details</h1>
          <button className="sa-back-btn" onClick={backToDashboard}>
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </button>
        </div>
        
        <div className="sa-details-container">
          <div className="sa-details-section">
            <h2 className="sa-section-title">Request Summary</h2>
            <div className="sa-details-grid">
              <div className="sa-detail-item">
                <div className="sa-detail-label">Request ID</div>
                <div className="sa-detail-value">{request.requestId}</div>
              </div>
              <div className="sa-detail-item">
                <div className="sa-detail-label">Job Card ID</div>
                <div className="sa-detail-value">{request.id}</div>
              </div>
              <div className="sa-detail-item">
                <div className="sa-detail-label">Status</div>
                <div className="sa-detail-value">
                  <span className="sa-status-badge sa-status-pending">Pending</span>
                </div>
              </div>
              <div className="sa-detail-item">
                <div className="sa-detail-label">Requested By</div>
                <div className="sa-detail-value">{request.requestedBy}</div>
              </div>
              <div className="sa-detail-item">
                <div className="sa-detail-label">Request Date</div>
                <div className="sa-detail-value">{request.requestDate}</div>
              </div>
              <div className="sa-detail-item">
                <div className="sa-detail-label">Customer Name</div>
                <div className="sa-detail-value">{request.customer}</div>
              </div>
              <div className="sa-detail-item">
                <div className="sa-detail-label">Mobile Number</div>
                <div className="sa-detail-value">{request.contact}</div>
              </div>
              <div className="sa-detail-item">
                <div className="sa-detail-label">Vehicle Plate</div>
                <div className="sa-detail-value">{request.vehicle} ({request.vehicleDetails})</div>
              </div>
              <div className="sa-detail-item">
                <div className="sa-detail-label">Assigned To</div>
                <div className="sa-detail-value">{request.assignedTo}</div>
              </div>
              <div className="sa-detail-item">
                <div className="sa-detail-label">Pending Since</div>
                <div className="sa-detail-value">{request.pendingSince}</div>
              </div>
            </div>
          </div>
          
          <div className="sa-details-section">
            <h2 className="sa-section-title">Financial Overview</h2>
            <div className="sa-financial-cards">
              <div className="sa-financial-card sa-current">
                <div className="sa-financial-card-header">
                  <div className="sa-financial-card-title">Current Services</div>
                  <div className="sa-financial-card-amount">{request.currentAmount}</div>
                </div>
                <div className="sa-detail-label">Original Invoice: <span>{request.invoice}</span></div>
                <ul className="sa-service-list">
                  {request.currentServices.map((service, idx) => (
                    <li key={idx}>
                      <span className="sa-service-name">{service.name}</span>
                      <span className="sa-service-amount">{service.amount}</span>
                    </li>
                  ))}
                </ul>
                <div className="sa-detail-label" style={{marginTop: '12px'}}>
                  Payment Status: <strong>{request.paymentStatus}</strong>
                </div>
              </div>
              
              <div className="sa-financial-card sa-proposed">
                <div className="sa-financial-card-header">
                  <div className="sa-financial-card-title">Proposed Additional Services</div>
                  <div className="sa-financial-card-amount">{request.proposedAmount}</div>
                </div>
                <div className="sa-detail-label">New Services Requested:</div>
                <ul className="sa-service-list">
                  {request.proposedServices.map((service, idx) => (
                    <li key={idx}>
                      <span className="sa-service-name">{service.name}</span>
                      <span className="sa-service-amount">{service.amount}</span>
                    </li>
                  ))}
                </ul>
                <div className="sa-total-line">
                  <span>Total Added</span>
                  <span>{request.totalAdded}</span>
                </div>
              </div>
              
              <div className="sa-financial-card sa-combined">
                <div className="sa-financial-card-header">
                  <div className="sa-financial-card-title">Combined Total</div>
                  <div className="sa-financial-card-amount">{request.combinedAmount}</div>
                </div>
                <div className="sa-detail-label">Current Amount: <strong>{request.currentAmount}</strong></div>
                <div className="sa-detail-label">Added Services: <strong>{request.totalAdded}</strong></div>
                <div className="sa-total-line">
                  <span>New Total Amount</span>
                  <span>{request.combinedAmount}</span>
                </div>
                <div className="sa-detail-label" style={{marginTop: '8px'}}>
                  Increase: <strong>{increase}%</strong>
                </div>
              </div>
            </div>
          </div>
          
          <div className="sa-details-section">
            <h2 className="sa-section-title">Decision</h2>
            
            <div className="sa-decision-section">
              <div className="sa-decision-selector">
                <label>Select Decision:</label>
                <select 
                  className="sa-decision-select" 
                  value={selectedDecision}
                  onChange={(e) => setSelectedDecision(e.target.value)}
                >
                  <option value="">-- Please select a decision --</option>
                  <option value="approve">Approve Additional Services</option>
                  <option value="decline">Decline Additional Services</option>
                </select>
              </div>
              
              {selectedDecision === 'approve' && (
                <div className="sa-decision-card sa-approve">
                  <div className="sa-card-header">
                    <div className="sa-card-icon"><i className="fas fa-check"></i></div>
                    <div className="sa-card-title">Approve Additional Services</div>
                  </div>
                  <p className="sa-card-description">
                    Approving these services will generate a new invoice for the additional services and add them to the existing job card.
                  </p>
                  
                  <div className="sa-form-group">
                    <label className="sa-form-label">Internal Notes (Optional)</label>
                    <textarea 
                      className="sa-form-textarea"
                      value={approveNotes}
                      onChange={(e) => setApproveNotes(e.target.value)}
                      placeholder="Add any notes about the approval decision..."
                    />
                  </div>
                  
                  <div className="sa-details-footer">
                    <button className="sa-btn sa-btn-success" onClick={handleApprove}>
                      Submit Approval
                    </button>
                  </div>
                </div>
              )}
              
              {selectedDecision === 'decline' && (
                <div className="sa-decision-card sa-decline">
                  <div className="sa-card-header">
                    <div className="sa-card-icon"><i className="fas fa-times"></i></div>
                    <div className="sa-card-title">Decline Additional Services</div>
                  </div>
                  <p className="sa-card-description">
                    Declining these services requires providing a reason and customer communication details.
                  </p>
                  
                  <div className="sa-form-group">
                    <label className="sa-form-label sa-required">Decline Reason</label>
                    <select 
                      className="sa-form-select"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                    >
                      <option value="">Select a reason</option>
                      <option value="customer_refused">Customer refused additional services</option>
                      <option value="budget">Budget constraints</option>
                      <option value="alternative">Suggested alternative solution</option>
                      <option value="duplicate">Duplicate request</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="sa-form-group">
                    <label className="sa-form-label sa-required">Customer Communication Details</label>
                    <textarea 
                      className="sa-form-textarea"
                      value={customerCommunication}
                      onChange={(e) => setCustomerCommunication(e.target.value)}
                      placeholder="Details of communication with customer..."
                    />
                  </div>
                  
                  <div className="sa-details-footer">
                    <button className="sa-btn sa-btn-danger" onClick={handleDecline}>
                      Submit Decline
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sa-container">
      <header className="sa-header">
        <div className="sa-header-title">
          <h1>Service Approvals - Pending Requests</h1>
          <p>Manage service approval requests from operations team</p>
        </div>
      </header>

      <div className="sa-content-box">
        <div className="sa-metrics-container">
          <div className="sa-metric-card">
            <div className="sa-metric-header">
              <div className="sa-metric-title">Pending Approvals</div>
              <div className="sa-metric-icon"><i className="fas fa-clock"></i></div>
            </div>
            <div className="sa-metric-value">{pendingRequests.length}</div>
          </div>
          
          <div className="sa-metric-card sa-high-priority">
            <div className="sa-metric-header">
              <div className="sa-metric-title">High Priority</div>
              <div className="sa-metric-icon"><i className="fas fa-exclamation-triangle"></i></div>
            </div>
            <div className="sa-metric-value">{highPriorityCount}</div>
          </div>
          
          <div className="sa-metric-card">
            <div className="sa-metric-header">
              <div className="sa-metric-title">Today's Requests</div>
              <div className="sa-metric-icon"><i className="fas fa-calendar-day"></i></div>
            </div>
            <div className="sa-metric-value">8</div>
          </div>
        </div>

        <section className="sa-filter-section">
          <div className="sa-filter-header">
            <div className="sa-filter-title">Filter Requests</div>
          </div>
          <div className="sa-filter-controls">
            <div className="sa-filter-group sa-search-box">
              <label className="sa-filter-label">Search</label>
              <input 
                type="text" 
                className="sa-filter-input"
                placeholder="Job Card ID, Customer, Vehicle..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            
            <div className="sa-filter-group">
              <label className="sa-filter-label">Priority</label>
              <select 
                className="sa-filter-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="normal">Normal</option>
              </select>
            </div>
            
            <div className="sa-filter-group">
              <label className="sa-filter-label">Pending Duration</label>
              <select 
                className="sa-filter-select"
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
              >
                <option value="">Any Duration</option>
                <option value="<24h">Less than 24h</option>
                <option value="24-48h">24-48 hours</option>
                <option value=">48h">More than 48h</option>
              </select>
            </div>
            
            <div className="sa-filter-actions">
              <button className="sa-btn sa-btn-secondary" onClick={clearPendingFilters}>Clear</button>
            </div>
          </div>
        </section>

        <section className="sa-table-section">
          <div className="sa-table-header">
            <div className="sa-table-title">Pending Approval Requests</div>
            <div className="sa-table-info">Displaying <span>{filteredPending.length}</span> requests</div>
          </div>
          
          {filteredPending.length === 0 ? (
            <div className="sa-empty-state">
              <div className="sa-empty-state-icon"><i className="fas fa-inbox"></i></div>
              <h3>No Pending Requests</h3>
              <p>There are currently no pending approval requests.</p>
            </div>
          ) : (
            <div className="sa-table-wrapper">
              <table className="sa-requests-table">
                <thead>
                  <tr>
                    <th>Job Card ID</th>
                    <th>Customer Name</th>
                    <th>Mobile Number</th>
                    <th>Vehicle Plate</th>
                    <th>Assigned To</th>
                    <th>Pending Since</th>
                    <th>Total Added</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.map(request => (
                    <tr key={request.id}>
                      <td>{request.id}</td>
                      <td>{request.customer}</td>
                      <td>{request.contact}</td>
                      <td>{request.vehicle}</td>
                      <td>{request.assignedTo}</td>
                      <td>{request.pendingSince}</td>
                      <td>{request.totalAdded}</td>
                      <td>
                        <span className={`sa-status-badge ${request.priority === 'high' ? 'sa-status-high' : 'sa-status-normal'}`}>
                          {request.priority === 'high' ? 'High' : 'Normal'}
                        </span>
                      </td>
                      <td>
                        <button className="sa-action-btn sa-view" onClick={() => viewDetails(request.id)}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SalesApprovals;
