import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import type { Schema } from '../../data/resource';

interface InviteUserResponse {
  success: boolean;
  message: string;
  invitationSent: boolean;
  invitationResent: boolean;
  userAlreadyExists: boolean;
}

const cognitoClient = new CognitoIdentityProviderClient({});

const normalizePhoneNumber = (value: string): string | null => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.startsWith('00') && digitsOnly.length > 2) {
    const international = digitsOnly.slice(2);
    if (international.length < 8 || international.length > 15) return null;
    return `+${international}`;
  }

  if (digitsOnly.length < 8 || digitsOnly.length > 15) return null;
  return `+${digitsOnly}`;
};

const getErrorName = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const nameValue = (error as { name?: unknown }).name;
    if (typeof nameValue === 'string') {
      return nameValue;
    }
  }
  return '';
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const messageValue = (error as { message?: unknown }).message;
    if (typeof messageValue === 'string') {
      return messageValue;
    }
  }
  return 'Unknown error';
};

const buildResponse = (
  overrides: Partial<InviteUserResponse> & Pick<InviteUserResponse, 'success' | 'message'>,
): InviteUserResponse => {
  return {
    success: overrides.success,
    message: overrides.message,
    invitationSent: overrides.invitationSent ?? false,
    invitationResent: overrides.invitationResent ?? false,
    userAlreadyExists: overrides.userAlreadyExists ?? false,
  };
};

export const handler: Schema['inviteUserToCognito']['functionHandler'] = async (event) => {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  if (!userPoolId) {
    throw new Error('Missing COGNITO_USER_POOL_ID environment variable.');
  }

  const email = event.arguments.email.trim().toLowerCase();
  const fullName = event.arguments.fullName.trim();
  const normalizedPhone = normalizePhoneNumber(event.arguments.phoneNumber);
  const temporaryPassword = event.arguments.temporaryPassword;

  if (!fullName) {
    return buildResponse({
      success: false,
      message: 'Full name is required for Cognito invitation.',
    });
  }

  if (!normalizedPhone) {
    return buildResponse({
      success: false,
      message: 'Phone number must be in international format (e.g. +971501234567).',
    });
  }

  try {
    await cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        TemporaryPassword: temporaryPassword,
        DesiredDeliveryMediums: ['EMAIL'],
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: fullName },
          { Name: 'phone_number', Value: normalizedPhone },
          { Name: 'email_verified', Value: 'true' },
        ],
      }),
    );

    return buildResponse({
      success: true,
      message: `Cognito invitation email sent to ${email}.`,
      invitationSent: true,
    });
  } catch (error) {
    const errorName = getErrorName(error);
    if (errorName === 'UsernameExistsException' || errorName === 'AliasExistsException') {
      const existingUser = await cognitoClient.send(
        new AdminGetUserCommand({
          UserPoolId: userPoolId,
          Username: email,
        }),
      );

      const status = existingUser.UserStatus ?? 'UNKNOWN';
      if (status === 'FORCE_CHANGE_PASSWORD' || status === 'UNCONFIRMED' || status === 'RESET_REQUIRED') {
        await cognitoClient.send(
          new AdminCreateUserCommand({
            UserPoolId: userPoolId,
            Username: email,
            TemporaryPassword: temporaryPassword,
            DesiredDeliveryMediums: ['EMAIL'],
            MessageAction: 'RESEND',
          }),
        );

        return buildResponse({
          success: true,
          message: `Existing Cognito invitation email resent to ${email}.`,
          invitationResent: true,
        });
      }

      return buildResponse({
        success: false,
        message: `A Cognito account already exists for ${email} with status ${status}.`,
        userAlreadyExists: true,
      });
    }

    throw new Error(`Cognito invitation failed: ${getErrorMessage(error)}`);
  }
};