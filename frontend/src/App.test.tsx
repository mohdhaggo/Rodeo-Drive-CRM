import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

// Mock the userService module
vi.mock('./userService.ts', () => ({
  getCurrentUser: vi.fn(() => null),
  clearCurrentUser: vi.fn(),
  getTechnicians: vi.fn(() => []),
  getSupervisorsAndManagers: vi.fn(() => []),
}));

// Mock the roleAccess module
vi.mock('./roleAccess.ts', () => ({
  getRolePermissionsForUser: vi.fn(() => null),
  hasModuleAccess: vi.fn(() => true),
  hasOptionAccess: vi.fn(() => true),
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app component', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });
});