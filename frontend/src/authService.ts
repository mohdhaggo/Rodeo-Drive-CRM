/**
 * Authentication Service
 * Manages user authentication with AWS Amplify
 * Handles graceful fallback when Amplify is not available
 */

// Lazy load Amplify auth to avoid import errors
let signUp: any = null
let signIn: any = null
let signOut: any = null
let getCurrentUser: any = null
let confirmSignUp: any = null
let fetchUserAttributes: any = null
let userService: any = null

// Try to load Amplify auth modules
const loadAuthModules = async () => {
  try {
    const authModule = await import('aws-amplify/auth')
    signUp = authModule.signUp
    signIn = authModule.signIn
    signOut = authModule.signOut
    getCurrentUser = authModule.getCurrentUser
    confirmSignUp = authModule.confirmSignUp
    fetchUserAttributes = authModule.fetchUserAttributes
  } catch (err) {
    console.warn('⚠️ Amplify auth not available:', err)
  }
}

// Safe import of userService
const loadUserService = async () => {
  try {
    const amplifyService = await import('./amplifyService')
    userService = amplifyService.userService
  } catch (err) {
    console.warn('⚠️ Amplify service not available:', err)
  }
}

// Initialize modules on load
loadAuthModules()
loadUserService()

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  attributes?: Record<string, string>;
}

export interface SignUpInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

class AuthenticationService {
  private currentUser: AuthUser | null = null;

  /**
   * Initialize auth by checking if user is currently logged in
   */
  async initializeAuth(): Promise<AuthUser | null> {
    try {
      if (!getCurrentUser) {
        console.log('ℹ️ Amplify auth not available')
        return null
      }

      const user = await getCurrentUser()
      if (user) {
        let attributes: Record<string, string> = {}
        try {
          if (fetchUserAttributes) {
            attributes = await fetchUserAttributes()
          }
        } catch (err) {
          console.log('ℹ️ Could not fetch user attributes:', err)
        }

        this.currentUser = {
          userId: user.userId,
          username: user.username,
          email: attributes.email || user.username,
          firstName: attributes.given_name,
          lastName: attributes.family_name,
          attributes,
        }
        return this.currentUser
      }
      return null
    } catch (error) {
      console.log('ℹ️ No current user:', error)
      this.currentUser = null
      return null
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(input: SignUpInput): Promise<{ nextStep?: any; userId?: string }> {
    try {
      if (!signUp) {
        throw new Error('Amplify auth not available')
      }

      const result = await signUp({
        username: input.email,
        password: input.password,
        options: {
          userAttributes: {
            email: input.email,
            given_name: input.firstName,
            family_name: input.lastName,
          },
        },
      })

      if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        return {
          nextStep: result.nextStep,
          userId: result.userId,
        }
      }

      return { userId: result.userId }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  /**
   * Confirm sign up with confirmation code
   */
  async confirmSignUp(email: string, confirmationCode: string): Promise<void> {
    try {
      if (!confirmSignUp) {
        throw new Error('Amplify auth not available')
      }

      await confirmSignUp({
        username: email,
        confirmationCode,
      })
    } catch (error) {
      console.error('Confirm sign up error:', error)
      throw error
    }
  }

  /**
   * Sign in user
   */
  async signIn(input: SignInInput): Promise<AuthUser> {
    try {
      if (!signIn || !getCurrentUser || !fetchUserAttributes) {
        throw new Error('Amplify auth not available')
      }

      const result = await signIn({
        username: input.email,
        password: input.password,
      })

      if (result.nextStep?.signInStep === 'MFA') {
        throw new Error('MFA is required')
      }

      // After successful sign in, get user attributes
      const attributes = await fetchUserAttributes()
      const user = await getCurrentUser()

      this.currentUser = {
        userId: user.userId,
        username: user.username,
        email: attributes.email || user.username,
        firstName: attributes.given_name,
        lastName: attributes.family_name,
        attributes,
      }

      return this.currentUser
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      if (!signOut) {
        console.log('ℹ️ Amplify auth not available for sign out')
        this.currentUser = null
        return
      }

      await signOut({ global: true })
      this.currentUser = null
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  /**
   * Set current user (for after login)
   */
  setCurrentUser(user: AuthUser | null): void {
    this.currentUser = user
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  /**
   * Get user by email from backend
   */
  async getUserByEmail(email: string) {
    try {
      if (!userService) {
        console.log('ℹ️ User service not available')
        return null
      }

      const users = await userService.getAll()
      return users.find((u: any) => u.email === email)
    } catch (error) {
      console.error('Error getting user by email:', error)
      return null
    }
  }
}

export const authService = new AuthenticationService()
