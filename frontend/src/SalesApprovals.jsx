import React, { useState } from 'react';
import { useApprovalRequests } from './ApprovalRequestsContext.jsx';
import './SalesApprovals.css';
import PermissionGate from './PermissionGate';

// SalesApprovals module: displays, filters, and manages approval requests
const SalesApprovals = () => {
  const { requests, updateRequestStatus } = useApprovalRequests();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');

  // Filter pending requests
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const filteredRequests = pendingRequests.filter(r => {
    const matchesSearch = search === '' || r.customer?.toLowerCase().includes(search.toLowerCase()) || r.vehicle?.toLowerCase().includes(search.toLowerCase()) || r.id?.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priority === '' || r.priority === priority;
    return matchesSearch && matchesPriority;
  });

  const handleViewDetails = (id) => {
    setSelectedRequestId(id);
    setShowDetails(true);
    setDecision('');
    setNotes('');
  };

  const handleApprove = () => {
    updateRequestStatus(selectedRequestId, 'approved', notes);
    setShowDetails(false);
  };

  const handleDecline = () => {
    updateRequestStatus(selectedRequestId, 'declined', notes);
    setShowDetails(false);
  };

  const handleBack = () => {
    setShowDetails(false);
    setDecision('');
    setNotes('');
  };

  if (showDetails) {
    const req = requests.find(r => r.id === selectedRequestId);
    if (!req) return <div>Request not found.</div>;
    return (
      <div className="sa-details-page">
        <button className="sa-back-btn" onClick={handleBack}>Back</button>
        <h2>Approval Request Details</h2>
        <div className="sa-details-grid">
          <div><strong>Customer:</strong> {req.customer}</div>
          <div><strong>Vehicle:</strong> {req.vehicle}</div>
          <div><strong>Job Card ID:</strong> {req.id}</div>
          <div><strong>Requested By:</strong> {req.requestedBy}</div>
          <div><strong>Request Date:</strong> {req.requestDate}</div>
          <div><strong>Priority:</strong> {req.priority}</div>
          <div><strong>Status:</strong> {req.status}</div>
        </div>
        <div className="sa-decision-section">
          <label>Decision:</label>
          <select value={decision} onChange={e => setDecision(e.target.value)}>
            <option value="">Select</option>
            <option value="approve">Approve</option>
            <option value="decline">Decline</option>
          </select>
          {decision === 'approve' && (
            <div>
              <label>Notes (optional):</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} />
              <button className="sa-btn sa-btn-success" onClick={handleApprove}>Submit Approval</button>
            </div>
          )}
          {decision === 'decline' && (
            <PermissionGate moduleId="approval" optionId="approval_decline">
              <div>
                <label>Reason:</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} />
                <button className="sa-btn sa-btn-danger" onClick={handleDecline}>Submit Decline</button>
              </div>
            </PermissionGate>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="sa-container">
      <header className="sa-header">
        <h1>Service Approvals - Pending Requests</h1>
        <p>Manage approval requests from all modules</p>
      </header>
      <div className="sa-content-box">
        <div className="sa-filter-section">
          <input type="text" placeholder="Search by customer, vehicle, job card..." value={search} onChange={e => setSearch(e.target.value)} />
          <select value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>
        </div>
        <section className="sa-table-section">
          <h2>Pending Approval Requests</h2>
          {filteredRequests.length === 0 ? (
            <div className="sa-empty-state">No pending requests.</div>
          ) : (
            <table className="sa-requests-table">
              <thead>
                <tr>
                  <th>Job Card ID</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Priority</th>
                  <th>Requested By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(req => (
                  <tr key={req.id}>
                    <td>{req.id}</td>
                    <td>{req.customer}</td>
                    <td>{req.vehicle}</td>
                    <td>{req.priority}</td>
                    <td>{req.requestedBy}</td>
                    <td>
                      <button className="sa-action-btn" onClick={() => handleViewDetails(req.id)}>View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
};

export default SalesApprovals;
