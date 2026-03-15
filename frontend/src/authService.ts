/**
 * Authentication Service
 * Manages user authentication with AWS Amplify
 * Handles graceful fallback when Amplify is not available
 */

import { generateClient } from 'aws-amplify/api'
import type { Schema } from '../../amplify/data/resource'

const apiClient = generateClient<Schema>()

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const getMessageFromErrorsArray = (value: unknown): string | null => {
  if (!Array.isArray(value)) {
    return null
  }

  const messages = value
    .map((entry) => {
      if (!isRecord(entry)) return null
      const message = entry.message
      return typeof message === 'string' && message.trim() ? message.trim() : null
    })
    .filter((message): message is string => Boolean(message))

  return messages.length ? messages.join(' | ') : null
}

const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'string' && error.trim()) {
    return error
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (isRecord(error)) {
    const directMessage = error.message
    if (typeof directMessage === 'string' && directMessage.trim()) {
      return directMessage
    }

    const errorsMessage = getMessageFromErrorsArray(error.errors)
    if (errorsMessage) {
      return errorsMessage
    }

    const causeMessage = extractErrorMessage(error.cause)
    if (causeMessage !== 'Unknown error') {
      return causeMessage
    }

    try {
      const serialized = JSON.stringify(error)
      if (serialized && serialized !== '{}') {
        return serialized
      }
    } catch {
      // ignore JSON serialization failures
    }
  }

  return 'Unknown error'
}

const inviteUserMutation = /* GraphQL */ `
  mutation InviteUserToCognito(
    $email: AWSEmail!
    $fullName: String!
    $phoneNumber: String!
    $temporaryPassword: String!
  ) {
    inviteUserToCognito(
      email: $email
      fullName: $fullName
      phoneNumber: $phoneNumber
      temporaryPassword: $temporaryPassword
    ) {
      success
      message
      invitationSent
      invitationResent
      userAlreadyExists
    }
  }
`

// Lazy load Amplify auth to avoid import errors
let signUp: any = null
let signIn: any = null
let signOut: any = null
let getCurrentUser: any = null
let confirmSignUp: any = null
let resendSignUpCodeFn: any = null
let resetPasswordFn: any = null
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
    resendSignUpCodeFn = authModule.resendSignUpCode
    resetPasswordFn = authModule.resetPassword
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
  fullName?: string;
  phoneNumber?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface InviteUserInput {
  email: string;
  fullName: string;
  phoneNumber: string;
  temporaryPassword: string;
}

export interface InviteUserResult {
  success: boolean;
  message: string;
  invitationSent?: boolean;
  invitationResent?: boolean;
  userAlreadyExists?: boolean;
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

      const userAttributes: Record<string, string> = {
        email: input.email,
      }

      if (input.firstName) {
        userAttributes.given_name = input.firstName
      }

      if (input.lastName) {
        userAttributes.family_name = input.lastName
      }

      if (input.fullName) {
        userAttributes.name = input.fullName
      }

      if (input.phoneNumber) {
        userAttributes.phone_number = input.phoneNumber
      }

      const result = await signUp({
        username: input.email,
        password: input.password,
        options: {
          userAttributes,
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
   * Send Cognito invitation using backend AdminCreateUser mutation
   */
  async sendUserInvitation(input: InviteUserInput): Promise<InviteUserResult> {
    const variables = {
      email: input.email.trim().toLowerCase(),
      fullName: input.fullName.trim(),
      phoneNumber: input.phoneNumber.trim(),
      temporaryPassword: input.temporaryPassword,
    }

    const runMutation = async (authMode?: 'apiKey' | 'userPool') => {
      return apiClient.graphql({
        query: inviteUserMutation,
        variables,
        ...(authMode ? { authMode } : {}),
      }) as Promise<{
        data?: {
          inviteUserToCognito?: InviteUserResult
        }
        errors?: Array<{ message?: string }>
      }>
    }

    try {
      const authModes: Array<'apiKey' | 'userPool' | undefined> = ['apiKey', 'userPool', undefined]
      let result: {
        data?: {
          inviteUserToCognito?: InviteUserResult
        }
        errors?: Array<{ message?: string }>
      } | null = null
      let lastError: unknown = null

      for (const authMode of authModes) {
        try {
          result = await runMutation(authMode)
          break
        } catch (authError) {
          lastError = authError
        }
      }

      if (!result) {
        throw new Error(extractErrorMessage(lastError))
      }

      if (result.errors?.length) {
        const message =
          result.errors
            .map((entry) => entry.message)
            .filter((entry): entry is string => Boolean(entry && entry.trim()))
            .join(' | ') || 'Unknown GraphQL error'
        throw new Error(message)
      }

      const response = result.data?.inviteUserToCognito
      if (!response) {
        throw new Error('No response returned from inviteUserToCognito mutation')
      }

      return response
    } catch (error) {
      console.error('Send user invitation error:', error)
      throw new Error(extractErrorMessage(error))
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
   * Resend sign-up verification code
   */
  async resendSignUpCode(email: string): Promise<void> {
    try {
      if (!resendSignUpCodeFn) {
        throw new Error('Amplify auth not available')
      }

      await resendSignUpCodeFn({
        username: email,
      })
    } catch (error) {
      console.error('Resend sign up code error:', error)
      throw error
    }
  }

  /**
   * Request password reset code via Cognito email
   */
  async requestPasswordReset(email: string): Promise<{ nextStep?: any }> {
    try {
      if (!resetPasswordFn) {
        throw new Error('Amplify auth not available')
      }

      const result = await resetPasswordFn({
        username: email,
      })

      return {
        nextStep: result.nextStep,
      }
    } catch (error) {
      console.error('Request password reset error:', error)
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
