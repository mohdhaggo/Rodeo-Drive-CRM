// Shared demo data for Customer and Vehicle Management
// This ensures consistency across modules

// Map role names to actual user names from the system
const getUserNameByRole = (role) => {
    const roleToUserMap = {
        'Sales Agent': 'test number 03',
        'Sales Manager': 'test number 02',
        'Inspector': 'test number 11',
        'Inspection': 'test number 11',
        'Technician': 'test number 16',
        'Quality Inspector': 'test number 21',
        'Supervisor': 'test number 08',
        'General manger': 'test number 08',
        'Receiptioant': 'test number 04',
        'Receptionist': 'test number 04'
    };
    
    // If the role is in our map, return the mapped user name
    if (roleToUserMap[role]) {
        return roleToUserMap[role];
    }
    
    // If it's already a user name (starts with 'test number' or has specific pattern), return as is
    if (role && (role.startsWith('test number') || role.startsWith('EP'))) {
        return role;
    }
    
    // Default: if we can't find a mapping, return a generic admin user
    return 'test number 99';
};

const generateVIN = () => {
    const chars = '0123456789ABCDEFGHJKLMNPRSTUVWXYZ';
    let vin = '';
    for (let i = 0; i < 17; i++) {
        vin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return vin;
};

export const generateSharedDemoData = () => {
    const firstNames = ['Ahmed', 'Sarah', 'John', 'Emma', 'Michael', 'Lisa', 'James', 'Maria', 'David', 'Patricia', 'Mohammed', 'Fatima', 'Robert', 'Aisha'];
    const lastNames = ['Hassan', 'Johnson', 'Smith', 'Williams', 'Brown', 'Garcia', 'Miller', 'Davis', 'Rahman', 'Ali', 'Khan', 'Jones'];
    const makes = ['Toyota', 'BMW', 'Mercedes', 'Honda', 'Ford', 'Hyundai', 'Kia', 'Nissan', 'Chevrolet', 'Volkswagen', 'Audi'];
    const models = ['Camry', 'X5', 'C300', 'Civic', 'Explorer', 'Sonata', 'Sorento', 'Altima', 'Malibu', 'Passat', 'A4'];
    const colors = ['Silver Metallic', 'Black Sapphire', 'White', 'Blue', 'Red', 'Gray', 'Green', 'Brown', 'White Pearl'];
    const vehicleTypes = ['SUV', 'Sedan', 'Hatchback', 'Coupe', 'Truck'];

    const customers = [];
    const allVehicles = [];

    // Generate 17 customers with vehicles
    for (let i = 0; i < 17; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[i % lastNames.length];
        const customerName = `${firstName} ${lastName}`;
        const customerId = `CUST-2023-00${String(1245 - i).padStart(4, '0')}`;
        
        // Generate 1-3 vehicles per customer
        const vehicleCount = Math.floor(Math.random() * 3) + 1;
        const customerVehicles = [];
        let totalServicesCount = 0;

        for (let j = 0; j < vehicleCount; j++) {
            const makeIndex = (i + j) % makes.length;
            const modelIndex = (i + j) % models.length;
            const colorIndex = (i + j) % colors.length;
            const year = 2020 + Math.floor(Math.random() * 4);
            const platePrefix = ['DXB', 'SHJ', 'AUH', 'RAK', 'FJH', 'AJM'][Math.floor(Math.random() * 6)];
            const plateNumber = `${platePrefix}-${Math.floor(1000 + Math.random() * 9000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
            const completedServices = Math.floor(Math.random() * 10);
            totalServicesCount += completedServices;
            
            // Generate registration date (between vehicle year and now)
            const regYear = year + Math.floor(Math.random() * 2);
            const regMonth = Math.floor(Math.random() * 12) + 1;
            const regDay = Math.floor(Math.random() * 28) + 1;
            const registrationDate = `${regDay} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][regMonth - 1]} ${regYear}`;

            const vehicle = {
                vehicleId: `VEH-00${String(1260 - (i * 3 + j)).padStart(4, '0')}`,
                make: makes[makeIndex],
                model: models[modelIndex],
                year: year.toString(),
                color: colors[colorIndex],
                plateNumber: plateNumber,
                completedServices: completedServices,
                vehicleType: vehicleTypes[(i + j) % vehicleTypes.length],
                vin: generateVIN(),
                ownedBy: customerName,
                customerId: customerId,
                registrationDate: registrationDate
            };

            customerVehicles.push(vehicle);
            allVehicles.push({
                ...vehicle,
                customerDetails: {
                    customerId: customerId,
                    name: customerName,
                    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
                    mobile: `+971 5${Math.floor(Math.random() * 9)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
                    address: Math.random() > 0.5 ? `Building ${Math.floor(Math.random() * 100) + 1}, Street ${Math.floor(Math.random() * 50) + 1}, ${['Dubai', 'Sharjah', 'Abu Dhabi', 'Ajman'][Math.floor(Math.random() * 4)]}` : null,
                    registeredVehiclesCount: vehicleCount,
                    completedServicesCount: totalServicesCount
                }
            });
        }

        customers.push({
            id: customerId,
            name: customerName,
            mobile: `+971 5${Math.floor(Math.random() * 9)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
            address: Math.random() > 0.3 ? `Building ${Math.floor(Math.random() * 100) + 1}, Street ${Math.floor(Math.random() * 50) + 1}, ${['Dubai', 'Sharjah', 'Abu Dhabi', 'Ajman'][Math.floor(Math.random() * 4)]}` : null,
            registeredVehiclesCount: vehicleCount,
            completedServicesCount: totalServicesCount,
            customerSince: `${Math.floor(Math.random() * 28) + 1} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Math.floor(Math.random() * 12)]} ${2022 + Math.floor(Math.random() * 2)}`,
            vehicles: customerVehicles
        });
    }

    return {
        customers: customers.sort((a, b) => b.id.localeCompare(a.id)),
        vehicles: allVehicles.sort((a, b) => b.vehicleId.localeCompare(a.vehicleId))
    };
};

// Generate demo job orders based on vehicles with completed services
const ensureJobOrderDefaults = (order) => {
    const defaultExitPermit = {
        permitId: null,
        createDate: null,
        nextServiceDate: null,
        createdBy: null,
        collectedBy: null,
        collectedByMobile: null
    };

    return {
        additionalServiceRequests: [],
        paymentActivityLog: [],
        documents: [],
        exitPermitStatus: order.workStatus === 'Completed' ? 'Created' : 'Not Created',
        exitPermit: defaultExitPermit,
        ...order,
        customerDetails: {
            registeredVehicles: order.customerDetails?.registeredVehicles ||
                `${order.customerDetails?.registeredVehiclesCount || 0} vehicles`,
            ...order.customerDetails
        },
        vehicleDetails: {
            plateNumber: order.vehicleDetails?.plateNumber || order.vehiclePlate,
            ...order.vehicleDetails
        },
        billing: {
            invoices: [],
            ...order.billing
        }
    };
};

export const generateDemoJobOrders = () => {
    const vehicles = sharedData.vehicles;
    const jobOrders = [];
    
    const services = [
        'Oil Change & Filter Replacement',
        'Brake Pad Replacement',
        'Tire Rotation',
        'AC System Maintenance',
        'Engine Diagnostics',
        'Transmission Service',
        'Wheel Alignment',
        'Battery Replacement',
        'Windshield Wiper Replacement',
        'Coolant Flush',
        'Suspension Check',
        'Paint Protection',
        'Interior Detailing',
        'Headlight Restoration'
    ];
    
    const activeWorkStatuses = ['New Request', 'Inspection', 'Inprogress', 'Quality Check', 'Ready'];
    const workflowSteps = ['New Request', 'Inspection', 'Inprogress', 'Quality Check', 'Ready'];
    
    let orderCounter = 1245;
    
    vehicles.forEach(vehicle => {
        const completedCount = vehicle.completedServices;
        
        for (let i = 0; i < completedCount; i++) {
            const orderId = orderCounter--;
            let workStatus = activeWorkStatuses[Math.floor(Math.random() * activeWorkStatuses.length)];
            if (i % 12 === 0) workStatus = 'Completed';
            if (i % 18 === 0) workStatus = 'Cancelled';

            const paymentStatus = workStatus === 'Cancelled'
                ? 'Cancelled'
                : workStatus === 'Completed'
                    ? 'Fully Paid'
                    : (Math.random() > 0.2 ? 'Fully Paid' : 'Partially Paid');
            
            const daysAgo = Math.floor(Math.random() * 365) + (i * 15);
            const createDate = new Date();
            createDate.setDate(createDate.getDate() - daysAgo);
            const dateString = createDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            
            const serviceCount = Math.floor(Math.random() * 3) + 1;
            const selectedServices = [];
            for (let j = 0; j < serviceCount; j++) {
                const service = services[Math.floor(Math.random() * services.length)];
                if (!selectedServices.find(s => s.name === service)) {
                    let serviceStatus = 'Pending';
                    let serviceStarted = null;
                    let serviceEnded = null;
                    let serviceDuration = 'Not started';
                    let serviceTechnician = 'Not assigned';
                    
                    if (['Inprogress', 'Quality Check', 'Ready', 'Completed'].includes(workStatus)) {
                        serviceStatus = workStatus === 'Completed' ? 'Completed' : 'Inprogress';
                        const startHour = 10 + Math.floor(Math.random() * 4);
                        serviceStarted = `${dateString}, ${startHour}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} AM`;
                        serviceEnded = workStatus === 'Completed' ? `${dateString}, ${startHour + 2}:30 PM` : null;
                        serviceDuration = workStatus === 'Completed' ? '2 hours' : 'In progress';
                        serviceTechnician = ['Michael Brown', 'Sarah Miller', 'John Davis', 'Emma Wilson'][Math.floor(Math.random() * 4)];
                    } else if (workStatus === 'Cancelled') {
                        serviceStatus = 'Cancelled';
                        serviceStarted = null;
                        serviceEnded = null;
                        serviceDuration = 'Cancelled';
                        serviceTechnician = 'Not assigned';
                    }
                    
                    selectedServices.push({
                        name: service,
                        status: serviceStatus,
                        started: serviceStarted || 'Not started',
                        ended: serviceEnded || 'Not completed',
                        duration: serviceDuration,
                        technician: serviceTechnician,
                        notes: 'Service request as per customer requirement',
                        assignedTo: ['Michael Brown', 'Sarah Miller', 'John Davis', 'Emma Wilson'][j % 4],
                        technicians: [['Michael Brown', 'Sarah Miller', 'John Davis', 'Emma Wilson'][j % 4]]
                    });
                }
            }
            
            const totalAmount = (Math.floor(Math.random() * 2000) + 500);
            const discount = Math.floor(totalAmount * 0.1);
            const netAmount = totalAmount - discount;
            const amountPaid = paymentStatus === 'Fully Paid'
                ? netAmount
                : (paymentStatus === 'Partially Paid' ? Math.floor(netAmount * 0.5) : 0);
            
            const baseOrder = {
                id: `JO-2023-${String(orderId).padStart(6, '0')}`,
                orderType: i % 3 === 0 ? 'Service Order' : 'New Job Order',
                customerName: vehicle.customerDetails.name,
                mobile: vehicle.customerDetails.mobile,
                vehiclePlate: vehicle.plateNumber,
                workStatus: workStatus,
                paymentStatus: paymentStatus,
                createDate: dateString,
                
                jobOrderSummary: {
                    createDate: dateString,
                    createdBy: getUserNameByRole('Sales Agent'),
                    expectedDelivery: dateString
                },
                
                customerDetails: {
                    customerId: vehicle.customerDetails.customerId,
                    name: vehicle.customerDetails.name,
                    mobile: vehicle.customerDetails.mobile,
                    email: vehicle.customerDetails.email,
                    address: vehicle.customerDetails.address,
                    registeredVehiclesCount: vehicle.customerDetails.registeredVehiclesCount,
                    completedServicesCount: vehicle.customerDetails.completedServicesCount,
                    customerSince: '12 Jan 2023'
                },
                
                vehicleDetails: {
                    vehicleId: vehicle.vehicleId,
                    ownedBy: vehicle.ownedBy,
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                    type: vehicle.vehicleType,
                    color: vehicle.color,
                    plateNumber: vehicle.plateNumber,
                    vin: vehicle.vin,
                    registrationDate: vehicle.registrationDate,
                    completedServices: vehicle.completedServices
                },
                
                services: selectedServices,
                
                billing: {
                    billId: `BILL-2023-${String(orderId).padStart(6, '0')}`,
                    totalAmount: `QAR ${totalAmount.toFixed(2)}`,
                    discount: `QAR ${discount.toFixed(2)}`,
                    netAmount: `QAR ${netAmount.toFixed(2)}`,
                    amountPaid: `QAR ${amountPaid.toFixed(2)}`,
                    balanceDue: `QAR ${(netAmount - amountPaid).toFixed(2)}`,
                    paymentMethod: amountPaid > 0 ? 'Card' : null,
                    invoices: []
                },
                
                roadmap: (() => {
                    const baseRoadmap = workflowSteps.map((step) => ({
                        step,
                        stepStatus: 'Pending',
                        startTimestamp: null,
                        endTimestamp: null,
                        actionBy: 'Not assigned',
                        status: 'Upcoming'
                    }));
                    
                    const statusIndex = workflowSteps.indexOf(workStatus);
                    const finalIndex = workflowSteps.length - 1;
                    const effectiveIndex = statusIndex >= 0 ? statusIndex : finalIndex;
                    
                    for (let s = 0; s < effectiveIndex; s++) {
                        baseRoadmap[s].stepStatus = 'Completed';
                        baseRoadmap[s].status = 'Completed';
                        baseRoadmap[s].startTimestamp = `${dateString}, ${10 + s * 2}:30 AM`;
                        baseRoadmap[s].endTimestamp = `${dateString}, ${12 + s * 2}:15 PM`;
                        const roleNames = ['Sales Agent', 'Inspector', 'Technician', 'Quality Inspector', 'Supervisor'];
                        baseRoadmap[s].actionBy = getUserNameByRole(roleNames[s] || 'Supervisor');
                    }
                    
                    if (effectiveIndex >= 0 && effectiveIndex < baseRoadmap.length) {
                        baseRoadmap[effectiveIndex].stepStatus = workStatus === 'Cancelled' ? 'Cancelled' : 'Active';
                        baseRoadmap[effectiveIndex].status = workStatus === 'Cancelled' ? 'Cancelled' : 'InProgress';
                        baseRoadmap[effectiveIndex].startTimestamp = `${dateString}, ${10 + effectiveIndex * 2}:30 AM`;
                        const roleNames = ['Sales Agent', 'Inspector', 'Technician', 'Quality Inspector', 'Supervisor'];
                        baseRoadmap[effectiveIndex].actionBy = getUserNameByRole(roleNames[effectiveIndex] || 'Supervisor');
                        if (workStatus === 'Completed') {
                            baseRoadmap[effectiveIndex].stepStatus = 'Completed';
                            baseRoadmap[effectiveIndex].status = 'Completed';
                            baseRoadmap[effectiveIndex].endTimestamp = `${dateString}, ${12 + effectiveIndex * 2}:15 PM`;
                        }
                    }
                    
                    return baseRoadmap;
                })()
            };

            const completedPermit = workStatus === 'Completed'
                ? {
                    permitId: `PERMIT-${String(orderId).padStart(6, '0')}`,
                    createDate: `${dateString}, 03:15 PM`,
                    nextServiceDate: '15 Apr 2024',
                    createdBy: getUserNameByRole('Supervisor'),
                    collectedBy: vehicle.customerDetails.name,
                    collectedByMobile: vehicle.customerDetails.mobile
                }
                : {
                    permitId: null,
                    createDate: null,
                    nextServiceDate: null,
                    createdBy: null,
                    collectedBy: null,
                    collectedByMobile: null
                };

            const finalOrder = ensureJobOrderDefaults({
                ...baseOrder,
                exitPermitStatus: workStatus === 'Completed' ? 'Created' : 'Not Created',
                exitPermit: completedPermit
            });

            jobOrders.push(finalOrder);
        }
    });
    
    return jobOrders.sort((a, b) => b.id.localeCompare(a.id));
};

// Generate the data once
const sharedData = generateSharedDemoData();
const demoJobOrders = generateDemoJobOrders();

export const getCustomers = () => sharedData.customers;
export const getVehicles = () => sharedData.vehicles;
export const getJobOrders = () => demoJobOrders.map(ensureJobOrderDefaults);

export const updateCompletedServiceCounts = () => {
    if (typeof localStorage === 'undefined') return;

    const orders = JSON.parse(localStorage.getItem('jobOrders') || '[]');
    if (orders.length === 0) return;

    const customerCounts = {};
    const vehicleCounts = {};
    const customerByNameMobile = {};

    const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]');
    savedCustomers.forEach((customer) => {
        const nameKey = (customer.name || '').trim().toLowerCase();
        const mobileKey = (customer.mobile || '').trim().toLowerCase();
        if (!nameKey || !mobileKey) return;
        customerByNameMobile[`${nameKey}|${mobileKey}`] = customer.id;
    });

    orders.forEach((order) => {
        const workStatus = (order.workStatus || '').toLowerCase();
        if (workStatus !== 'completed') return;

        const orderName = (order.customerDetails?.name || order.customerName || '').trim().toLowerCase();
        const orderMobile = (order.customerDetails?.mobile || order.mobile || '').trim().toLowerCase();
        const customerId = order.customerDetails?.customerId
            || order.customerDetails?.id
            || order.customerId
            || order.customer?.id
            || order.customer?.customerId
            || customerByNameMobile[`${orderName}|${orderMobile}`];
        const vehicleId = order.vehicleDetails?.vehicleId || order.vehicleDetails?.id;

        if (customerId) {
            customerCounts[customerId] = (customerCounts[customerId] || 0) + 1;
        }
        if (vehicleId) {
            vehicleCounts[vehicleId] = (vehicleCounts[vehicleId] || 0) + 1;
        }
    });

    if (savedCustomers.length > 0) {
        const updatedCustomers = savedCustomers.map((customer) => {
            const updatedVehicles = (customer.vehicles || []).map((vehicle) => {
                const updatedCount = vehicleCounts[vehicle.vehicleId];
                if (updatedCount === undefined) return vehicle;
                return { ...vehicle, completedServices: updatedCount };
            });

            const completedServicesCount = customerCounts[customer.id];
            return {
                ...customer,
                vehicles: updatedVehicles,
                completedServicesCount: completedServicesCount !== undefined
                    ? completedServicesCount
                    : customer.completedServicesCount || 0
            };
        });
        localStorage.setItem('jobOrderCustomers', JSON.stringify(updatedCustomers));
    }

    const savedVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]');
    if (savedVehicles.length > 0) {
        const updatedVehicles = savedVehicles.map((vehicle) => {
            const updatedCount = vehicleCounts[vehicle.vehicleId];
            const customerId = vehicle.customerId || vehicle.customerDetails?.customerId;
            const customerCount = customerId ? customerCounts[customerId] : undefined;

            const updatedCustomerDetails = vehicle.customerDetails
                ? {
                    ...vehicle.customerDetails,
                    completedServicesCount: customerCount !== undefined
                        ? customerCount
                        : vehicle.customerDetails.completedServicesCount || 0
                }
                : vehicle.customerDetails;

            return {
                ...vehicle,
                completedServices: updatedCount !== undefined ? updatedCount : (vehicle.completedServices || 0),
                customerDetails: updatedCustomerDetails
            };
        });
        localStorage.setItem('vehicleManagementVehicles', JSON.stringify(updatedVehicles));
    }

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('completed-services-updated'));
    }
};

export const getStoredJobOrders = () => {
    if (typeof localStorage === 'undefined') return getJobOrders();

    const stored = JSON.parse(localStorage.getItem('jobOrders') || '[]');
    const demoDataVersion = localStorage.getItem('demoDataVersion');
    const currentVersion = '1.6.0';

    if (stored.length === 0 || demoDataVersion !== currentVersion) {
        const demoOrders = getJobOrders();
        localStorage.setItem('jobOrders', JSON.stringify(demoOrders));
        localStorage.setItem('demoDataVersion', currentVersion);
        return demoOrders;
    }

    const normalized = stored.map(ensureJobOrderDefaults);
    localStorage.setItem('jobOrders', JSON.stringify(normalized));
    return normalized;
};
