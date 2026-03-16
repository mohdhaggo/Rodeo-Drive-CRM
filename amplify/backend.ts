import { defineBackend } from '@aws-amplify/backend';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { inviteUserToCognitoFunction } from './functions/invite-user-to-cognito/resource';
import { listCognitoUsersFunction } from './functions/list-cognito-users/resource';
import { updateCognitoUserFunction } from './functions/update-cognito-user/resource';

const backend = defineBackend({
  auth,
  data,
  inviteUserToCognitoFunction,
  listCognitoUsersFunction,
  updateCognitoUserFunction,
});

backend.inviteUserToCognitoFunction.addEnvironment(
  'COGNITO_USER_POOL_ID',
  backend.auth.resources.userPool.userPoolId,
);

backend.inviteUserToCognitoFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['cognito-idp:AdminCreateUser', 'cognito-idp:AdminGetUser'],
    resources: [backend.auth.resources.userPool.userPoolArn],
  }),
);

backend.listCognitoUsersFunction.addEnvironment(
  'COGNITO_USER_POOL_ID',
  backend.auth.resources.userPool.userPoolId,
);

backend.listCognitoUsersFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['cognito-idp:ListUsers'],
    resources: [backend.auth.resources.userPool.userPoolArn],
  }),
);

backend.updateCognitoUserFunction.addEnvironment(
  'COGNITO_USER_POOL_ID',
  backend.auth.resources.userPool.userPoolId,
);

backend.updateCognitoUserFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['cognito-idp:AdminDeleteUserAttributes', 'cognito-idp:AdminUpdateUserAttributes'],
    resources: [backend.auth.resources.userPool.userPoolArn],
  }),
);

export default backend;
