# Local Development Setup

This project supports both **Local Development Mode** and **AWS Amplify Mode**.

## Switching Between Modes

### Local Development Mode (Default)

The project is now configured to run in local development mode using localStorage for data persistence.

**Configuration:**
- Edit `frontend/.env` and ensure:
  ```env
  VITE_USE_LOCAL_API=true
  VITE_LOCAL_API_URL=http://localhost:3001/api
  VITE_USE_MOCK_DATA=true
  ```

**Benefits:**
- No AWS credentials required
- Works offline
- Fast development iteration
- Data stored in browser localStorage
- Any credentials work for login

**To Run:**
```powershell
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`

### AWS Amplify Mode

To use AWS Amplify backend with real authentication and AppSync:

**Configuration:**
- Edit `frontend/.env` and set:
  ```env
  VITE_USE_LOCAL_API=false
  VITE_AWS_REGION=ap-southeast-1
  ```

**Requirements:**
- Valid AWS credentials
- Amplify backend deployed
- Cognito user pool configured
- AppSync API available

## Current Mode Indicator

When in local development mode, you'll see a yellow banner on the login page:
```
🔧 Local Development Mode - Any credentials will work
```

## Data Persistence

### Local Mode
- Data is stored in browser `localStorage`
- Cleared when browser data is cleared
- Includes: departments, roles, and users

### AWS Mode
- Data is stored in AWS DynamoDB via AppSync
- Persistent across sessions and devices
- Requires authentication

## API Service

The application automatically switches between:
- **localApiService.js** - Mock API using localStorage
- **AWS Amplify GraphQL** - Real backend API

All API calls in the application use the same interface, making switching transparent to the components.

## Vite Configuration

The [vite.config.js](frontend/vite.config.js) includes:
- Dev server on port 3000
- Proxy configuration for local API (port 3001)
- Environment variable support

## Troubleshooting

### "Amplify configuration error"
Make sure `VITE_USE_LOCAL_API=true` in your `.env` file

### "Data not persisting"
Check browser localStorage - clear it and refresh to reset demo data

### "Login not working"
In local mode, any email/password combination will work. Just fill in both fields.
