import React, { useState } from 'react';
import {
  validateCredentials,
  setCurrentUser,
  initializeUsers,
  updateUserPassword,
  markNotificationsRead
} from './userService.ts';
import './Login.css';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingNotifications, setPendingNotifications] = useState([]);

  // Initialize users on component mount
  React.useEffect(() => {
    initializeUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate credentials against system user management
      const result = validateCredentials(email, password);
      
      if (result.success) {
        setPendingNotifications(result.notifications || []);

        if (result.requiresPasswordChange) {
          setPendingEmail(email);
          setForcePasswordChange(true);
          setNewPassword('');
          setConfirmPassword('');
          return;
        }

        markNotificationsRead(email);
        setCurrentUser(result.user);

        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const updateResult = updateUserPassword(pendingEmail, newPassword);
    if (updateResult.success) {
      markNotificationsRead(pendingEmail);
      setCurrentUser(updateResult.user);
      setForcePasswordChange(false);

      if (onLoginSuccess) {
        onLoginSuccess(updateResult.user);
      }
    } else {
      setError(updateResult.error || 'Password update failed');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Rodeo Drive CRM</h1>
        <h2>{forcePasswordChange ? 'Update Password' : 'Sign In'}</h2>

        {forcePasswordChange ? (
          <form onSubmit={handlePasswordUpdate}>
            {pendingNotifications.length > 0 && (
              <div className="info-message">
                {pendingNotifications.map((note) => (
                  <p key={note.id}>{note.message}</p>
                ))}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Create a new password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your new password"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? 'Loading...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
