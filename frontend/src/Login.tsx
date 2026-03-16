import { useState, type FormEvent } from 'react';
import {
  setCurrentUser,
  type User
} from './userService.ts';
import { authService, type AuthUser } from './authService';
import amplifyOutputs from '../../amplify_outputs.json';
import './Login.css';

interface LoginProps {
  onLoginSuccess?: (user: User) => void;
}

const NEW_PASSWORD_REQUIRED_STEP = 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED';

const hasErrorMessage = (value: unknown): value is { message: string } => {
  return typeof value === 'object' && value !== null && 'message' in value;
};

const hasErrorName = (value: unknown): value is { name: string } => {
  return typeof value === 'object' && value !== null && 'name' in value;
};

const getSignInStep = (nextStep: any): string | null => {
  if (!nextStep || typeof nextStep !== 'object') {
    return null;
  }

  if ('signInStep' in nextStep && typeof nextStep.signInStep === 'string') {
    return nextStep.signInStep;
  }

  return null;
};

const isNewPasswordChallengeStep = (step: string | null): boolean => {
  if (!step) {
    return false;
  }

  const normalizedStep = step.trim().toUpperCase();
  return (
    normalizedStep === NEW_PASSWORD_REQUIRED_STEP ||
    normalizedStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD' ||
    normalizedStep === 'NEW_PASSWORD_REQUIRED' ||
    normalizedStep.includes('NEW_PASSWORD')
  );
};

const getAttributeValue = (
  attributes: Record<string, string> | undefined,
  key: string,
  fallback = ''
): string => {
  if (!attributes || !(key in attributes)) {
    return fallback;
  }

  const value = attributes[key];
  return typeof value === 'string' ? value : fallback;
};

const getRoleFromAttributes = (attributes: Record<string, string> | undefined): string => {
  const roleValue =
    getAttributeValue(attributes, 'custom:role') ||
    getAttributeValue(attributes, 'custom:user_role') ||
    getAttributeValue(attributes, 'custom:job_role');

  return roleValue || 'View Only';
};

const buildSessionUserFromAuth = (authUser: AuthUser, fallbackEmail: string): User => {
  const attributes = authUser.attributes;
  const explicitName = getAttributeValue(attributes, 'name').trim();
  const firstName = getAttributeValue(attributes, 'given_name', authUser.firstName || '').trim();
  const lastName = getAttributeValue(attributes, 'family_name', authUser.lastName || '').trim();
  const composedName = `${firstName} ${lastName}`.trim();
  const resolvedEmail = (authUser.email || fallbackEmail).trim().toLowerCase();

  return {
    id: authUser.userId || resolvedEmail,
    employeeId: getAttributeValue(attributes, 'custom:employee_id'),
    name: explicitName || composedName || resolvedEmail,
    email: resolvedEmail,
    password: '',
    mobile: getAttributeValue(attributes, 'phone_number'),
    department: getAttributeValue(attributes, 'custom:department'),
    role: getRoleFromAttributes(attributes),
    lineManager: getAttributeValue(attributes, 'custom:line_manager', 'not available'),
    status: 'active',
    dashboardAccess: 'allowed',
    createdDate: new Date().toISOString().split('T')[0],
  };
};

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const identifier = email.trim();
    const normalizedPassword = password.trim();
    const passwordsToTry = Array.from(new Set([password, normalizedPassword].filter((entry) => entry.length > 0)));
    let identifiersToTry: string[] = [];

    try {
      if (!identifier) {
        setError('Please enter your email.');
        return;
      }

      identifiersToTry = Array.from(new Set([identifier, identifier.toLowerCase()]));
      let signInResult: Awaited<ReturnType<typeof authService.signIn>> | null = null;
      let lastError: unknown = null;

      outerLoop:
      for (const identifierCandidate of identifiersToTry) {
        for (const passwordCandidate of passwordsToTry) {
          try {
            signInResult = await authService.signIn({
              email: identifierCandidate,
              password: passwordCandidate,
            });
            break outerLoop;
          } catch (signInError) {
            lastError = signInError;
            const errorName = hasErrorName(signInError) ? signInError.name : '';
            if (errorName !== 'NotAuthorizedException') {
              throw signInError;
            }
          }
        }
      }

      if (!signInResult) {
        throw lastError || new Error('Authentication failed');
      }

      if (!signInResult.isSignedIn) {
        const signInStep = getSignInStep(signInResult.nextStep);
        if (isNewPasswordChallengeStep(signInStep)) {
          setPendingEmail(identifier.toLowerCase());
          setForcePasswordChange(true);
          setNewPassword('');
          setConfirmPassword('');
          return;
        }

        setError(
          signInStep
            ? `Additional sign-in step required: ${signInStep}`
            : 'Authentication failed'
        );
        return;
      }

      if (!signInResult.user) {
        setError('Authentication succeeded, but user details could not be loaded. Please try again.');
        return;
      }

      const userForSession = buildSessionUserFromAuth(signInResult.user, identifier.toLowerCase());
      setCurrentUser(userForSession);

      if (onLoginSuccess) {
        onLoginSuccess(userForSession);
      }
    } catch (err) {
      const errorName = hasErrorName(err) ? err.name : '';
      if (errorName === 'NotAuthorizedException') {
        console.warn('Cognito sign-in rejected credentials', {
          configuredUserPoolId: amplifyOutputs.auth?.user_pool_id || 'unknown',
          identifier,
          identifiersToTry,
          attemptedTrimmedPasswordRetry: passwordsToTry.length > 1,
        });
        setError('Incorrect email or password. If you are using a temporary password, copy it exactly from the invitation email and make sure there are no extra spaces.');
        return;
      }

      const message = hasErrorMessage(err) ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: FormEvent<HTMLFormElement>) => {
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

    if (!pendingEmail) {
      setError('Unable to complete password update. Please sign in again.');
      setLoading(false);
      return;
    }

    try {
      const challengeResult = await authService.completeSignInChallenge(newPassword);

      if (!challengeResult.isSignedIn) {
        const signInStep = getSignInStep(challengeResult.nextStep);
        setError(
          signInStep
            ? `Additional sign-in step required: ${signInStep}`
            : 'Unable to complete password update'
        );
        return;
      }

      if (!challengeResult.user) {
        setError('Password updated, but user details could not be loaded. Please sign in again.');
        return;
      }

      const userForSession = buildSessionUserFromAuth(challengeResult.user, pendingEmail);

      setCurrentUser(userForSession);
      setForcePasswordChange(false);

      if (onLoginSuccess) {
        onLoginSuccess(userForSession);
      }
    } catch (err) {
      const message = hasErrorMessage(err) ? err.message : 'Password update failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Rodeo Drive CRM</h1>
        <h2>{forcePasswordChange ? 'Update Password' : 'Sign In'}</h2>

        {forcePasswordChange ? (
          <form onSubmit={handlePasswordUpdate}>
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
