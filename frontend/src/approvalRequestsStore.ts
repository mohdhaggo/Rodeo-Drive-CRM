import { useCallback, useEffect, useState } from 'react';

const APPROVAL_REQUESTS_KEY = 'approvalRequests';
const APPROVAL_REQUESTS_EVENT = 'approvalRequests:updated';

const readRequests = (): any[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(APPROVAL_REQUESTS_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeRequests = (requests: any[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(APPROVAL_REQUESTS_KEY, JSON.stringify(requests));
  window.dispatchEvent(new Event(APPROVAL_REQUESTS_EVENT));
};

export const getApprovalRequests = (): any[] => readRequests();

export const addApprovalRequest = (request: any): void => {
  const existingRequests = readRequests();
  const exists = existingRequests.some((item: any) => item.id === request.id && item.status === request.status);

  if (exists) {
    return;
  }

  writeRequests([...existingRequests, request]);
};

export const updateApprovalRequestStatus = (requestId: string, status: string, notes?: string): void => {
  const existingRequests = readRequests();
  const updatedRequests = existingRequests.map((item: any) =>
    item.id === requestId ? { ...item, status, notes } : item,
  );

  writeRequests(updatedRequests);
};

export const removeApprovalRequest = (requestId: string): void => {
  const existingRequests = readRequests();
  const updatedRequests = existingRequests.filter((item: any) => item.id !== requestId);

  writeRequests(updatedRequests);
};

export const useApprovalRequests = () => {
  const [requests, setRequests] = useState<any[]>(() => readRequests());

  const syncRequests = useCallback(() => {
    setRequests(readRequests());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === APPROVAL_REQUESTS_KEY || event.key === null) {
        syncRequests();
      }
    };

    const handleUpdated = () => {
      syncRequests();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(APPROVAL_REQUESTS_EVENT, handleUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(APPROVAL_REQUESTS_EVENT, handleUpdated as EventListener);
    };
  }, [syncRequests]);

  const addRequest = useCallback((request: any) => {
    addApprovalRequest(request);
  }, []);

  const updateRequestStatus = useCallback((requestId: string, status: string, notes?: string) => {
    updateApprovalRequestStatus(requestId, status, notes);
  }, []);

  const removeRequest = useCallback((requestId: string) => {
    removeApprovalRequest(requestId);
  }, []);

  return {
    requests,
    addRequest,
    updateRequestStatus,
    removeRequest,
  };
};
