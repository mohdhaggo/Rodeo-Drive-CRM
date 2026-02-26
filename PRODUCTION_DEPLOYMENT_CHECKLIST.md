# Production Deployment Checklist

## Cleanup Completed ✓

### Demo Data Removed
- ✓ `demoData.ts` replaced with production stubs (returns empty arrays)
- ✓ All demo job orders, customers, and vehicles disabled
- ✓ Demo data functions now return empty arrays for fallback

### Test Scripts Deleted
- ✓ `start-deepseek.bat` - Test AI script removed
- ✓ `chat-with-deepseek.bat` - Test chat script removed
- ✓ `install-codellama.bat` - Test model installer removed
- ✓ `create-user.cjs` - Demo user creation script removed
- ✓ `setup-admin-user.cjs` - Demo admin setup script removed
- ✓ `setup-admin.sh` - Demo admin setup shell script removed

### Test Credentials Removed
- ✓ `LOGIN_CREDENTIALS.md` - Test user credentials file deleted
- ✓ Test credentials removed from `USER_AUTHENTICATION_SYSTEM.md`
- ✓ Updated security documentation to reflect production practices

### Temporary Files Cleaned
- ✓ All `tmpclaude-*` temporary directories removed
- ✓ `ADMIN_SETUP_COMPLETE.md` - Obsolete admin setup docs removed
- ✓ `ADMIN_USER_SETUP_GUIDE.md` - Obsolete setup guide removed
- ✓ Backup files removed

### Configuration Updated
- ✓ `.env.example` updated with production defaults:
  - `VITE_USE_LOCAL_API=false` (uses Amplify API)
  - `VITE_USE_MOCK_DATA=false` (no demo data)

## Production Deployment Steps

### 1. Environment Setup
```bash
# Create production .env file from example
cp frontend/.env.example frontend/.env

# Update with your production values:
# - VITE_AWS_REGION (your AWS region)
# - VITE_OLLAMA_URL (optional, for AI features)
```

### 2. Authentication Setup (AWS Amplify)
- Ensure AWS Amplify backend is deployed
- Create your first admin user through AWS Cognito console or CLI
- Set up secure password policies

### 3. Database Setup
- Ensure Amplify Data resources are provisioned
- Verify database connectivity
- Run any required migrations (see `amplify/` directory)

### 4. Build & Deploy
```bash
cd frontend
npm install
npm run build

# Deploy to your hosting (Amplify Hosting, S3+CloudFront, etc.)
```

### 5. Post-Deployment Verification
- [ ] User authentication works with real Cognito users
- [ ] All data loads from Amplify API (no demo data shown)
- [ ] No test credentials in browser console
- [ ] SSL/HTTPS enabled
- [ ] API endpoints are using production Amplify backend
- [ ] Error handling works correctly
- [ ] Logging is minimal (no verbose debug logs)

## Data Sources for Production

All data now comes from AWS Amplify:

| Feature | Source |
|---------|--------|
| User Authentication | AWS Cognito |
| User Profiles | Amplify Data API |
| Customers | Amplify Data API |
| Vehicles | Amplify Data API |
| Job Orders | Amplify Data API |
| Services | Amplify Data API |
| Exit Permits | Amplify Data API |

## Important Production Notes

- **No demo data**: All components fallback to empty arrays when Amplify data isn't available
- **Real authentication**: Only valid Cognito users can access the system
- **Secure sessions**: User sessions handled by AWS Cognito tokens
- **API-first**: All data operations go through Amplify API

## Rollback
If you need to re-enable demo data for testing:
1. Update `demoData.ts` to generate test data
2. Update `.env` to set `VITE_USE_MOCK_DATA=true`
3. Rebuild and redeploy

---
**Last Updated**: February 26, 2026  
**Status**: Ready for Production Deployment
