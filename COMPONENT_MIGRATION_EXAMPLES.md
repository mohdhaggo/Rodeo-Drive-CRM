# Component Migration Examples

This file provides step-by-step examples of how to migrate component logic to use the Amplify backend.

## Example 1: Customer Management Component

### Before (Using localStorage/mock data)

```typescript
import { useState, useEffect } from 'react'
import * as demoData from './demoData'

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load from mock data
    const data = demoData.generateSharedDemoData()
    setCustomers(data.customers)
  }, [])

  const handleAddCustomer = async (newCustomer) => {
    // Just add to local state
    const customer = {
      id: `CUST-${Date.now()}`,
      ...newCustomer
    }
    setCustomers([...customers, customer])
  }

  return (
    // JSX...
  )
}
```

### After (Using Amplify Backend)

```typescript
import { useState, useEffect } from 'react'
import amplifyService from './amplifyService'

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await amplifyService.customerService.getAll()
      setCustomers(data)
      console.log('✅ Customers loaded:', data.length)
    } catch (err) {
      console.error('❌ Error loading customers:', err)
      setError('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomer = async (newCustomer) => {
    try {
      setLoading(true)
      const createdCustomer = await amplifyService.customerService.create({
        name: newCustomer.name,
        email: newCustomer.email,
        mobile: newCustomer.mobile,
        address: newCustomer.address,
        status: 'active'
      })
      console.log('✅ Customer created:', createdCustomer)
      
      // Refresh the list
      await loadCustomers()
    } catch (err) {
      console.error('❌ Error creating customer:', err)
      setError('Failed to create customer')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async (customerId) => {
    try {
      setLoading(true)
      await amplifyService.customerService.delete(customerId)
      console.log('✅ Customer deleted')
      
      // Refresh the list
      await loadCustomers()
    } catch (err) {
      console.error('❌ Error deleting customer:', err)
      setError('Failed to delete customer')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCustomer = async (customerId, updates) => {
    try {
      setLoading(true)
      await amplifyService.customerService.update(customerId, updates)
      console.log('✅ Customer updated')
      
      // Refresh the list
      await loadCustomers()
    } catch (err) {
      console.error('❌ Error updating customer:', err)
      setError('Failed to update customer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <div className="error-message">{error}</div>}
      {loading && <div>Loading...</div>}
      {/* JSX with updated handlers */}
    </div>
  )
}
```

## Example 2: Job Order Management with Related Data

### Before (Using mock data)

```typescript
import { generateDemoJobOrders } from './demoData'

export default function JobOrderManagement() {
  const [jobOrders, setJobOrders] = useState([])

  useEffect(() => {
    const orders = generateDemoJobOrders()
    setJobOrders(orders)
  }, [])

  const handleGetJobOrderDetails = (orderId) => {
    // Find from local array
    return jobOrders.find(o => o.id === orderId)
  }

  return (
    // JSX...
  )
}
```

### After (Using Amplify Backend)

```typescript
import { useState, useEffect } from 'react'
import amplifyService from './amplifyService'

export default function JobOrderManagement() {
  const [jobOrders, setJobOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadJobOrders()
  }, [])

  const loadJobOrders = async () => {
    try {
      setLoading(true)
      const orders = await amplifyService.jobOrderService.getAll()
      setJobOrders(orders)
      console.log('✅ Job orders loaded:', orders.length)
    } catch (error) {
      console.error('❌ Error loading job orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGetJobOrderDetails = async (orderId) => {
    try {
      const order = await amplifyService.jobOrderService.getById(orderId)
      
      // Load related data
      const services = await amplifyService.serviceRequestService.getByJobOrderId(orderId)
      const payments = await amplifyService.paymentService.getByJobOrderId(orderId)
      const exitPermit = await amplifyService.exitPermitService.getByJobOrderId(orderId)
      const qualityChecks = await amplifyService.qualityCheckService.getByJobOrderId(orderId)
      
      return {
        ...order,
        services,
        payments,
        exitPermit,
        qualityChecks
      }
    } catch (error) {
      console.error('❌ Error fetching job order details:', error)
      return null
    }
  }

  const handleCreateJobOrder = async (orderData) => {
    try {
      setLoading(true)
      
      const newOrder = await amplifyService.jobOrderService.create({
        orderNumber: `JO-${Date.now()}`,
        customerId: orderData.customerId,
        vehicleId: orderData.vehicleId,
        workStatus: 'New Request',
        paymentStatus: 'Unpaid',
        totalAmount: orderData.totalAmount || 0,
        paidAmount: 0
      })
      
      console.log('✅ Job order created:', newOrder)
      await loadJobOrders()
    } catch (error) {
      console.error('❌ Error creating job order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateJobOrderStatus = async (orderId, status) => {
    try {
      setLoading(true)
      
      const updates: any = { workStatus: status }
      
      if (status === 'Completed') {
        updates.completionDate = new Date().toISOString()
      }
      
      await amplifyService.jobOrderService.update(orderId, updates)
      console.log('✅ Job order status updated')
      
      await loadJobOrders()
    } catch (error) {
      console.error('❌ Error updating job order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddService = async (jobOrderId, serviceData) => {
    try {
      await amplifyService.serviceRequestService.create({
        jobOrderId,
        serviceName: serviceData.name,
        status: 'Pending',
        assignedTechnician: serviceData.technician,
        notes: serviceData.notes
      })
      
      console.log('✅ Service added to job order')
      
      // Refresh job orders to show new service
      await loadJobOrders()
    } catch (error) {
      console.error('❌ Error adding service:', error)
    }
  }

  const handleRecordPayment = async (jobOrderId, paymentData) => {
    try {
      const payment = await amplifyService.paymentService.create({
        jobOrderId,
        amount: paymentData.amount,
        paymentMethod: paymentData.method,
        paymentStatus: 'Completed',
        referenceNumber: paymentData.reference,
        notes: paymentData.notes
      })
      
      console.log('✅ Payment recorded:', payment)
      
      // Update job order with new payment status
      const jobOrder = await amplifyService.jobOrderService.getById(jobOrderId)
      const payments = await amplifyService.paymentService.getByJobOrderId(jobOrderId)
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      
      const paymentStatus = totalPaid >= jobOrder.totalAmount ? 'Fully Paid' : 'Partially Paid'
      
      await amplifyService.jobOrderService.update(jobOrderId, {
        paidAmount: totalPaid,
        paymentStatus
      })
      
      await loadJobOrders()
    } catch (error) {
      console.error('❌ Error recording payment:', error)
    }
  }

  const handleCreateExitPermit = async (jobOrderId) => {
    try {
      const permit = await amplifyService.exitPermitService.create({
        jobOrderId,
        permitNumber: `EP-${Date.now()}`,
        status: 'Created',
        createdDate: new Date().toISOString()
      })
      
      console.log('✅ Exit permit created:', permit)
      await loadJobOrders()
    } catch (error) {
      console.error('❌ Error creating exit permit:', error)
    }
  }

  return (
    // JSX with updated handlers...
  )
}
```

## Example 3: User/Department Management

### Before (Using localStorage)

```typescript
import { getDepartments, addDepartment, editDepartment } from './apiService'

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    try {
      const data = await getDepartments()
      setDepartments(data)
    } catch (error) {
      console.error('Error loading departments:', error)
    }
  }

  const handleAddDepartment = async (dept) => {
    try {
      const newDept = await addDepartment(dept)
      await loadDepartments()
    } catch (error) {
      console.error('Error adding department:', error)
    }
  }

  return (
    // JSX...
  )
}
```

### After (Using Amplify Backend)

```typescript
import { useState, useEffect } from 'react'
import amplifyService from './amplifyService'

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load departments and their roles
      const depts = await amplifyService.departmentService.getAll()
      const allRoles = await amplifyService.roleService.getAll()
      
      setDepartments(depts)
      setRoles(allRoles)
      console.log('✅ Department data loaded')
    } catch (error) {
      console.error('❌ Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDepartment = async (deptData) => {
    try {
      setLoading(true)
      
      const newDept = await amplifyService.departmentService.create({
        name: deptData.name,
        description: deptData.description,
        status: 'active'
      })
      
      console.log('✅ Department created:', newDept)
      await loadData()
    } catch (error) {
      console.error('❌ Error creating department:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditDepartment = async (deptId, updates) => {
    try {
      setLoading(true)
      
      await amplifyService.departmentService.update(deptId, updates)
      console.log('✅ Department updated')
      
      await loadData()
    } catch (error) {
      console.error('❌ Error updating department:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDepartment = async (deptId) => {
    try {
      setLoading(true)
      
      await amplifyService.departmentService.delete(deptId)
      console.log('✅ Department deleted')
      
      await loadData()
    } catch (error) {
      console.error('❌ Error deleting department:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRole = async (roleData) => {
    try {
      setLoading(true)
      
      const newRole = await amplifyService.roleService.create({
        name: roleData.name,
        description: roleData.description,
        departmentId: roleData.departmentId,
        status: 'active'
      })
      
      console.log('✅ Role created:', newRole)
      
      // Add default permissions for this role
      const modules = ['joborder', 'payment', 'inspection', 'customer', 'vehicle']
      
      for (const module of modules) {
        await amplifyService.permissionService.create({
          roleId: newRole.id,
          moduleName: module,
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: false  // Restrict delete by default
        })
      }
      
      await loadData()
    } catch (error) {
      console.error('❌ Error creating role:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    // JSX...
  )
}
```

## Migration Checklist

For each component, follow these steps:

- [ ] Import amplifyService
- [ ] Replace mock data loading with backend calls
- [ ] Update create/update/delete handlers to use service methods
- [ ] Add error handling and loading states
- [ ] Add console logging for debugging
- [ ] Test with different user roles
- [ ] Test error scenarios
- [ ] Verify backend data consistency
- [ ] Update TypeScript types if needed
- [ ] Add proper try/catch blocks

## Common Patterns

### Loading with Loading State and Error Handling
```typescript
const loadData = async () => {
  try {
    setLoading(true)
    setError(null)
    const data = await amplifyService.someService.getAll()
    setData(data)
  } catch (err) {
    setError(err.message)
    console.error('Error:', err)
  } finally {
    setLoading(false)
  }
}
```

### Creating Item with Validation
```typescript
const handleCreate = async (input) => {
  try {
    if (!input.name?.trim()) {
      setError('Name is required')
      return
    }
    
    setLoading(true)
    const item = await amplifyService.someService.create(input)
    console.log('✅ Created:', item)
    
    // Refresh list
    await loadData()
  } catch (err) {
    setError('Failed to create item')
    console.error('Error:', err)
  } finally {
    setLoading(false)
  }
}
```

### Updating with Optimistic UI
```typescript
const handleUpdate = async (id, updates) => {
  const originalData = data
  
  try {
    // Optimistic update
    setData(data.map(item => item.id === id ? { ...item, ...updates } : item))
    
    // Actual update
    await amplifyService.someService.update(id, updates)
    console.log('✅ Updated')
  } catch (err) {
    // Revert on error
    setData(originalData)
    setError('Failed to update')
    console.error('Error:', err)
  }
}
```
