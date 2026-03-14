import { useState } from 'react';
import './ServiceApprovalHistory.css';
import PermissionGate from './PermissionGate';

const ServiceApprovalHistory = () => {
  const [showHistoryDetails, setShowHistoryDetails] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  
  // Filter states
  const [historySearch, setHistorySearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('');

  // Sample data for request history
  const [requestHistory] = useState([
    {
      id: "JC-2023-0449",
      requestId: "APR-2023-0449",
      customer: "Sarah Johnson",
      contact: "(555) 234-5678",
      vehicle: "GHI-9012",
      requestDate: "Nov 13, 2023",
      decision: "approved",
      decisionDate: "Nov 14, 2023 10:30 AM",
      decisionBy: "John Smith",
      assignedTo: "John Smith",
      totalAdded: "$220.00",
      currentAmount: "$380.00",
      proposedAmount: "$220.00",
      combinedAmount: "$600.00",
      currentServices: [
        { name: "Oil Change", amount: "$80.00" },
        { name: "Brake Inspection", amount: "$120.00" },
        { name: "Tire Rotation", amount: "$60.00" },
        { name: "Wiper Fluid Refill", amount: "$40.00" },
        { name: "AC Inspection", amount: "$80.00" }
      ],
      proposedServices: [
        { name: "Brake Pad Replacement", amount: "$150.00" },
        { name: "Wheel Alignment", amount: "$70.00" }
      ],
      invoice: "INV-2023-0449",
      newInvoice: "INV-2023-0449A",
      paymentStatus: "Paid",
      requestedBy: "Operations Team (Mike Brown)",
      requestDateTime: "Nov 13, 2023 9:15 AM",
      vehicleDetails: "Honda Accord 2020",
      notes: "Customer agreed to additional services after explaining safety concerns with current brake pads.",
      isPending: false
    },
    {
      id: "JC-2023-0448",
      requestId: "APR-2023-0448",
      customer: "David Lee",
      contact: "(555) 345-6789",
      vehicle: "JKL-3456",
      requestDate: "Nov 12, 2023",
      decision: "declined",
      decisionDate: "Nov 13, 2023 3:15 PM",
      decisionBy: "Jane Doe",
      assignedTo: "Jane Doe",
      totalAdded: "$180.00",
      currentAmount: "$320.00",
      proposedAmount: "$180.00",
      combinedAmount: "$500.00",
      currentServices: [
        { name: "Basic Service", amount: "$150.00" },
        { name: "Wiper Blades", amount: "$50.00" },
        { name: "Air Filter", amount: "$120.00" }
      ],
      proposedServices: [
        { name: "Transmission Fluid Change", amount: "$180.00" }
      ],
      invoice: "INV-2023-0448",
      newInvoice: "",
      paymentStatus: "Unpaid",
      requestedBy: "Operations Team (Sarah Johnson)",
      requestDateTime: "Nov 12, 2023 11:30 AM",
      vehicleDetails: "Toyota Corolla 2018",
      notes: "Customer declined due to budget constraints.",
      declineReasonText: "Budget constraints",
      customerCommunicationText: "Customer called and stated they cannot afford the additional service at this time.",
      isPending: false
    },
    {
      id: "JC-2023-0447",
      requestId: "APR-2023-0447",
      customer: "Emily Wilson",
      contact: "(555) 456-7890",
      vehicle: "MNO-4567",
      requestDate: "Nov 11, 2023",
      decision: "approved",
      decisionDate: "Nov 12, 2023 9:45 AM",
      decisionBy: "John Smith",
      assignedTo: "Jane Doe",
      totalAdded: "$420.00",
      currentAmount: "$550.00",
      proposedAmount: "$420.00",
      combinedAmount: "$970.00",
      currentServices: [
        { name: "Major Service", amount: "$350.00" },
        { name: "Brake Fluid Change", amount: "$200.00" }
      ],
      proposedServices: [
        { name: "Timing Belt Replacement", amount: "$320.00" },
        { name: "Coolant Flush", amount: "$100.00" }
      ],
      invoice: "INV-2023-0447",
      newInvoice: "INV-2023-0447A",
      paymentStatus: "Paid",
      requestedBy: "Operations Team (Alex Chen)",
      requestDateTime: "Nov 11, 2023 2:30 PM",
      vehicleDetails: "BMW 3 Series 2019",
      notes: "Customer approved the additional services for preventive maintenance.",
      isPending: false
    }
  ]);

  const getFilteredHistory = () => {
    return requestHistory.filter(history => {
      const matchesSearch = historySearch === '' || 
        history.id.toLowerCase().includes(historySearch.toLowerCase()) ||
        history.customer.toLowerCase().includes(historySearch.toLowerCase()) ||
        history.decision.toLowerCase().includes(historySearch.toLowerCase());
      
      const matchesDecision = decisionFilter === '' || history.decision === decisionFilter;
      
      return matchesSearch && matchesDecision;
    });
  };

  const getCurrentHistory = () => {
    return requestHistory.find(req => req.id === currentRequestId);
  };

  const viewHistoryDetails = (requestId: string) => {
    setCurrentRequestId(requestId);
    setShowHistoryDetails(true);
  };

  const backToDashboard = () => {
    setShowHistoryDetails(false);
  };

  const clearHistoryFilters = () => {
    setHistorySearch('');
    setDecisionFilter('');
    setDateRangeFilter('');
  };

  const filteredHistory = getFilteredHistory();

  if (showHistoryDetails) {
    const history = getCurrentHistory();
    if (!history) return null;

    return (
      <div className="sah-details-page">
        <div className="sah-details-header">
          <h1>Request History Details</h1>
          <button className="sah-back-btn" onClick={backToDashboard}>
            <i className="fas fa-arrow-left"></i> Back to History
          </button>
        </div>
        
        <div className="sah-details-container">
          <div className="sah-details-section">
            <h2 className="sah-section-title">Request Summary</h2>
            <div className="sah-details-grid">
              <div className="sah-detail-item">
                <div className="sah-detail-label">Request ID</div>
                <div className="sah-detail-value">{history.requestId}</div>
              </div>
              <div className="sah-detail-item">
                <div className="sah-detail-label">Job Card ID</div>
                <div className="sah-detail-value">{history.id}</div>
              </div>
              <div className="sah-detail-item">
                <div className="sah-detail-label">Status</div>
                <div className="sah-detail-value">
                  <span className={`sah-status-badge ${history.decision === 'approved' ? 'sah-status-approved' : 'sah-status-declined'}`}>
                    {history.decision === 'approved' ? 'Approved' : 'Declined'}
                  </span>
                </div>
              </div>
              <div className="sah-detail-item">
                <div className="sah-detail-label">Decision By</div>
                <div className="sah-detail-value">{history.decisionBy}</div>
              </div>
              <div className="sah-detail-item">
                <div className="sah-detail-label">Decision Date</div>
                <div className="sah-detail-value">{history.decisionDate}</div>
              </div>
              <div className="sah-detail-item">
                <div className="sah-detail-label">Requested By</div>
                <div className="sah-detail-value">{history.requestedBy}</div>
              </div>
              <div className="sah-detail-item">
                <div className="sah-detail-label">Request Date</div>
                <div className="sah-detail-value">{history.requestDateTime}</div>
              </div>
              <div className="sah-detail-item">
                <div className="sah-detail-label">Customer Name</div>
                <div className="sah-detail-value">{history.customer}</div>
              </div>
              <div className="sah-detail-item">
                <div className="sah-detail-label">Mobile Number</div>
                <div className="sah-detail-value">{history.contact}</div>
              </div>
              <div className="sah-detail-item">
                <div className="sah-detail-label">Vehicle Plate</div>
                <div className="sah-detail-value">{history.vehicle} ({history.vehicleDetails})</div>
              </div>
              <div className="sah-detail-item">
                <div className="sah-detail-label">Assigned To</div>
                <div className="sah-detail-value">{history.assignedTo}</div>
              </div>
            </div>
          </div>
          
          <div className="sah-details-section">
            <h2 className="sah-section-title">Financial Overview</h2>
            <div className="sah-financial-cards">
              <div className="sah-financial-card sah-current">
                <div className="sah-financial-card-header">
                  <div className="sah-financial-card-title">Original Services</div>
                  <div className="sah-financial-card-amount">{history.currentAmount}</div>
                </div>
                <div className="sah-detail-label">Original Invoice: <span>{history.invoice}</span></div>
                <ul className="sah-service-list">
                  {history.currentServices.map((service, idx) => (
                    <li key={idx}>
                      <span className="sah-service-name">{service.name}</span>
                      <span className="sah-service-amount">{service.amount}</span>
                    </li>
                  ))}
                </ul>
                <div className="sah-detail-label" style={{marginTop: '12px'}}>
                  Payment Status: <strong>{history.paymentStatus}</strong>
                </div>
              </div>
              
              <div className="sah-financial-card sah-proposed">
                <div className="sah-financial-card-header">
                  <div className="sah-financial-card-title">Additional Services</div>
                  <div className="sah-financial-card-amount">{history.proposedAmount}</div>
                </div>
                {history.newInvoice && (
                  <div className="sah-detail-label">New Invoice: <span>{history.newInvoice}</span></div>
                )}
                <ul className="sah-service-list">
                  {history.proposedServices.map((service, idx) => (
                    <li key={idx}>
                      <span className="sah-service-name">{service.name}</span>
                      <span className="sah-service-amount">{service.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="sah-financial-card sah-combined">
                <div className="sah-financial-card-header">
                  <div className="sah-financial-card-title">Combined Total</div>
                  <div className="sah-financial-card-amount">{history.combinedAmount}</div>
                </div>
                <div className="sah-service-breakdown">
                  <div className="sah-breakdown-item">
                    <span>Original Services:</span>
                    <span>{history.currentAmount}</span>
                  </div>
                  <div className="sah-breakdown-item">
                    <span>Additional Services:</span>
                    <span>{history.proposedAmount}</span>
                  </div>
                  <div className="sah-breakdown-divider"></div>
                  <div className="sah-breakdown-item sah-total">
                    <span><strong>Final Total:</strong></span>
                    <span><strong>{history.combinedAmount}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {history.notes && (
            <div className="sah-details-section">
              <h2 className="sah-section-title">Notes</h2>
              <div className="sah-notes-content">
                {history.notes}
              </div>
            </div>
          )}
          
          {history.decision === 'declined' && history.declineReasonText && (
            <div className="sah-details-section">
              <h2 className="sah-section-title">Decline Information</h2>
              <div className="sah-details-grid">
                <div className="sah-detail-item">
                  <div className="sah-detail-label">Decline Reason</div>
                  <div className="sah-detail-value">{history.declineReasonText}</div>
                </div>
                {history.customerCommunicationText && (
                  <div className="sah-detail-item sah-full-width">
                    <div className="sah-detail-label">Customer Communication</div>
                    <div className="sah-detail-value">{history.customerCommunicationText}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="sah-container">
      <header className="sah-header">
        <div className="sah-header-title">
          <h1>Service Approval History</h1>
          <p>View all past service approval decisions and details</p>
        </div>
      </header>

      <div className="sah-content">
        <section className="sah-filter-section">
          <div className="sah-filter-header">
            <div className="sah-filter-title">Filter History</div>
          </div>
          <div className="sah-filter-controls">
            <div className="sah-filter-group sah-search-box">
              <label className="sah-filter-label">Search</label>
              <input 
                type="text" 
                className="sah-filter-input"
                placeholder="Job Card ID, Customer, Decision..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
            
            <div className="sah-filter-group">
              <label className="sah-filter-label">Decision</label>
              <select 
                className="sah-filter-select"
                value={decisionFilter}
                onChange={(e) => setDecisionFilter(e.target.value)}
              >
                <option value="">All Decisions</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            
            <div className="sah-filter-group">
              <label className="sah-filter-label">Date Range</label>
              <select 
                className="sah-filter-select"
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            
            <div className="sah-filter-actions">
              <button className="sah-btn sah-btn-secondary" onClick={clearHistoryFilters}>Clear</button>
            </div>
          </div>
        </section>

        <section className="sah-table-section">
          <div className="sah-table-header">
            <div className="sah-table-title">Request History</div>
            <div className="sah-table-info">Displaying <span>{filteredHistory.length}</span> historical requests</div>
          </div>
          
          {filteredHistory.length === 0 ? (
            <div className="sah-empty-state">
              <div className="sah-empty-state-icon"><i className="fas fa-history"></i></div>
              <h3>No History Available</h3>
              <p>No request history found for the selected filters.</p>
            </div>
          ) : (
            <div className="sah-table-wrapper">
              <table className="sah-history-table">
                <thead>
                  <tr>
                    <th>Job Card ID</th>
                    <th>Customer Name</th>
                    <th>Vehicle Plate</th>
                    <th>Request Date</th>
                    <th>Decision</th>
                    <th>Decision By</th>
                    <th>Total Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(history => (
                    <tr key={history.id}>
                      <td>{history.id}</td>
                      <td>{history.customer}</td>
                      <td>{history.vehicle}</td>
                      <td>{history.requestDate}</td>
                      <td>
                        <span className={`sah-status-badge ${history.decision === 'approved' ? 'sah-status-approved' : 'sah-status-declined'}`}>
                          {history.decision === 'approved' ? 'Approved' : 'Declined'}
                        </span>
                      </td>
                      <td>{history.decisionBy}</td>
                      <td>{history.totalAdded}</td>
                      <td>
                        <PermissionGate moduleId="approvalhistory" optionId="approvalhistory_view">
                          <button className="sah-action-btn sah-view" onClick={() => viewHistoryDetails(history.id)}>
                            View Details
                          </button>
                        </PermissionGate>
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

export default ServiceApprovalHistory;
