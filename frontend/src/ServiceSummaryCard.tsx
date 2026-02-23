import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaGripVertical, FaUserTie, FaUsers, FaEdit, FaSave, FaCheckDouble, FaPlusCircle, FaClock, FaCheckCircle, FaTimesCircle, FaWrench } from 'react-icons/fa';
import { useApprovalRequests } from './ApprovalRequestsContext.tsx';
import PermissionGate from './PermissionGate';

// =====================================================================
// Sortable Service Item Component
// =====================================================================
const SortableServiceItem = ({ service, editMode, onUpdate, onApprovalRequest, availableTechs, availableAssignees, tabPrefix = 'serviceexec_assigned' }) => {
  const { addRequest } = useApprovalRequests();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: service.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [techDropdownOpen, setTechDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    if ((newStatus === 'Postponed' || newStatus === 'Cancelled') && service.status !== 'Pending Approval' && service.status !== newStatus) {
      // Add approval request to context
      addRequest({
        id: service.id,
        customer: service.customer,
        vehicle: service.vehicle,
        priority: service.priority || 'normal',
        requestedBy: service.assignedTo || 'Unknown',
        requestDate: new Date().toLocaleString(),
        status: 'pending',
        ...service
      });
      onUpdate(service.id, { status: 'Pending Approval', requestedAction: newStatus, approvalModule: true });
    } else {
      const updates = { status: newStatus };
      if (newStatus === 'Inprogress' && service.status !== 'Inprogress' && !service.startTime) {
        updates.startTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      }
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



  return (
    <div ref={setNodeRef} style={style} className="service-item">
      <div className="service-header">
        <div className="service-name">
          <PermissionGate moduleId="serviceexec" optionId={`${tabPrefix}_dragdrop`}>
            <span {...attributes} {...listeners} className="drag-handle">
              <FaGripVertical />
            </span>
          </PermissionGate>
          {service.name}
        </div>
        <span className={`status-badge ${getStatusClass(service.status)} service-status-badge`}>
          {service.status === 'Pending Approval' ? (service.requestedAction || 'Pending') : service.status}
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
          <span className="meta-value status-display">{service.status === 'Pending Approval' ? (service.requestedAction || 'Pending') : service.status}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Assigned to</span>
          <span className="meta-value assigned-display">{service.assignedTo || '—'}</span>
        </div>
      </div>

      {/* Edit controls – visible only in edit mode */}
      {editMode && (
        <div className="assign-controls edit-controls">
          <PermissionGate moduleId="serviceexec" optionId={`${tabPrefix}_assignedto`}>
            <div className="control-group">
              <span className="control-label"><FaUserTie /> Assigned to</span>
              <select 
                className="assigned-select" 
                value={service.assignedTo || ''} 
                onChange={handleAssignedToChange}
              >
                <option value="">— assign —</option>
                {availableAssignees.map((assignee, idx) => (
                  <option key={idx} value={assignee}>{assignee}</option>
                ))}
              </select>
            </div>
          </PermissionGate>

          <PermissionGate moduleId="serviceexec" optionId={`${tabPrefix}_assigntech`}>
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
                    {availableTechs.map((tech, idx) => (
                      <div key={idx} className="tech-option">
                        <input
                          type="checkbox"
                          id={`tech-${service.id}-${idx}`}
                          value={tech}
                          checked={service.technicians?.includes(tech) || false}
                          onChange={(e) => handleTechChange(tech, e.target.checked)}
                        />
                        <label htmlFor={`tech-${service.id}-${idx}`}>{tech}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PermissionGate>

          <PermissionGate moduleId="serviceexec" optionId={`${tabPrefix}_workstatus`}>
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
          </PermissionGate>
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


    </div>
  );
};

// =====================================================================
// Main Service Summary Card Component
// =====================================================================
export const ServiceSummaryCard = ({
  jobId,
  services,
  referenceServices = [],
  onServicesReorder,
  onServiceUpdate,
  onAddService,
  onFinishWork,
  allServicesCompleted,
  editMode,
  setEditMode,
  availableTechs = [],
  availableAssignees = [],
  tabPrefix = 'serviceexec_assigned',
}) => {
  const [localServices, setLocalServices] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Normalize and sync services when props change
  useEffect(() => {
    const mergedServices = referenceServices.length > 0
      ? [...referenceServices, ...(services || [])]
      : (services || []);
    const normalizedServices = mergedServices.map((s, idx) => {
      const baseService = typeof s === 'string' ? { name: s } : (s || {});
      return {
        ...baseService,
        id: baseService.id || `service-${idx}-${Date.now()}`,
        name: baseService.name || `Service ${idx + 1}`,
        order: baseService.order || (idx + 1),
        status: baseService.status || 'Pending',
        assignedTo: baseService.assignedTo || null,
        technicians: baseService.technicians || [],
        startTime: baseService.startTime || null,
        endTime: baseService.endTime || null,
      };
    });
    
    setLocalServices(normalizedServices);
    setHasChanges(false);
  }, [services, referenceServices]);

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
    // Set status to Pending Approval and wait for approval module (no alert/confirm)
    handleServiceUpdate(serviceId, {
      status: 'Pending Approval',
      requestedAction,
      approvalStatus: 'pending',
    });
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
  const handleAddService = () => {
    if (onAddService) {
      onAddService();
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
          <PermissionGate moduleId="serviceexec" optionId={`${tabPrefix}_edit`}>
            <button 
              className={`btn-edit-save ${editMode ? 'edit-mode' : ''}`} 
              onClick={toggleEditMode}
            >
              {editMode ? <><FaSave /> Save</> : <><FaEdit /> Edit</>}
            </button>
          </PermissionGate>
          <PermissionGate moduleId="serviceexec" optionId={`${tabPrefix}_finish`}>
            <button 
              className="btn-finish-work" 
              onClick={onFinishWork}
              disabled={!allServicesCompleted}
            >
              <FaCheckDouble /> Finish Work
            </button>
          </PermissionGate>
          <PermissionGate moduleId="serviceexec" optionId={`${tabPrefix}_addservice`}>
            <button 
              className="btn-add-service" 
              onClick={handleAddService}
            >
              <FaPlusCircle /> Add service
            </button>
          </PermissionGate>
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
                  availableTechs={availableTechs}
                  availableAssignees={availableAssignees}
                  tabPrefix={tabPrefix}
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
                availableTechs={availableTechs}
                availableAssignees={availableAssignees}
                tabPrefix={tabPrefix}
              />
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
              No services assigned yet
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ServiceSummaryCard;
