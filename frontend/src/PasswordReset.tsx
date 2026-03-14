import { useState, useEffect } from 'react';
import { verifyResetToken, resetPasswordWithToken } from './userService';
import './PasswordReset.css';

function PasswordReset() {
  const [token, setToken] = useState<string>('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Extract token from URL
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    
    if (!urlToken) {
      setMessage('Invalid reset link. No token provided.');
      setIsError(true);
      setIsLoading(false);
      return;
    }

    setToken(urlToken);

    // Verify token
    const verification = verifyResetToken(urlToken);
    if (verification.valid) {
      setTokenValid(true);
      setEmail(verification.email || '');
    } else {
      setTokenValid(false);
      setMessage(verification.message || 'Invalid or expired reset link');
      setIsError(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    // Validation
    if (!newPassword || newPassword.length < 8) {
      setMessage('Password must be at least 8 characters long');
      setIsError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setIsError(true);
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      setIsError(true);
      return;
    }

    // Reset password
    const result = resetPasswordWithToken(token, newPassword, confirmPassword);
    
    if (result.success) {
      setResetSuccess(true);
      setMessage(result.message || 'Password reset successfully!');
      setIsError(false);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } else {
      setMessage(result.message || 'Failed to reset password');
      setIsError(true);
    }
  };

  const getPasswordStrength = () => {
    if (!newPassword) return { strength: 0, label: '' };
    
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (newPassword.length >= 12) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) strength++;

    if (strength <= 2) return { strength: 1, label: 'Weak' };
    if (strength <= 4) return { strength: 2, label: 'Medium' };
    return { strength: 3, label: 'Strong' };
  };

  const passwordStrength = getPasswordStrength();

  if (isLoading) {
    return (
      <div className="reset-password-page">
        <div className="reset-container loading">
          <div className="spinner"></div>
          <p>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-page">
        <div className="reset-container error">
          <div className="reset-header">
            <i className="fas fa-exclamation-triangle"></i>
            <h1>Invalid Reset Link</h1>
          </div>
          <p className="error-message">{message}</p>
          <div className="reset-actions">
            <button className="btn-back" onClick={() => window.location.href = '/'}>
              <i className="fas fa-arrow-left"></i> Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="reset-password-page">
        <div className="reset-container success">
          <div className="reset-header">
            <i className="fas fa-check-circle"></i>
            <h1>Password Reset Successful</h1>
          </div>
          <p className="success-message">{message}</p>
          <p className="redirect-message">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-container">
        <div className="reset-header">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPoCJV5AIkhwzaOSgnWDVpRIZITDAkRDsf5A&s" 
            alt="Rodeo Drive Logo" 
            className="reset-logo" 
          />
          <h1>Reset Your Password</h1>
          <p className="reset-subtitle">Enter your new password below</p>
        </div>

        {message && (
          <div className={`reset-message ${isError ? 'error' : 'success'}`}>
            <i className={`fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              disabled
              className="form-input disabled"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
                placeholder="Enter new password"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className={`strength-fill strength-${passwordStrength.strength}`}
                    style={{ width: `${(passwordStrength.strength / 3) * 100}%` }}
                  ></div>
                </div>
                <span className={`strength-label strength-${passwordStrength.strength}`}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
            <p className="form-hint">
              Password must be at least 8 characters and contain uppercase, lowercase, and numbers
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Confirm new password"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="form-error">
                <i className="fas fa-exclamation-circle"></i> Passwords do not match
              </p>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword}
          >
            <i className="fas fa-key"></i> Reset Password
          </button>
        </form>

        <div className="reset-footer">
          <button className="btn-back-link" onClick={() => window.location.href = '/'}>
            <i className="fas fa-arrow-left"></i> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default PasswordReset;
