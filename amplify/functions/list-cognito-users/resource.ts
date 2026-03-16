import { defineFunction } from '@aws-amplify/backend';

export const listCognitoUsersFunction = defineFunction({
  name: 'list-cognito-users',
  entry: './handler.ts',
});
