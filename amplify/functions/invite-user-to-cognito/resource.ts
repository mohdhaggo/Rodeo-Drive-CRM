import { defineFunction } from '@aws-amplify/backend';

export const inviteUserToCognitoFunction = defineFunction({
  name: 'invite-user-to-cognito',
  entry: './handler.ts',
});