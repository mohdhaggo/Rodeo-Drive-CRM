import React, { useState } from 'react';
import './SalesLeadManagement.css';
import PermissionGate from './PermissionGate';

const SalesLeadManagement = () => {
  const [showDetailsPage, setShowDetailsPage] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState('');
  const [showModal, setShowModal] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  
  // Search and filter states
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  
  // Form states
  const [commentText, setCommentText] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Working on it');
  
  // New lead form states
  const [newLead, setNewLead] = useState({
    customerName: '',
    mobileNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    vehiclePlate: '',
    leadSource: 'Website',
    desiredService: ''
  });

  // Sample data - Pending Leads Only
  const [leads, setLeads] = useState([
    {
      id: "LD-2023-00123",
      customerName: "James Wilson",
      mobile: "+1 (555) 123-4567",
      make: "BMW",
      model: "X5",
      plate: "ABC-123",
      source: "Website",
      service: "PPF",
      createdBy: "Admin",
      assignedTo: "Sales Department",
      status: "New Lead",
      created: "10/25/2023 09:15 AM"
    },
    {
      id: "LD-2023-00124",
      customerName: "Maria Garcia",
      mobile: "+1 (555) 987-6543",
      make: "Toyota",
      model: "Camry",
      plate: "XYZ-789",
      source: "Phone Call",
      service: "Window films",
      createdBy: "Sarah Johnson",
      assignedTo: "Sales Department",
      status: "Working on it",
      created: "10/24/2023 02:30 PM"
    },
    {
      id: "LD-2023-00125",
      customerName: "Robert Chen",
      mobile: "+1 (555) 456-7890",
      make: "Mercedes",
      model: "E-Class",
      plate: "MERC-001",
      source: "Walk-in",
      service: "Polishing",
      createdBy: "Michael Chen",
      assignedTo: "Sales Department",
      status: "No Answer",
      created: "10/23/2023 11:45 AM"
    }
  ]);

  const [activityLogs, setActivityLogs] = useState({
    "LD-2023-00123": [
      { user: "Admin", time: "10/25/2023 09:15 AM", text: "Lead created from website inquiry", isComment: false }
    ],
    "LD-2023-00124": [
      { user: "Sarah Johnson", time: "10/25/2023 10:05 AM", text: "Customer seems very interested in premium window films", isComment: true },
      { user: "Sarah Johnson", time: "10/24/2023 02:30 PM", text: "Lead created from phone call", isComment: false }
    ]
  });

  // Helper functions
  const getStatusClass = (status) => {
    switch(status) {
      case 'New Lead': return 'status-new';
      case 'Working on it': return 'status-working';
      case 'No Answer': return 'status-noanswer';
      case 'Closed': return 'status-closed';
      default: return 'status-new';
    }
  };

  const getServiceClass = (service) => {
    switch(service) {
      case 'Packages': return 'service-packages';
      case 'PPF': return 'service-ppf';
      case 'Window films': return 'service-window';
      case 'Polishing': return 'service-polishing';
      case 'Paint': return 'service-paint';
      case 'Repair': return 'service-repair';
      default: return 'service-packages';
    }
  };

  // Filter leads
  const getFilteredLeads = () => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.customerName.toLowerCase().includes(searchInput.toLowerCase()) ||
        lead.mobile.toLowerCase().includes(searchInput.toLowerCase()) ||
        (lead.plate && lead.plate.toLowerCase().includes(searchInput.toLowerCase())) ||
        lead.id.toLowerCase().includes(searchInput.toLowerCase());
      
      const matchesStatus = statusFilter === '' || lead.status === statusFilter;
      const matchesService = serviceFilter === '' || lead.service === serviceFilter;
      
      return matchesSearch && matchesStatus && matchesService;
    });
  };

  // View lead details
  const viewLeadDetails = (leadId) => {
    setCurrentLeadId(leadId);
    setShowDetailsPage(true);
    setOpenDropdown(null);
  };

  // Modal handlers
  const openModal = (modalName) => {
    setShowModal(modalName);
    
    if (modalName === 'reassign') {
      const lead = leads.find(l => l.id === currentLeadId);
      if (lead) setSelectedAgent(lead.assignedTo || "Sales Department");
    }
    
    if (modalName === 'status') {
      const lead = leads.find(l => l.id === currentLeadId);
      if (lead) {
        setSelectedStatus(lead.status === "New Lead" ? "Working on it" : lead.status);
      }
    }
  };

  const closeModal = () => {
    setShowModal('');
    setCommentText('');
    setNewLead({
      customerName: '',
      mobileNumber: '',
      vehicleMake: '',
      vehicleModel: '',
      vehiclePlate: '',
      leadSource: 'Website',
      desiredService: ''
    });
  };

  // Save comment
  const saveComment = () => {
    if (!commentText.trim()) {
      // Removed alert for missing comment
      return;
    }

    const now = new Date();
    const timeStr = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

    setActivityLogs(prev => ({
      ...prev,
      [currentLeadId]: [
        { user: "Current User", time: timeStr, text: commentText, isComment: true },
        ...(prev[currentLeadId] || [])
      ]
    }));

    closeModal();
  };

  // Save reassignment
  const saveReassignment = () => {
    const leadIndex = leads.findIndex(l => l.id === currentLeadId);
    if (leadIndex > -1) {
      const updatedLeads = [...leads];
      updatedLeads[leadIndex].assignedTo = selectedAgent;
      setLeads(updatedLeads);
    }
    closeModal();
  };

  // Save status change
  const saveStatusChange = () => {
    const leadIndex = leads.findIndex(l => l.id === currentLeadId);
    if (leadIndex > -1) {
      const updatedLeads = [...leads];
      updatedLeads[leadIndex].status = selectedStatus;
      setLeads(updatedLeads);
    }
    closeModal();
  };

  // Save new lead
  const saveNewLead = () => {
    if (!newLead.customerName.trim()) {
      alert("Please enter customer name");
      return;
    }

    const newLeadObject = {
      id: `LD-2023-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
      customerName: newLead.customerName,
      mobile: newLead.mobileNumber,
      make: newLead.vehicleMake,
      model: newLead.vehicleModel,
      plate: newLead.vehiclePlate,
      source: newLead.leadSource,
      service: newLead.desiredService,
      createdBy: "Current User",
      assignedTo: "Sales Department",
      status: "New Lead",
      created: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
    };

    setLeads([newLeadObject, ...leads]);
    closeModal();
  };

  // Get current lead for details page
  const currentLead = leads.find(l => l.id === currentLeadId);

  // Details Page Render
  if (showDetailsPage && currentLead) {
    return (
      <div className="slm-details-page">
        <div className="slm-details-header">
          <h1>Lead Details</h1>
          <button className="slm-back-btn" onClick={() => setShowDetailsPage(false)}>← Back</button>
        </div>
        
        <div className="slm-details-container">
          <div className="slm-card">
            <h3>Customer Information</h3>
            <div className="slm-details-grid">
              <div className="slm-detail-item">
                <div className="slm-detail-label">Lead ID</div>
                <div className="slm-detail-value">{currentLead.id}</div>
              </div>
              <div className="slm-detail-item">
                <div className="slm-detail-label">Customer Name</div>
                <div className="slm-detail-value">{currentLead.customerName}</div>
              </div>
              <div className="slm-detail-item">
                <div className="slm-detail-label">Mobile</div>
                <div className="slm-detail-value">{currentLead.mobile}</div>
              </div>
              <div className="slm-detail-item">
                <div className="slm-detail-label">Vehicle</div>
                <div className="slm-detail-value">{currentLead.make ? `${currentLead.make} ${currentLead.model}` : 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="slm-card">
            <h3>Lead Information</h3>
            <div className="slm-details-grid">
              <div className="slm-detail-item">
                <div className="slm-detail-label">Lead Source</div>
                <div className="slm-detail-value">{currentLead.source}</div>
              </div>
              <div className="slm-detail-item">
                <div className="slm-detail-label">Desired Service</div>
                <div className="slm-detail-value">{currentLead.service}</div>
              </div>
              <div className="slm-detail-item">
                <div className="slm-detail-label">Status</div>
                <div className="slm-detail-value">
                  <span className={`slm-status-badge ${getStatusClass(currentLead.status)}`}>
                    {currentLead.status}
                  </span>
                </div>
              </div>
              <div className="slm-detail-item">
                <div className="slm-detail-label">Created</div>
                <div className="slm-detail-value">{currentLead.created}</div>
              </div>
            </div>
          </div>

          <div className="slm-card">
            <h3><i className="fas fa-history"></i> Activity Log</h3>
            <div className="slm-comment-section">
              <button className="slm-btn-primary" onClick={() => openModal('comment')}>
                <i className="fas fa-comment-medical"></i> Add New Comment
              </button>
            </div>
            
            <div className="slm-activity-log">
              {(activityLogs[currentLeadId] || []).map((activity, index) => (
                <div key={index} className="slm-activity-item">
                  <div className="slm-activity-header">
                    <strong>{activity.user}</strong>
                    <span className="slm-activity-time">{activity.time}</span>
                  </div>
                  <p>{activity.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Lead Queue Render
  return (
    <div className="slm-container">
      <div className="slm-header">
        <h1><i className="fas fa-car"></i> Sales Lead Management - Pending Leads</h1>
        <p>Track and manage active sales leads</p>
      </div>

      <div className="slm-content-area">
        <div className="slm-toolbar">
          <PermissionGate moduleId="saleslead" optionId="saleslead_add">
            <button className="slm-btn-primary" onClick={() => openModal('addLead')}>
              <i className="fas fa-plus-circle"></i> Add New Lead
            </button>
          </PermissionGate>
          
          <div className="slm-search-filter">
            <input 
              type="text" 
              className="slm-search-box" 
              placeholder="Search by name, phone, plate or ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <select 
              className="slm-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="New Lead">New Lead</option>
              <option value="Working on it">Working on it</option>
              <option value="No Answer">No Answer</option>
            </select>
            <select 
              className="slm-filter-select"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              <option value="">All Services</option>
              <option value="Packages">Packages</option>
              <option value="PPF">PPF</option>
              <option value="Window films">Window Films</option>
              <option value="Polishing">Polishing</option>
              <option value="Paint">Paint</option>
              <option value="Repair">Repair</option>
            </select>
          </div>
        </div>

        <div className="slm-table-wrapper">
          <table className="slm-leads-table">
            <thead>
              <tr>
                <th>Lead ID</th>
                <th>Customer Name</th>
                <th>Mobile</th>
                <th>Vehicle</th>
                <th>Service</th>
                <th>Source</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredLeads().length === 0 ? (
                <tr>
                  <td colSpan="10" className="slm-no-data">
                    <i className="fas fa-search"></i>
                    <div>No leads found matching your criteria</div>
                  </td>
                </tr>
              ) : (
                getFilteredLeads().map(lead => (
                  <tr key={lead.id}>
                    <td><strong>{lead.id}</strong></td>
                    <td>{lead.customerName}</td>
                    <td>{lead.mobile}</td>
                    <td>{lead.make ? `${lead.make} ${lead.model}` : 'N/A'}</td>
                    <td>
                      <span className={`slm-service-tag ${getServiceClass(lead.service)}`}>
                        {lead.service}
                      </span>
                    </td>
                    <td>{lead.source}</td>
                    <td>{lead.assignedTo}</td>
                    <td>
                      <span className={`slm-status-badge ${getStatusClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>{lead.created}</td>
                    <td>
                      <PermissionGate moduleId="saleslead" optionId="saleslead_actions">
                        <div className="slm-action-dropdown">
                          <button 
                            className="slm-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === lead.id ? null : lead.id);
                            }}
                          >
                            More
                          </button>
                          {openDropdown === lead.id && (
                            <div className="slm-action-menu">
                              <a href="#" onClick={(e) => {
                                e.preventDefault();
                                viewLeadDetails(lead.id);
                              }}>
                                <i className="fas fa-eye"></i> View Details
                              </a>
                              <a href="#" onClick={(e) => {
                                e.preventDefault();
                                setCurrentLeadId(lead.id);
                                openModal('reassign');
                              }}>
                                <i className="fas fa-user-friends"></i> Reassign
                              </a>
                              <a href="#" onClick={(e) => {
                                e.preventDefault();
                                setCurrentLeadId(lead.id);
                                openModal('status');
                              }}>
                                <i className="fas fa-sync-alt"></i> Update Status
                              </a>
                            </div>
                          )}
                        </div>
                      </PermissionGate>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Lead Modal */}
      {showModal === 'addLead' && (
        <div className="slm-modal" onClick={closeModal}>
          <div className="slm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="slm-modal-header">
              <h2><i className="fas fa-plus-circle"></i> Add New Lead</h2>
              <button className="slm-close-modal" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="slm-modal-body">
              <input 
                type="text" 
                placeholder="Customer Name" 
                className="slm-input"
                value={newLead.customerName}
                onChange={(e) => setNewLead({...newLead, customerName: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Mobile Number" 
                className="slm-input"
                value={newLead.mobileNumber}
                onChange={(e) => setNewLead({...newLead, mobileNumber: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Vehicle Make" 
                className="slm-input"
                value={newLead.vehicleMake}
                onChange={(e) => setNewLead({...newLead, vehicleMake: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Vehicle Model" 
                className="slm-input"
                value={newLead.vehicleModel}
                onChange={(e) => setNewLead({...newLead, vehicleModel: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="License Plate" 
                className="slm-input"
                value={newLead.vehiclePlate}
                onChange={(e) => setNewLead({...newLead, vehiclePlate: e.target.value})}
              />
              <select 
                className="slm-input"
                value={newLead.leadSource}
                onChange={(e) => setNewLead({...newLead, leadSource: e.target.value})}
              >
                <option value="Website">Website</option>
                <option value="Phone Call">Phone Call</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Referral">Referral</option>
              </select>
              <select 
                className="slm-input"
                value={newLead.desiredService}
                onChange={(e) => setNewLead({...newLead, desiredService: e.target.value})}
              >
                <option value="">Select Service</option>
                <option value="Packages">Packages</option>
                <option value="PPF">PPF</option>
                <option value="Window films">Window Films</option>
                <option value="Polishing">Polishing</option>
                <option value="Paint">Paint</option>
                <option value="Repair">Repair</option>
              </select>
            </div>
            
            <div className="slm-btn-group">
              <button className="slm-btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="slm-btn-primary" onClick={saveNewLead}>Create Lead</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {showModal === 'comment' && (
        <div className="slm-modal" onClick={closeModal}>
          <div className="slm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="slm-modal-header">
              <h2><i className="fas fa-comment"></i> Add Comment</h2>
              <button className="slm-close-modal" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="slm-modal-body">
              <textarea 
                placeholder="Enter your comment..." 
                className="slm-textarea"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
            </div>
            
            <div className="slm-btn-group">
              <button className="slm-btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="slm-btn-primary" onClick={saveComment}>Save Comment</button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showModal === 'reassign' && (
        <div className="slm-modal" onClick={closeModal}>
          <div className="slm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="slm-modal-header">
              <h2><i className="fas fa-user-friends"></i> Reassign Lead</h2>
              <button className="slm-close-modal" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="slm-modal-body">
              <label>Assign To:</label>
              <select 
                className="slm-input"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                <option value="Sales Department">Sales Department</option>
                <option value="John Smith">John Smith</option>
                <option value="Sarah Johnson">Sarah Johnson</option>
                <option value="Michael Chen">Michael Chen</option>
              </select>
            </div>
            
            <div className="slm-btn-group">
              <button className="slm-btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="slm-btn-primary" onClick={saveReassignment}>Reassign</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showModal === 'status' && (
        <div className="slm-modal" onClick={closeModal}>
          <div className="slm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="slm-modal-header">
              <h2><i className="fas fa-sync-alt"></i> Update Status</h2>
              <button className="slm-close-modal" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="slm-modal-body">
              <label>New Status:</label>
              <select 
                className="slm-input"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="New Lead">New Lead</option>
                <option value="Working on it">Working on it</option>
                <option value="No Answer">No Answer</option>
              </select>
            </div>
            
            <div className="slm-btn-group">
              <button className="slm-btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="slm-btn-primary" onClick={saveStatusChange}>Update Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesLeadManagement;
