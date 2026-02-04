import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Company: a.model({
    name: a.string().required(),
    industry: a.string(),
    status: a.string(),
    createdAt: a.datetime(),
  }).authorization((allow) => [allow.authenticated()]),

  Contact: a.model({
    firstName: a.string().required(),
    lastName: a.string().required(),
    email: a.email().required(),
    phone: a.string(),
    companyId: a.id(),
    createdAt: a.datetime(),
  }).authorization((allow) => [allow.authenticated()]),

  Deal: a.model({
    dealName: a.string().required(),
    amount: a.float(),
    stage: a.string(),
    companyId: a.id(),
    ownerId: a.id(),
    createdAt: a.datetime(),
  }).authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
