import React, { useState } from 'react';
import './SalesLeadHistory.css';
import PermissionGate from './PermissionGate';

const SalesLeadHistory = () => {
  const [showHistoryDetails, setShowHistoryDetails] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState(null);
  
  // Filter states
  const [historySearch, setHistorySearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');

  // Sample history data
  const [leadHistory] = useState([
    {
      id: "LD-2023-00101",
      customerName: "William Taylor",
      mobile: "+1 (555) 111-2222",
      make: "BMW",
      model: "3 Series",
      plate: "BMW-321",
      source: "Website",
      service: "PPF",
      createdBy: "Admin",
      assignedTo: "Sales Department",
      status: "Closed",
      created: "10/15/2023 10:30 AM",
      outcome: "Interested",
      closedDate: "10/20/2023 02:15 PM"
    },
    {
      id: "LD-2023-00102",
      customerName: "Sarah Martinez",
      mobile: "+1 (555) 222-3333",
      make: "Audi",
      model: "A4",
      plate: "AUDI-456",
      source: "Walk-in",
      service: "Polishing",
      createdBy: "Sarah Johnson",
      assignedTo: "Sales Department",
      status: "Closed",
      created: "10/12/2023 03:45 PM",
      outcome: "Not interested",
      closedDate: "10/18/2023 11:20 AM"
    },
    {
      id: "LD-2023-00103",
      customerName: "David Johnson",
      mobile: "+1 (555) 333-4444",
      make: "Tesla",
      model: "Model 3",
      plate: "TESLA-01",
      source: "Phone Call",
      service: "Window films",
      createdBy: "Michael Chen",
      assignedTo: "Sales Department",
      status: "Closed",
      created: "10/10/2023 09:00 AM",
      outcome: "Already have the service",
      closedDate: "10/16/2023 04:30 PM"
    },
    {
      id: "LD-2023-00104",
      customerName: "Emma Wilson",
      mobile: "+1 (555) 444-5555",
      make: "Porsche",
      model: "911",
      plate: "PORSCHE-1",
      source: "Website",
      service: "PPF",
      createdBy: "Admin",
      assignedTo: "Sales Department",
      status: "Closed",
      created: "10/08/2023 11:30 AM",
      outcome: "Didn't like the price",
      closedDate: "10/14/2023 01:45 PM"
    }
  ]);

  const getOutcomeClass = (outcome) => {
    switch(outcome) {
      case 'Interested': return 'slh-outcome-interested';
      case 'Not interested': return 'slh-outcome-notinterested';
      case 'Already have the service': return 'slh-outcome-already';
      case "Didn't like the price": return 'slh-outcome-price';
      default: return '';
    }
  };

  const getFilteredHistory = () => {
    return leadHistory.filter(lead => {
      const matchesSearch = 
        lead.customerName.toLowerCase().includes(historySearch.toLowerCase()) ||
        lead.mobile.toLowerCase().includes(historySearch.toLowerCase()) ||
        (lead.plate && lead.plate.toLowerCase().includes(historySearch.toLowerCase())) ||
        lead.id.toLowerCase().includes(historySearch.toLowerCase());
      
      const matchesOutcome = outcomeFilter === '' || lead.outcome === outcomeFilter;
      
      return matchesSearch && matchesOutcome;
    });
  };

  const viewHistoryDetails = (leadId) => {
    setCurrentLeadId(leadId);
    setShowHistoryDetails(true);
  };

  const backToDashboard = () => {
    setShowHistoryDetails(false);
    setCurrentLeadId(null);
  };

  const clearHistoryFilters = () => {
    setHistorySearch('');
    setOutcomeFilter('');
  };

  const filteredHistory = getFilteredHistory();
  const history = leadHistory.find(h => h.id === currentLeadId);

  if (showHistoryDetails && history) {
    return (
      <div className="slh-details-page">
        <div className="slh-details-header">
          <h1>Lead Details</h1>
          <button className="slh-back-btn" onClick={backToDashboard}>
            ← Back
          </button>
        </div>
        <div className="slh-details-container">
          <div className="slh-details-section">
            <h2 className="slh-section-title">Customer Information</h2>
            <div className="slh-details-grid">
              <div className="slh-detail-item">
                <div className="slh-detail-label">Lead ID</div>
                <div className="slh-detail-value">{history.id}</div>
              </div>
              <div className="slh-detail-item">
                <div className="slh-detail-label">Customer Name</div>
                <div className="slh-detail-value">{history.customerName}</div>
              </div>
              <div className="slh-detail-item">
                <div className="slh-detail-label">Mobile Number</div>
                <div className="slh-detail-value">{history.mobile}</div>
              </div>
              <div className="slh-detail-item">
                <div className="slh-detail-label">Vehicle Make</div>
                <div className="slh-detail-value">{history.make}</div>
              </div>
              <div className="slh-detail-item">
                <div className="slh-detail-label">Vehicle Model</div>
                <div className="slh-detail-value">{history.model}</div>
              </div>
              <div className="slh-detail-item">
                <div className="slh-detail-label">License Plate</div>
                <div className="slh-detail-value">{history.plate}</div>
              </div>
            </div>
          </div>

          <div className="slh-details-section">
            <h2 className="slh-section-title">Lead Details</h2>
            <div className="slh-details-grid">
              <div className="slh-detail-item">
                <div className="slh-detail-label">Lead Source</div>
                <div className="slh-detail-value">{history.source}</div>
              </div>
              <div className="slh-detail-item">
                <div className="slh-detail-label">Desired Service</div>
                <div className="slh-detail-value">{history.service}</div>
              </div>
              <div className="slh-detail-item">
                <div className="slh-detail-label">Created By</div>
                <div className="slh-detail-value">{history.createdBy}</div>
              </div>
              <div className="slh-detail-item">
                <div className="slh-detail-label">Assigned To</div>
                <div className="slh-detail-value">{history.assignedTo}</div>
              </div>
              <div className="slh-detail-item">
                <div className="slh-detail-label">Created Date</div>
                <div className="slh-detail-value">{history.created}</div>
              </div>
              <div className="slh-detail-item">
                <div className="slh-detail-label">Closed Date</div>
                <div className="slh-detail-value">{history.closedDate}</div>
              </div>
            </div>
          </div>

          <div className="slh-details-section">
            <h2 className="slh-section-title">Outcome</h2>
            <div className="slh-outcome-card">
              <div className={`slh-outcome-badge ${getOutcomeClass(history.outcome)}`}>
                {history.outcome}
              </div>
              <p className="slh-outcome-note">This lead was closed with the outcome: <strong>{history.outcome}</strong></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="slh-container">
      <div className="slh-header">
        <div className="slh-header-title">
          <h1><i className="fas fa-history"></i> Sales Lead History</h1>
          <p>View completed leads and their outcomes</p>
        </div>
      </div>

      <div className="slh-metrics-container">
        <div className="slh-metric-card">
          <div className="slh-metric-header">
            <span className="slh-metric-title">Total Closed Leads</span>
            <span className="slh-metric-icon">📊</span>
          </div>
          <div className="slh-metric-value">{leadHistory.length}</div>
        </div>
        <div className="slh-metric-card slh-interested">
          <div className="slh-metric-header">
            <span className="slh-metric-title">Interested</span>
            <span className="slh-metric-icon">✓</span>
          </div>
          <div className="slh-metric-value">{leadHistory.filter(l => l.outcome === 'Interested').length}</div>
        </div>
        <div className="slh-metric-card slh-notinterested">
          <div className="slh-metric-header">
            <span className="slh-metric-title">Not Interested</span>
            <span className="slh-metric-icon">✗</span>
          </div>
          <div className="slh-metric-value">{leadHistory.filter(l => l.outcome === 'Not interested').length}</div>
        </div>
      </div>

      <div className="slh-filter-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="slh-filter-title">Filters</h3>
          {(historySearch || outcomeFilter) && (
            <button className="slh-btn slh-btn-secondary" onClick={clearHistoryFilters}>
              Clear Filters
            </button>
          )}
        </div>
        <div className="slh-filter-controls">
          <div className="slh-filter-group">
            <label className="slh-filter-label">Search</label>
            <input 
              type="text" 
              className="slh-filter-input"
              placeholder="Search by name, phone, plate or ID..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
          </div>
          <div className="slh-filter-group">
            <label className="slh-filter-label">Outcome</label>
            <select 
              className="slh-filter-select"
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
            >
              <option value="">All Outcomes</option>
              <option value="Interested">Interested</option>
              <option value="Not interested">Not Interested</option>
              <option value="Already have the service">Already have the service</option>
              <option value="Didn't like the price">Didn't like the price</option>
            </select>
          </div>
        </div>
      </div>

      <div className="slh-table-section">
        <div className="slh-table-header">
          <h2 className="slh-table-title">Lead History</h2>
          <p className="slh-table-info">Showing <span>{filteredHistory.length}</span> of <span>{leadHistory.length}</span> leads</p>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="slh-empty-state">
            <div className="slh-empty-state-icon">📋</div>
            <h3>No leads found</h3>
            <p>Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <div className="slh-table-wrapper">
            <table className="slh-history-table">
              <thead>
                <tr>
                  <th>Lead ID</th>
                  <th>Customer Name</th>
                  <th>Mobile</th>
                  <th>Vehicle</th>
                  <th>Service</th>
                  <th>Created</th>
                  <th>Closed</th>
                  <th>Outcome</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(lead => (
                  <tr key={lead.id}>
                    <td><strong>{lead.id}</strong></td>
                    <td>{lead.customerName}</td>
                    <td>{lead.mobile}</td>
                    <td>{lead.make} {lead.model}</td>
                    <td>{lead.service}</td>
                    <td>{lead.created}</td>
                    <td>{lead.closedDate}</td>
                    <td>
                      <span className={`slh-outcome-badge ${getOutcomeClass(lead.outcome)}`}>
                        {lead.outcome}
                      </span>
                    </td>
                    <td>
                      <PermissionGate moduleId="salesleadhistory" optionId="salesleadhistory_view">
                        <button 
                          className="slh-action-btn"
                          onClick={() => viewHistoryDetails(lead.id)}
                        >
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
      </div>
    </div>
  );
};

export default SalesLeadHistory;
