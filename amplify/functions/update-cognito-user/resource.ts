import { defineFunction } from '@aws-amplify/backend';

export const updateCognitoUserFunction = defineFunction({
  name: 'update-cognito-user',
  entry: './handler.ts',
});