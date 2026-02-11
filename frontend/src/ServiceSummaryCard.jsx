import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaGripVertical, FaUserTie, FaUsers, FaEdit, FaSave, FaCheckDouble, FaPlusCircle, FaClock, FaCheckCircle, FaTimesCircle, FaWrench } from 'react-icons/fa';

// =====================================================================
// Sortable Service Item Component
// =====================================================================
const SortableServiceItem = ({ service, editMode, onUpdate, onApprovalRequest }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: service.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [techDropdownOpen, setTechDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Available technicians list
  const availableTechs = [
    { id: '1', name: 'Mike T.' },
    { id: '2', name: 'Anna P.' },
    { id: '3', name: 'Omar K.' },
    { id: '4', name: 'Elena R.' },
    { id: '5', name: 'Tom B.' },
  ];

  // Handle technician checkbox change
  const handleTechChange = (techName, checked) => {
    let updatedTechs = [...(service.technicians || [])];
    if (checked) {
      if (!updatedTechs.includes(techName)) {
        updatedTechs.push(techName);
      }
    } else {
      updatedTechs = updatedTechs.filter(t => t !== techName);
    }
    onUpdate(service.id, { technicians: updatedTechs });
  };

  // Handle assigned to change
  const handleAssignedToChange = (e) => {
    onUpdate(service.id, { assignedTo: e.target.value || null });
  };

  // Handle status change
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    
    // If changing to Postponed or Cancelled, trigger approval request
    if ((newStatus === 'Postponed' || newStatus === 'Cancelled') && 
        service.status !== 'Pending Approval' && 
        service.status !== newStatus) {
      onApprovalRequest(service.id, newStatus);
    } else {
      // Direct status update for other statuses
      const updates = { status: newStatus };
      
      // Capture start time when moving to Inprogress
      if (newStatus === 'Inprogress' && service.status !== 'Inprogress' && !service.startTime) {
        updates.startTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      }
      
      // Capture end time when moving to Completed
      if (newStatus === 'Completed' && service.status !== 'Completed' && !service.endTime) {
        updates.endTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      }
      
      onUpdate(service.id, updates);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setTechDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'Inprogress': return 'status-inprogress';
      case 'Completed': return 'status-completed';
      case 'Cancelled': return 'status-cancelled';
      case 'Postponed': return 'status-postponed';
      case 'Pending Approval': return 'status-pending-approval';
      default: return 'status-pending';
    }
  };

  // Approval status card
  const renderApprovalCard = () => {
    if (service.status === 'Pending Approval') {
      return (
        <div className="approval-status-card">
          <FaClock style={{ color: '#b38b00' }} />
          <span>
            <strong>Approval pending</strong> — {service.requestedAction || 'Postponed/Cancelled'} request sent to manager
          </span>
        </div>
      );
    }
    if (service.approvalStatus === 'approved' && (service.status === 'Postponed' || service.status === 'Cancelled')) {
      return (
        <div className="approval-status-card approved">
          <FaCheckCircle style={{ color: '#155724' }} />
          <span><strong>Approved</strong> — {service.status} request has been approved</span>
        </div>
      );
    }
    if (service.approvalStatus === 'declined' && service.status === 'Pending') {
      return (
        <div className="approval-status-card declined">
          <FaTimesCircle style={{ color: '#721c24' }} />
          <span><strong>Declined</strong> — Request was declined, service remains Pending</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div ref={setNodeRef} style={style} className="service-item">
      <div className="service-header">
        <div className="service-name">
          <span {...attributes} {...listeners} className="drag-handle">
            <FaGripVertical />
          </span>
          {service.name}
        </div>
        <span className={`status-badge ${getStatusClass(service.status)} service-status-badge`}>
          {service.status}
        </span>
      </div>

      {/* Meta row: start time, end time, status, assigned to */}
      <div className="service-meta-row">
        <div className="meta-item">
          <span className="meta-label">Start time</span>
          <span className="meta-value start-time-display">{service.startTime || '—'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">End time</span>
          <span className="meta-value end-time-display">{service.endTime || '—'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Service work status</span>
          <span className="meta-value status-display">{service.status}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Assigned to</span>
          <span className="meta-value assigned-display">{service.assignedTo || '—'}</span>
        </div>
      </div>

      {/* Edit controls – visible only in edit mode */}
      {editMode && (
        <div className="assign-controls edit-controls">
          <div className="control-group">
            <span className="control-label"><FaUserTie /> Assigned to</span>
            <select 
              className="assigned-select" 
              value={service.assignedTo || ''} 
              onChange={handleAssignedToChange}
            >
              <option value="">— assign —</option>
              <option value="John S.">John S.</option>
              <option value="Lisa M.">Lisa M.</option>
              <option value="David C.">David C.</option>
              <option value="Sarah M.">Sarah M.</option>
            </select>
          </div>

          <div className="control-group">
            <span className="control-label"><FaUsers /> Technicians</span>
            <div className="tech-dropdown" ref={dropdownRef}>
              <button 
                type="button" 
                className="tech-dropdown-btn"
                onClick={() => setTechDropdownOpen(!techDropdownOpen)}
              >
                <span>
                  {service.technicians?.length ? service.technicians.join(', ') : 'Select technicians'}
                </span>
                <i className="fas fa-chevron-down"></i>
              </button>
              {techDropdownOpen && (
                <div className="tech-dropdown-content show">
                  {availableTechs.map(tech => (
                    <div key={tech.id} className="tech-option">
                      <input
                        type="checkbox"
                        id={`tech-${service.id}-${tech.id}`}
                        value={tech.name}
                        checked={service.technicians?.includes(tech.name) || false}
                        onChange={(e) => handleTechChange(tech.name, e.target.checked)}
                      />
                      <label htmlFor={`tech-${service.id}-${tech.id}`}>{tech.name}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="control-group">
            <span className="control-label">Service work status</span>
            <select 
              className="work-status-select" 
              value={service.status} 
              onChange={handleStatusChange}
            >
              <option value="Pending">Pending</option>
              <option value="Inprogress">In Progress</option>
              <option value="Postponed">Postponed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      )}

      {/* Notes */}
      {service.notes && (
        <div className="service-notes">
          <span className="notes-label">Notes:</span> {service.notes}
        </div>
      )}

      {/* Assigned Technicians Section (always visible) */}
      <div className="assigned-tech-section">
        <div className="assigned-tech-title">
          <FaWrench /> Assigned Technicians
        </div>
        <div className="tech-badge-list">
          {service.technicians?.length ? (
            service.technicians.map(tech => (
              <span key={tech} className="tech-badge">{tech}</span>
            ))
          ) : (
            <span style={{ color: 'var(--dark-gray)' }}>No technicians assigned</span>
          )}
        </div>
      </div>

      {/* Approval status card */}
      {renderApprovalCard()}
    </div>
  );
};

// =====================================================================
// Main Service Summary Card Component
// =====================================================================
export const ServiceSummaryCard = ({
  jobId,
  services,
  onServicesReorder,
  onServiceUpdate,
  onAddService,
  onFinishWork,
  allServicesCompleted,
  editMode,
  setEditMode,
}) => {
  const [isAddingService, setIsAddingService] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState(null);
  const [localServices, setLocalServices] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Normalize and sync services when props change
  useEffect(() => {
    const normalizedServices = (services || []).map((s, idx) => ({
      ...s,
      id: s.id || `service-${idx}-${Date.now()}`,
      name: s.name || `Service ${idx + 1}`,
      order: s.order || (idx + 1),
      status: s.status || 'Pending',
      assignedTo: s.assignedTo || null,
      technicians: s.technicians || [],
      startTime: s.startTime || null,
      endTime: s.endTime || null,
    }));
    
    setLocalServices(normalizedServices);
    setHasChanges(false);
  }, [services]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localServices.findIndex(s => s.id === active.id);
    const newIndex = localServices.findIndex(s => s.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reordered = arrayMove(localServices, oldIndex, newIndex).map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));
    
    setLocalServices(reordered);
    onServicesReorder(reordered);
    setHasChanges(true);
  };

  // Handle approval request for postponed/cancelled
  const handleApprovalRequest = (serviceId, requestedAction) => {
    // Set status to Pending Approval
    handleServiceUpdate(serviceId, {
      status: 'Pending Approval',
      requestedAction,
      approvalStatus: 'pending',
    });

    // Simulate manager approval after 1.5 seconds
    setTimeout(() => {
      const approved = window.confirm(
        `Manager approval for service to be ${requestedAction}? OK = Approve, Cancel = Decline`
      );
      if (approved) {
        handleServiceUpdate(serviceId, {
          status: requestedAction,
          approvalStatus: 'approved',
        });
      } else {
        handleServiceUpdate(serviceId, {
          status: 'Pending',
          approvalStatus: 'declined',
        });
      }
    }, 1500);
  };

  // Handle service update with local state management
  const handleServiceUpdate = (serviceId, updates) => {
    const updatedServices = localServices.map(s =>
      s.id === serviceId ? { ...s, ...updates } : s
    );
    setLocalServices(updatedServices);
    onServiceUpdate(serviceId, updates);
    setHasChanges(true);
  };

  // Handle add service button
  const handleAddService = async () => {
    if (!editMode) {
      alert('Please enter Edit mode to add a service.');
      return;
    }

    const serviceName = prompt('Enter service name:', 'Wheel Protection');
    if (!serviceName) return;

    // Mock price - in real app, would come from catalog
    const price = 600;

    setIsAddingService(true);
    setApprovalMessage(`📤 Approval request sent for "${serviceName}" ($${price}) - waiting...`);

    try {
      const approved = await onAddService(serviceName, price);
      if (approved) {
        setApprovalMessage(`✅ Approved! Service "${serviceName}" added. Invoice generated.`);
        setHasChanges(true);
      } else {
        setApprovalMessage(`❌ Request declined. Service not added.`);
      }
    } catch (error) {
      setApprovalMessage(`❌ Error adding service.`);
    } finally {
      setIsAddingService(false);
      setTimeout(() => setApprovalMessage(null), 3000);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (editMode && hasChanges) {
      // Saving - confirm changes
      console.log('Changes saved');
      setHasChanges(false);
    }
    setEditMode(!editMode);
  };

  // Sort services by order
  const sortedServices = [...localServices].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="epm-detail-card">
      <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <i className="fas fa-concierge-bell"></i> Service Summary
        </span>
        <span style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn-edit-save ${editMode ? 'edit-mode' : ''}`} 
            onClick={toggleEditMode}
          >
            {editMode ? <><FaSave /> Save</> : <><FaEdit /> Edit</>}
          </button>
          <button 
            className="btn-finish-work" 
            onClick={onFinishWork}
            disabled={!allServicesCompleted}
          >
            <FaCheckDouble /> Finish Work
          </button>
          <button 
            className="btn-add-service" 
            onClick={handleAddService}
            disabled={isAddingService}
          >
            <FaPlusCircle /> Add service
          </button>
        </span>
      </h3>

      {/* DnD Context - Only enable when in edit mode */}
      {editMode && sortedServices.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedServices.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="services-list">
              {sortedServices.map(service => (
                <SortableServiceItem
                  key={service.id}
                  service={service}
                  editMode={editMode}
                  onUpdate={handleServiceUpdate}
                  onApprovalRequest={handleApprovalRequest}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="services-list">
          {sortedServices.length > 0 ? (
            sortedServices.map(service => (
              <SortableServiceItem
                key={service.id}
                service={service}
                editMode={editMode}
                onUpdate={handleServiceUpdate}
                onApprovalRequest={handleApprovalRequest}
              />
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
              No services assigned yet
            </div>
          )}
        </div>
      )}

      {/* Approval message area */}
      {approvalMessage && (
        <div id="approvalMessageArea" className="approval-simulate">
          {approvalMessage}
        </div>
      )}
    </div>
  );
};

export default ServiceSummaryCard;
