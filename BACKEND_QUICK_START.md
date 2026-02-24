# Backend Integration - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies (if not already done)
```bash
npm install aws-amplify @aws-amplify/api
```

### 2. Start Using the Backend

In any React component, import the service:
```typescript
import amplifyService from './amplifyService'
```

### 3. Common Operations

**Fetch all customers:**
```typescript
const customers = await amplifyService.customerService.getAll()
```

**Create a customer:**
```typescript
const newCustomer = await amplifyService.customerService.create({
  name: 'John Doe',
  email: 'john@example.com',
  mobile: '+971501234567'
})
```

**Update a customer:**
```typescript
await amplifyService.customerService.update(customerId, {
  name: 'Jane Doe'
})
```

**Delete a customer:**
```typescript
await amplifyService.customerService.delete(customerId)
```

## 📋 All Available Services

### User management
- `departmentService` - Manage departments
- `roleService` - Manage roles
- `userService` - Manage system users
- `permissionService` - Manage role permissions

### Customer & Vehicle
- `customerService` - Manage customers
- `vehicleService` - Manage vehicles

### Job Orders
- `jobOrderService` - Manage job orders
- `serviceRequestService` - Manage services in job orders
- `additionalServiceRequestService` - Manage additional services
- `paymentService` - Manage payments
- `exitPermitService` - Manage exit permits

### Quality Control
- `inspectionService` - Manage inspections
- `qualityCheckService` - Manage quality checks

### Sales
- `salesLeadService` - Manage sales leads

### Products & Purchases
- `productService` - Manage products
- `purchaseOrderService` - Manage purchase orders

### Service Execution
- `serviceExecutionService` - Manage service execution

## 🔄 Working with Related Data

```typescript
// Get customer with all vehicles
const customerId = 'cust-123'
const customer = await amplifyService.customerService.getById(customerId)
const vehicles = await amplifyService.vehicleService.getByCustomerId(customerId)

// Get job order with all related data
const jobOrderId = 'jo-456'
const jobOrder = await amplifyService.jobOrderService.getById(jobOrderId)
const services = await amplifyService.serviceRequestService.getByJobOrderId(jobOrderId)
const payments = await amplifyService.paymentService.getByJobOrderId(jobOrderId)
const exitPermit = await amplifyService.exitPermitService.getByJobOrderId(jobOrderId)
const qualityChecks = await amplifyService.qualityCheckService.getByJobOrderId(jobOrderId)
```

## ✅ Recommended Implementation Order

### Phase 1: User Management (Week 1)
1. Update `DepartmentRoleManagement.tsx`
2. Update `SystemUserManagement.tsx`
3. Update `RoleAccessControl.tsx`

### Phase 2: Customer Management (Week 2)
1. Update `CustomerManagement.tsx`
2. Update `VehicleManagement.tsx`

### Phase 3: Job Order Workflow (Week 3)
1. Update `JobOrderManagement.tsx`
2. Update `PaymentInvoiceManagement.tsx`
3. Update `ExitPermitManagement.tsx`
4. Update `JobOrderHistory.tsx`

### Phase 4: Quality & Inspection (Week 4)
1. Update `InspectionModule.tsx`
2. Update `QualityCheckModule.tsx`

### Phase 5: Sales & Other (Week 5)
1. Update `SalesLeadManagement.tsx`
2. Update `SalesLeadHistory.tsx`
3. Update `SalesApprovals.tsx`
4. Update other modules as needed

## 🧪 Testing Your Integration

### Test in Browser Console
```javascript
// Load service
import amplifyService from './amplifyService.js'

// Test getting data
const customers = await amplifyService.customerService.getAll()
console.log('Customers:', customers)

// Test creating data
const newCustomer = await amplifyService.customerService.create({
  name: 'Test Customer',
  email: 'test@example.com',
  status: 'active'
})
console.log('Created:', newCustomer)
```

### Check Network Tab
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Perform an action (e.g., fetch customers)
4. Look for GraphQL request to AppSync API
5. Verify request and response

### Enable Debug Logging
```typescript
// Add to App.tsx or main.tsx
import { Logger } from 'aws-amplify/core'

Logger.LOG_LEVEL = 'DEBUG'
```

## 🐛 Debugging Tips

### Check Browser Console
All operations log to console with status:
- ✅ Success messages
- ❌ Error messages
- ℹ️ Info messages

### Check AWS AppSync Logs
1. Go to AWS Console
2. Find AppSync service
3. Check CloudWatch logs for errors

### Common Issues

**Error: "Cannot find module 'aws-amplify/api'"**
- Run: `npm install aws-amplify`

**Error: "GraphQL errors: Unauthorized"**
- Ensure user is authenticated via Cognito
- Check IAM permissions

**Error: "API endpoint not found"**
- Verify `amplify_outputs.json` exists
- Check API URL in outputs

**No data returned**
- Check browser network tab for API calls
- Verify backend is deployed
- Check database has data

## 📱 Component Integration Template

Use this template when updating components:

```typescript
import { useState, useEffect } from 'react'
import amplifyService from './amplifyService'

type DataItem = any // Replace with actual type

export default function MyComponent() {
  const [data, setData] = useState<DataItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Replace with actual service call
      // const items = await amplifyService.someService.getAll()
      // setData(items)
      console.log('✅ Data loaded')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('❌ Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (input: any) => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Replace with actual service call
      // const newItem = await amplifyService.someService.create(input)
      await loadData()
      console.log('✅ Item created')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('❌ Error creating item:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: string, updates: any) => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Replace with actual service call
      // await amplifyService.someService.update(id, updates)
      await loadData()
      console.log('✅ Item updated')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('❌ Error updating item:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Replace with actual service call
      // await amplifyService.someService.delete(id)
      await loadData()
      console.log('✅ Item deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('❌ Error deleting item:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div>
      {/* TODO: Add UI here */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
```

## 🔐 Authentication

For Amplify authentication:

```typescript
import authService from './authService'

// Sign up new user
await authService.signUp({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  firstName: 'John',
  lastName: 'Doe'
})

// Sign in
const user = await authService.signIn({
  email: 'user@example.com',
  password: 'SecurePassword123!'
})

// Sign out
await authService.signOut()

// Check current user
const currentUser = authService.getCurrentUser()
```

## 📊 Monitoring

### CloudWatch Metrics
Monitor in AWS Console:
- API request count
- Error rate
- Latency
- Database usage

### Best Practices
1. Set appropriate timeouts for API calls
2. Implement retry logic for failed requests
3. Cache frequently accessed data
4. Use pagination for large datasets
5. Monitor error rates and logs

## 🚀 Deployment

### Local Development
```bash
cd frontend
npm run dev
```

### Build for Production
```bash
cd frontend
npm run build
```

### Deploy Backend
```bash
npx ampx deploy
```

## 📚 More Documentation

- [Amplify Integration Guide](./AMPLIFY_INTEGRATION_GUIDE.md)
- [Component Migration Examples](./COMPONENT_MIGRATION_EXAMPLES.md)
- [AWS Amplify Docs](https://docs.amplify.aws/)

## 💡 Need Help?

1. Check the Integration Guide for detailed examples
2. Review Component Migration Examples for your specific use case
3. Check browser console logs for error details
4. Review AWS CloudWatch logs for backend errors
5. Check the GraphQL API schema in AWS AppSync console

---

**Happy coding! 🎉**
