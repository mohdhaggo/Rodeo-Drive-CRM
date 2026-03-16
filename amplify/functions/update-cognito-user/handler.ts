import {
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import type { Schema } from '../../data/resource';

interface UpdateCognitoUserResponse {
  success: boolean;
  message: string;
}

const cognitoClient = new CognitoIdentityProviderClient({});

const readEnvVar = (name: string): string => {
  const runtime = globalThis as Record<string, unknown>;
  const maybeProcess = runtime['process'] as { env?: Record<string, string | undefined> } | undefined;
  return (maybeProcess?.env?.[name] || '').trim();
};

const normalizePhoneNumber = (value: string): string | null => {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      return null;
    }
    return `+${digits}`;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.startsWith('00') && digitsOnly.length > 2) {
    const international = digitsOnly.slice(2);
    if (international.length < 8 || international.length > 15) {
      return null;
    }
    return `+${international}`;
  }

  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return null;
  }

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

const isMissingCustomAttributeError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('attribute does not exist in the schema');
};

export const handler: Schema['updateCognitoUser']['functionHandler'] = async (event): Promise<UpdateCognitoUserResponse> => {
  const userPoolId = readEnvVar('COGNITO_USER_POOL_ID');
  if (!userPoolId) {
    return {
      success: false,
      message: 'Missing COGNITO_USER_POOL_ID environment variable.',
    };
  }

  const username = event.arguments.username.trim();
  const fullName = event.arguments.fullName.trim();
  const email = event.arguments.email.trim().toLowerCase();
  const department = event.arguments.department.trim();
  const role = event.arguments.role.trim();
  const lineManager = (event.arguments.lineManager || '').trim();
  const normalizedPhone = normalizePhoneNumber(event.arguments.phoneNumber);

  if (!username) {
    return {
      success: false,
      message: 'Cognito username is required.',
    };
  }

  if (!fullName || !email || !normalizedPhone) {
    return {
      success: false,
      message: 'Name, email, and mobile are required. Mobile must be in international format.',
    };
  }

  try {
    const baseAttributes = [
      { Name: 'name', Value: fullName },
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'phone_number', Value: normalizedPhone },
    ];

    await cognitoClient.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: username,
        UserAttributes: baseAttributes,
      }),
    );

    const customAttributes: Array<{ Name: string; Value: string }> = [];
    if (department) {
      customAttributes.push({ Name: 'custom:department', Value: department });
    }
    if (role) {
      customAttributes.push({ Name: 'custom:role', Value: role });
    }
    if (lineManager) {
      customAttributes.push({ Name: 'custom:line_manager', Value: lineManager });
    }

    if (customAttributes.length === 0) {
      return {
        success: true,
        message: `Updated Cognito profile for ${email}.`,
      };
    }

    try {
      await cognitoClient.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: username,
          UserAttributes: customAttributes,
        }),
      );

      return {
        success: true,
        message: `Updated Cognito profile for ${email}.`,
      };
    } catch (customAttributeError) {
      if (isMissingCustomAttributeError(customAttributeError)) {
        return {
          success: true,
          message: `Updated Cognito sign-in attributes for ${email}. Department, role, and line manager were saved in system storage.`,
        };
      }

      throw customAttributeError;
    }
  } catch (error) {
    const errorName = getErrorName(error);
    if (errorName === 'AliasExistsException') {
      return {
        success: false,
        message: `Another Cognito user already uses ${email}.`,
      };
    }

    if (errorName === 'UserNotFoundException') {
      return {
        success: false,
        message: `Cognito user ${username} was not found. Refresh the list and try again.`,
      };
    }

    return {
      success: false,
      message: `Cognito update failed: ${getErrorMessage(error)}`,
    };
  }
};