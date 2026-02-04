# Rodeo Drive CRM Backend (Amplify Gen2)

This backend uses AWS Amplify Gen2 with Cognito Auth and a DynamoDB-backed data API.

## Prerequisites
- AWS account with CLI credentials configured
- Node.js 18+
- Amplify Gen2 CLI (`ampx`)

## Setup
1) Install dependencies:
   - `npm install`
2) Install Amplify CLI if needed:
   - `npm install -g @aws-amplify/cli`
3) Authenticate Amplify with your AWS account (one-time):
   - `ampx configure`
4) Run a local sandbox environment:
   - `ampx sandbox`

## Deploy
- `ampx deploy`

## Data Models
- Company
- Contact
- Deal

The schema is defined in amplify/data/resource.ts.
