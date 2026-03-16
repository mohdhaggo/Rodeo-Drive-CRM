import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { Schema } from '../../data/resource';

interface CognitoUserRecord {
  id: string;
  username: string;
  employeeId?: string;
  name: string;
  email: string;
  mobile?: string;
  department?: string;
  role?: string;
  lineManager?: string;
  status: string;
  dashboardAccess: string;
  createdDate: string;
  cognitoStatus?: string;
  mustChangePassword?: boolean;
}

interface ListCognitoUsersResponse {
  success: boolean;
  message: string;
  users: CognitoUserRecord[];
}

const cognitoClient = new CognitoIdentityProviderClient({});

const readEnvVar = (name: string): string => {
  const runtime = globalThis as Record<string, unknown>;
  const maybeProcess = runtime['process'] as { env?: Record<string, string | undefined> } | undefined;
  return (maybeProcess?.env?.[name] || '').trim();
};

const getAttribute = (
  attributes: Array<{ Name?: string; Value?: string }> | undefined,
  name: string,
): string => {
  if (!attributes || !Array.isArray(attributes)) {
    return '';
  }

  const match = attributes.find((attribute) => attribute.Name === name);
  return (match?.Value || '').trim();
};

const toDisplayName = (
  attributes: Array<{ Name?: string; Value?: string }> | undefined,
  fallback: string,
): string => {
  const fullName = getAttribute(attributes, 'name');
  if (fullName) {
    return fullName;
  }

  const firstName = getAttribute(attributes, 'given_name');
  const lastName = getAttribute(attributes, 'family_name');
  const composedName = `${firstName} ${lastName}`.trim();

  return composedName || fallback;
};

const toDateLabel = (value: Date | undefined): string => {
  if (!value) {
    return '';
  }

  return value.toISOString().split('T')[0];
};

const mapCognitoUser = (user: {
  Username?: string;
  Enabled?: boolean;
  UserStatus?: string;
  UserCreateDate?: Date;
  Attributes?: Array<{ Name?: string; Value?: string }>;
}): CognitoUserRecord => {
  const attributes = user.Attributes;
  const username = (user.Username || '').trim();
  const email = getAttribute(attributes, 'email') || username;
  const userId = getAttribute(attributes, 'sub') || username;
  const enabled = user.Enabled !== false;
  const cognitoStatus = user.UserStatus || '';

  return {
    id: userId,
    username,
    employeeId: getAttribute(attributes, 'custom:employee_id') || username,
    name: toDisplayName(attributes, email),
    email,
    mobile: getAttribute(attributes, 'phone_number'),
    department: getAttribute(attributes, 'custom:department'),
    role: getAttribute(attributes, 'custom:role'),
    lineManager: getAttribute(attributes, 'custom:line_manager'),
    status: enabled ? 'active' : 'inactive',
    dashboardAccess: enabled ? 'allowed' : 'blocked',
    createdDate: toDateLabel(user.UserCreateDate),
    cognitoStatus,
    mustChangePassword: cognitoStatus === 'FORCE_CHANGE_PASSWORD',
  };
};

export const handler: Schema['listCognitoUsers']['functionHandler'] = async (): Promise<ListCognitoUsersResponse> => {
  const userPoolId = readEnvVar('COGNITO_USER_POOL_ID');
  if (!userPoolId) {
    throw new Error('Missing COGNITO_USER_POOL_ID environment variable.');
  }

  const users: CognitoUserRecord[] = [];
  let paginationToken: string | undefined;

  do {
    const response = await cognitoClient.send(
      new ListUsersCommand({
        UserPoolId: userPoolId,
        PaginationToken: paginationToken,
        Limit: 60,
      }),
    );

    const batch = (response.Users || []).map(mapCognitoUser);
    users.push(...batch);
    paginationToken = response.PaginationToken;
  } while (paginationToken);

  users.sort((left, right) => {
    const a = left.createdDate || '';
    const b = right.createdDate || '';
    if (a === b) {
      return left.email.localeCompare(right.email);
    }
    return b.localeCompare(a);
  });

  return {
    success: true,
    message: `Retrieved ${users.length} Cognito users.`,
    users,
  };
};
