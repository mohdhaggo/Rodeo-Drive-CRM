import { defineBackend } from '@aws-amplify/backend';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { inviteUserToCognitoFunction } from './functions/invite-user-to-cognito/resource';

const backend = defineBackend({
  auth,
  data,
  inviteUserToCognitoFunction,
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

export default backend;
