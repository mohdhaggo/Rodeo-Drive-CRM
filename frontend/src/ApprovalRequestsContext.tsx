import React, { createContext, useContext, useState, useEffect } from 'react';

const ApprovalRequestsContext = createContext();

export const useApprovalRequests = () => useContext(ApprovalRequestsContext);

export const ApprovalRequestsProvider = ({ children }) => {
  // Load from localStorage on mount
  const [requests, setRequests] = useState(() => {
    try {
      const stored = localStorage.getItem('approvalRequests');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem('approvalRequests', JSON.stringify(requests));
  }, [requests]);

  // Add a new approval request only if not already present for the same id and status
  const addRequest = (request) => {
    setRequests((prev) => {
      const exists = prev.some(r => r.id === request.id && r.status === request.status);
      if (exists) return prev;
      return [...prev, request];
    });
  };

  // Update approval request status
  const updateRequestStatus = (requestId, status, notes) => {
    setRequests((prev) => prev.map(r => r.id === requestId ? { ...r, status, notes } : r));
  };

  // Remove request (optional)
  const removeRequest = (requestId) => {
    setRequests((prev) => prev.filter(r => r.id !== requestId));
  };

  return (
    <ApprovalRequestsContext.Provider value={{ requests, addRequest, updateRequestStatus, removeRequest }}>
      {children}
    </ApprovalRequestsContext.Provider>
  );
};
