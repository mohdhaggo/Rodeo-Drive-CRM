import { useState, useEffect, useCallback, type ChangeEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './VehicleManagement.css'
import { getVehicles, getStoredJobOrders } from './demoData'
import { vehicleService } from './amplifyService'
import PermissionGate from './PermissionGate'

interface ServiceItem {
    createDate: string
    jobCardId: string
    orderType: string
    workStatus: string
    paymentStatus: string
    totalCost: string
}

interface CustomerDetails {
    customerId: string
    name: string
    email: string
    mobile: string
    address: string | null
    registeredVehiclesCount?: number
    registeredVehicles?: string
    completedServicesCount?: number
    customerSince?: string | null
}

interface VehicleDetails {
    vehicleId: string
    ownedBy: string
    make: string
    model: string
    year: string
    color: string
    plateNumber: string
    vin: string
    registrationDate?: string | null
    type: string
    lastServiceDate?: string | null
}

interface VehicleRecord {
    vehicleId: string
    ownedBy: string
    customerId: string
    make: string
    model: string
    year: string
    color: string
    plateNumber: string
    completedServices: number
    customerDetails: CustomerDetails
    vehicleDetails: VehicleDetails
    services: ServiceItem[]
    vin?: string
    vehicleType?: string
    [key: string]: unknown
}

interface SourceVehicle {
    vehicleId?: string
    ownedBy?: string
    make?: string
    factory?: string
    model?: string
    year?: string
    color?: string
    plateNumber?: string
    plate?: string
    completedServices?: number
    vin?: string
    registrationDate?: string | null
    vehicleType?: string
    type?: string
}

interface SourceCustomer {
    id?: string
    name?: string
    email?: string
    mobile?: string
    address?: string | null
    registeredVehiclesCount?: number
    vehicles?: SourceVehicle[]
    completedServicesCount?: number
    customerSince?: string | null
}

interface JobOrder {
    id: string
    createDate: string
    orderType: string
    workStatus: string
    paymentStatus: string
    customerId?: string
    customerName?: string
    mobile?: string
    customer?: {
        id?: string
        customerId?: string
        name?: string
    }
    customerDetails?: {
        customerId?: string
        id?: string
        name?: string
        mobile?: string
    }
    vehicleDetails?: {
        vehicleId?: string
    }
    billing?: {
        netAmount?: string
    }
}

interface CompletedServiceRecord {
    createDate: string
    jobCardId: string
    orderType: string
    workStatus: string
    paymentStatus: string
    totalCost: string
    jobOrderData: JobOrder
}

interface VerifiedCustomer {
    id: string
    name: string
}

interface EditVehicleState extends VehicleRecord {
    newOwnerId: string
}

interface AddVehicleState {
    customerId: string
    make: string
    model: string
    year: string
    type: string
    color: string
    plateNumber: string
    vin: string
}

interface NavigationData {
    openDetails?: boolean
    vehicle?: VehicleRecord
    vehicleId?: string
    source?: string
    returnToCustomer?: string
}

interface VehicleManagementProps {
    navigationData?: NavigationData | null
    onClearNavigation?: () => void
    onNavigateBack?: (source: string, returnToCustomerId?: string | null) => void
    onNavigate?: (target: string, payload?: Record<string, unknown>) => void
}

const VehicleManagement = ({ navigationData, onClearNavigation, onNavigateBack, onNavigate }: VehicleManagementProps) => {
    const buildVehicleRecord = (customer: SourceCustomer, vehicle: SourceVehicle): VehicleRecord => {
        const registeredVehiclesCount = customer.registeredVehiclesCount ?? customer.vehicles?.length ?? 1;
        const vehicleId = vehicle.vehicleId || `VEH-${Date.now()}`;
        return {
            vehicleId,
            ownedBy: customer.name || vehicle.ownedBy || 'Unknown',
            customerId: customer.id || 'Unknown',
            make: vehicle.make || vehicle.factory || 'N/A',
            model: vehicle.model || 'N/A',
            year: vehicle.year || 'N/A',
            color: vehicle.color || 'N/A',
            plateNumber: vehicle.plateNumber || vehicle.plate || 'N/A',
            completedServices: vehicle.completedServices || 0,
            customerDetails: {
                customerId: customer.id || 'Unknown',
                name: customer.name || 'Unknown',
                email: customer.email || '',
                mobile: customer.mobile || '',
                address: customer.address || null,
                registeredVehiclesCount: registeredVehiclesCount,
                registeredVehicles: `${registeredVehiclesCount} vehicle${registeredVehiclesCount === 1 ? '' : 's'}`,
                completedServicesCount: customer.completedServicesCount || 0,
                customerSince: customer.customerSince || null
            },
            vehicleDetails: {
                vehicleId,
                ownedBy: customer.name || vehicle.ownedBy || 'Unknown',
                make: vehicle.make || vehicle.factory || 'N/A',
                model: vehicle.model || 'N/A',
                year: vehicle.year || 'N/A',
                color: vehicle.color || 'N/A',
                plateNumber: vehicle.plateNumber || vehicle.plate || 'N/A',
                vin: vehicle.vin || '',
                registrationDate: vehicle.registrationDate || null,
                type: vehicle.vehicleType || vehicle.type || 'N/A',
                lastServiceDate: null
            },
            services: []
        };
    };

    const syncVehiclesFromCustomers = useCallback(() => {
        const savedVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]') as VehicleRecord[];
        const savedIds = new Set(savedVehicles.map((v: VehicleRecord) => v.vehicleId));
        const savedCustomers = JSON.parse(localStorage.getItem('jobOrderCustomers') || '[]') as SourceCustomer[];

        const derivedVehicles: VehicleRecord[] = [];
        savedCustomers.forEach((customer: SourceCustomer) => {
            (customer.vehicles || []).forEach((vehicle: SourceVehicle) => {
                if (!vehicle.vehicleId || savedIds.has(vehicle.vehicleId)) return;
                derivedVehicles.push(buildVehicleRecord(customer, vehicle));
                savedIds.add(vehicle.vehicleId);
            });
        });

        const mergedSaved = derivedVehicles.length > 0
            ? [...savedVehicles, ...derivedVehicles]
            : savedVehicles;

        if (derivedVehicles.length > 0) {
            localStorage.setItem('vehicleManagementVehicles', JSON.stringify(mergedSaved));
        }

        const demoVehicles = getVehicles() as VehicleRecord[];
        const allVehicles: VehicleRecord[] = [...demoVehicles];
        mergedSaved.forEach((saved: VehicleRecord) => {
            if (!allVehicles.some(v => v.vehicleId === saved.vehicleId)) {
                allVehicles.push(saved);
            }
        });
        setVehicles(allVehicles);
    }, []);
    // Load vehicles from demo data and localStorage
    const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
    const [, setIsLoadingVehicles] = useState(true);
    const [jobOrders, setJobOrders] = useState<JobOrder[]>(() => getStoredJobOrders() as JobOrder[])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<VehicleRecord[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
    const [detailsVehicle, setDetailsVehicle] = useState<VehicleRecord | null>(null)
    const [editVehicle, setEditVehicle] = useState<EditVehicleState | null>(null)
    const [deleteVehicle, setDeleteVehicle] = useState<VehicleRecord | null>(null)
    const [addVehicle, setAddVehicle] = useState<AddVehicleState | null>(null)
    const [verifiedCustomer, setVerifiedCustomer] = useState<VerifiedCustomer | null>(null)
    const [addVerifiedCustomer, setAddVerifiedCustomer] = useState<VerifiedCustomer | null>(null)
    const [navigationSource, setNavigationSource] = useState<string | null>(null)
    const [returnToCustomerId, setReturnToCustomerId] = useState<string | null>(null)

    // Load vehicles from Amplify on component mount
    useEffect(() => {
        const loadVehicles = async () => {
            try {
                setIsLoadingVehicles(true);
                const amplifyVehicles = await vehicleService.getAll();
                console.log('✅ Loaded vehicles from Amplify:', amplifyVehicles);
                
                // Map Amplify data to vehicle interface
                const mappedVehicles = (amplifyVehicles || []).map((v: any): VehicleRecord => ({
                    vehicleId: v.id,
                    ownedBy: v.customer?.name || 'Unknown',
                    customerId: v.customerId,
                    make: v.make,
                    model: v.model,
                    year: v.year,
                    color: v.color || '',
                    plateNumber: v.plateNumber || '',
                    completedServices: v.jobOrders?.filter((jo: any) => jo.workStatus === 'Completed').length || 0,
                    customerDetails: {
                        customerId: v.customerId,
                        name: v.customer?.name || 'Unknown',
                        email: v.customer?.email || '',
                        mobile: v.customer?.mobile || '',
                        address: v.customer?.address || null,
                    },
                    vehicleDetails: {
                        vehicleId: v.id,
                        ownedBy: v.customer?.name || 'Unknown',
                        make: v.make,
                        model: v.model,
                        year: v.year,
                        color: v.color || '',
                        plateNumber: v.plateNumber || '',
                        vin: v.vin || '',
                        type: v.vehicleType || '',
                    },
                    services: []
                }));
                
                // Merge with locally saved vehicles
                const savedVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]') as VehicleRecord[];
                const allVehicles: VehicleRecord[] = [...mappedVehicles];
                savedVehicles.forEach((saved: VehicleRecord) => {
                    if (!allVehicles.some(v => v.vehicleId === saved.vehicleId)) {
                        allVehicles.push(saved);
                    }
                });
                
                setVehicles(allVehicles);
            } catch (error) {
                console.error('❌ Error loading vehicles from Amplify:', error);
                // Fall back to demo data
                const demoVehicles = getVehicles() as VehicleRecord[];
                const savedVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]') as VehicleRecord[];
                const allVehicles: VehicleRecord[] = [...demoVehicles];
                savedVehicles.forEach((saved: VehicleRecord) => {
                    if (!allVehicles.some(v => v.vehicleId === saved.vehicleId)) {
                        allVehicles.push(saved);
                    }
                });
                setVehicles(allVehicles);
            } finally {
                setIsLoadingVehicles(false);
            }
        };
        
        loadVehicles();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null
            if (!target) {
                return
            }

            // Check if click is outside dropdown button and menu
            const isDropdownButton = target.closest('.btn-action-dropdown')
            const isDropdownMenu = target.closest('.action-dropdown-menu')
            
            if (!isDropdownButton && !isDropdownMenu) {
                setActiveDropdown(null)
            }
        }

        if (activeDropdown) {
            document.addEventListener('click', handleClickOutside)
            return () => {
                document.removeEventListener('click', handleClickOutside)
            }
        }
    }, [activeDropdown])

    // Handle navigation from other modules
    useEffect(() => {
        console.log('Navigation data received:', navigationData);
        if (navigationData?.openDetails) {
            // Handle navigation from Customer Management with vehicle object
            if (navigationData?.vehicle) {
                console.log('Setting details vehicle:', navigationData.vehicle);
                // Store the source module for back navigation ONLY from Customer Management
                if (navigationData.source === 'Customers Management') {
                    setNavigationSource(navigationData.source);
                }
                // Store customer ID to return to
                if (navigationData.returnToCustomer) {
                    setReturnToCustomerId(navigationData.returnToCustomer);
                }
                // Use the vehicle data passed from navigation
                setDetailsVehicle(navigationData.vehicle);
            }
            // Handle navigation from Job Order History with vehicle ID
            else if (navigationData?.vehicleId) {
                console.log('Setting details vehicle by ID:', navigationData.vehicleId);
                // Find the vehicle by ID - get fresh data directly
                const demoVehicles = getVehicles() as VehicleRecord[];
                const savedVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]') as VehicleRecord[];
                const allVehicles: VehicleRecord[] = [...demoVehicles, ...savedVehicles];
                const vehicle = allVehicles.find((v: VehicleRecord) => v.vehicleId === navigationData.vehicleId);
                if (vehicle) {
                    setDetailsVehicle(vehicle);
                }
                // Do NOT set navigationSource when coming back from Job Order History
                // User should stay in Vehicle Management when closing details
            }
            
            // Clear navigation data after a short delay to ensure state is updated
            const timer = setTimeout(() => {
                if (onClearNavigation) {
                    onClearNavigation();
                }
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [navigationData, onClearNavigation]);

    useEffect(() => {
        setSearchResults([...vehicles].sort((a, b) => {
            const idA = parseInt(a.vehicleId.replace('VEH-', ''))
            const idB = parseInt(b.vehicleId.replace('VEH-', ''))
            return idB - idA
        }))
    }, [vehicles])

    useEffect(() => {
        syncVehiclesFromCustomers();
    }, [syncVehiclesFromCustomers]);

    useEffect(() => {
        const handleCompletedServicesUpdate = () => {
            syncVehiclesFromCustomers();
            setJobOrders(getStoredJobOrders() as JobOrder[]);
        };

        window.addEventListener('completed-services-updated', handleCompletedServicesUpdate);
        return () => window.removeEventListener('completed-services-updated', handleCompletedServicesUpdate);
    }, [syncVehiclesFromCustomers]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([...vehicles])
        } else {
            const results = performSmartSearch(searchQuery)
            setSearchResults(results)
        }
        setCurrentPage(1)
    }, [searchQuery, vehicles])

    const performSmartSearch = (query: string): VehicleRecord[] => {
        const terms = query.toLowerCase().split(' ').filter((term: string) => term.trim())
        let results: VehicleRecord[] = [...vehicles]
        
        terms.forEach((term: string) => {
            if (term.startsWith('!')) {
                const excludeTerm = term.substring(1)
                if (excludeTerm) {
                    results = results.filter((vehicle: VehicleRecord) => !matchesTerm(vehicle, excludeTerm))
                }
            } else if (term.includes(':')) {
                const [field, value] = term.split(':')
                if (field && value) {
                    results = results.filter((vehicle: VehicleRecord) => matchesField(vehicle, field.trim(), value.trim()))
                }
            } else {
                results = results.filter((vehicle: VehicleRecord) => matchesTerm(vehicle, term))
            }
        })
        
        return results
    }

    const matchesTerm = (vehicle: VehicleRecord, term: string): boolean => {
        const normalizedTerm = term.toLowerCase()
        return (
            vehicle.vehicleId.toLowerCase().includes(normalizedTerm) ||
            vehicle.ownedBy.toLowerCase().includes(normalizedTerm) ||
            vehicle.make.toLowerCase().includes(normalizedTerm) ||
            vehicle.model.toLowerCase().includes(normalizedTerm) ||
            vehicle.year.toLowerCase().includes(normalizedTerm) ||
            vehicle.color.toLowerCase().includes(normalizedTerm) ||
            vehicle.plateNumber.toLowerCase().includes(normalizedTerm)
        )
    }

    const matchesField = (vehicle: VehicleRecord, field: string, value: string): boolean => {
        const fieldMap: Record<string, keyof VehicleRecord> = {
            'make': 'make',
            'brand': 'make',
            'model': 'model',
            'year': 'year',
            'color': 'color',
            'plate': 'plateNumber',
            'owner': 'ownedBy',
            'id': 'vehicleId'
        }
        
        const actualField = fieldMap[field.toLowerCase()] || (field as keyof VehicleRecord)
        const rawValue = vehicle[actualField]
        
        if (rawValue !== undefined && rawValue !== null) {
            const fieldValue = String(rawValue).toLowerCase()
            const searchValue = value.toLowerCase()
            return fieldValue.includes(searchValue)
        }
        
        return false
    }

    const highlightSearchMatches = (text: string | number, query: string): ReactNode => {
        if (!query || query.startsWith('!') || query.includes(':')) {
            return text
        }
        
        const terms = query.toLowerCase().split(' ')
            .filter((term: string) => !term.startsWith('!') && !term.includes(':'))
        
        if (terms.length === 0) {
            return text
        }
        
        let result = String(text)
        const textLower = result.toLowerCase()
        
        terms.forEach((term: string) => {
            if (term && textLower.includes(term)) {
                const regex = new RegExp(`(${term})`, 'gi')
                result = result.replace(regex, '<span class="search-highlight">$1</span>')
            }
        })
        
        return <span dangerouslySetInnerHTML={{ __html: result }} />
    }

    const totalPages = Math.ceil(searchResults.length / pageSize)
    const paginatedData = searchResults.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const getWorkStatusClass = (status: string): string => {
        switch(status) {
            case 'Completed': return 'status-completed'
            case 'Inprogress': return 'status-inprogress'
            case 'Quality Check': return 'status-pending'
            case 'Ready': return 'status-completed'
            case 'New Request': return 'status-pending'
            case 'Inspection': return 'status-pending'
            default: return 'status-pending'
        }
    }

    // Get completed services for a vehicle from job orders
    const getVehicleCompletedServices = (vehicleId: string): CompletedServiceRecord[] => {
        if (!jobOrders || !vehicleId) return []
        
        // Filter job orders for this vehicle and only completed ones
        return jobOrders
            .filter((order: JobOrder) => 
                order.vehicleDetails?.vehicleId === vehicleId && 
                order.workStatus === 'Completed'
            )
            .map((order: JobOrder): CompletedServiceRecord => ({
                createDate: order.createDate,
                jobCardId: order.id,
                orderType: order.orderType,
                workStatus: order.workStatus,
                paymentStatus: order.paymentStatus,
                totalCost: order.billing?.netAmount || 'N/A',
                jobOrderData: order // Store full order data for navigation
            }))
            .sort((a, b) => {
                // Sort by date, newest first
                const dateA = new Date(a.createDate)
                const dateB = new Date(b.createDate)
                return dateB.getTime() - dateA.getTime()
            })
    }

    const getCustomerCompletedCount = (customerId: string, customerName: string, customerMobile: string): number => {
        if (!jobOrders) return 0

        const nameKey = (customerName || '').trim().toLowerCase()
        const mobileKey = (customerMobile || '').trim().toLowerCase()

        return jobOrders.filter((order: JobOrder) => {
            if (order.workStatus !== 'Completed') return false

            const orderCustomerId = order.customerDetails?.customerId
                || order.customerDetails?.id
                || order.customerId
                || order.customer?.id
                || order.customer?.customerId

            if (customerId && orderCustomerId === customerId) return true

            const orderName = (order.customerDetails?.name || order.customerName || '').trim().toLowerCase()
            const orderMobile = (order.customerDetails?.mobile || order.mobile || '').trim().toLowerCase()

            if (nameKey && mobileKey) {
                return orderName === nameKey && orderMobile === mobileKey
            }

            return false
        }).length
    }

    // Navigate to Job Order History with details view
    const handleViewJobOrderDetails = (jobOrderData: JobOrder, vehicleId: string) => {
        if (onNavigate) {
            onNavigate('Job Order History', {
                openDetails: true,
                jobOrder: jobOrderData,
                source: 'Vehicles Management',
                returnToVehicle: vehicleId
            })
        }
    }

    const handlePageSizeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setPageSize(parseInt(e.target.value, 10))
        setCurrentPage(1)
    }

    const handleVerifyCustomer = () => {
        if (!editVehicle?.newOwnerId?.trim()) {
            alert('Please enter a Customer ID')
            return
        }
        
        const customer = vehicles.find((v: VehicleRecord) => v.customerId === editVehicle.newOwnerId)
        if (customer) {
            setVerifiedCustomer({ id: customer.customerId, name: customer.ownedBy })
            alert(`Customer verified: ${customer.ownedBy}`)
        } else {
            setVerifiedCustomer(null)
            alert('Customer not found. Customer must be pre-registered in the system.')
        }
    }

    const handleVerifyCustomerForAdd = () => {
        if (!addVehicle?.customerId?.trim()) {
            alert('Please enter a Customer ID')
            return
        }
        
        const customer = vehicles.find((v: VehicleRecord) => v.customerId === addVehicle.customerId)
        if (customer) {
            setAddVerifiedCustomer({ id: customer.customerId, name: customer.ownedBy })
            alert(`Customer verified: ${customer.ownedBy}`)
        } else {
            setAddVerifiedCustomer(null)
            alert('Customer not found. Customer must be pre-registered in the system.')
        }
    }

    const handleSaveEdit = () => {
        if (!editVehicle) {
            return
        }

        if (!editVehicle.newOwnerId || !editVehicle.color || !editVehicle.plateNumber || !editVehicle.vin) {
            alert('Please fill in all fields')
            return
        }
        
        if (!verifiedCustomer) {
            alert('Please verify the customer before saving')
            return
        }
        
        // Update vehicle in state
        const updatedVehicles = vehicles.map((v: VehicleRecord): VehicleRecord => {
            if (v.vehicleId === editVehicle.vehicleId) {
                return {
                    ...v,
                    ownedBy: verifiedCustomer.name,
                    customerId: editVehicle.newOwnerId,
                    color: editVehicle.color,
                    plateNumber: editVehicle.plateNumber,
                    vehicleDetails: {
                        ...v.vehicleDetails,
                        ownedBy: verifiedCustomer.name,
                        color: editVehicle.color,
                        plateNumber: editVehicle.plateNumber,
                        vin: editVehicle.vin || ''
                    },
                    customerDetails: {
                        ...v.customerDetails,
                        customerId: editVehicle.newOwnerId,
                        name: verifiedCustomer.name
                    }
                };
            }
            return v;
        });
        setVehicles(updatedVehicles);
        
        // Update in localStorage if it's a saved vehicle
        const savedVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]') as VehicleRecord[];
        const vehicleIndex = savedVehicles.findIndex((v: VehicleRecord) => v.vehicleId === editVehicle.vehicleId);
        if (vehicleIndex !== -1) {
            const updatedVehicle = updatedVehicles.find((v: VehicleRecord) => v.vehicleId === editVehicle.vehicleId)
            if (updatedVehicle) {
                savedVehicles[vehicleIndex] = updatedVehicle;
            }
            localStorage.setItem('vehicleManagementVehicles', JSON.stringify(savedVehicles));
        }
        
        // Update detailsVehicle if it's the one being edited
        if (detailsVehicle?.vehicleId === editVehicle.vehicleId) {
            const updatedDetail = updatedVehicles.find((v: VehicleRecord) => v.vehicleId === editVehicle.vehicleId) || null
            setDetailsVehicle(updatedDetail);
        }
        
        alert(`Vehicle ${editVehicle.vehicleId} details updated successfully!`)
        setEditVehicle(null)
        setVerifiedCustomer(null)
    }

    const handleSaveNewVehicle = () => {
        if (!addVehicle) {
            return
        }

        if (!addVehicle.customerId || !addVehicle.make || !addVehicle.model || !addVehicle.year || !addVehicle.type || !addVehicle.color || !addVehicle.plateNumber) {
            alert('Please fill in all required fields')
            return
        }
        
        if (!addVerifiedCustomer) {
            alert('Please verify the customer before saving')
            return
        }
        
        // Generate new vehicle ID
        const newVehicleId = `VEH-${String(Date.now()).slice(-6)}`;
        
        // Create new vehicle object
        const newVehicle: VehicleRecord = {
            vehicleId: newVehicleId,
            ownedBy: addVerifiedCustomer.name,
            customerId: addVehicle.customerId,
            make: addVehicle.make,
            model: addVehicle.model,
            year: addVehicle.year,
            color: addVehicle.color,
            plateNumber: addVehicle.plateNumber,
            completedServices: 0,
            customerDetails: {
                customerId: addVehicle.customerId,
                name: addVerifiedCustomer.name,
                email: '',
                mobile: '',
                address: null,
                registeredVehiclesCount: 1,
                registeredVehicles: '1 vehicle',
                completedServicesCount: 0,
                customerSince: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            },
            vehicleDetails: {
                vehicleId: newVehicleId,
                ownedBy: addVerifiedCustomer.name,
                make: addVehicle.make,
                model: addVehicle.model,
                year: addVehicle.year,
                color: addVehicle.color,
                plateNumber: addVehicle.plateNumber,
                vin: addVehicle.vin || '',
                registrationDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                type: addVehicle.type,
                lastServiceDate: null
            },
            services: []
        };
        
        // Add to state
        const updatedVehicles: VehicleRecord[] = [newVehicle, ...vehicles];
        setVehicles(updatedVehicles);
        
        // Save to localStorage
        const savedVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]') as VehicleRecord[];
        savedVehicles.push(newVehicle);
        localStorage.setItem('vehicleManagementVehicles', JSON.stringify(savedVehicles));
        
        alert(`New vehicle added successfully for customer: ${addVerifiedCustomer.name}!`)
        setAddVehicle(null)
        setAddVerifiedCustomer(null)
        setVerifiedCustomer(null)
    }

    const handleConfirmDelete = () => {
        try {
            if (!deleteVehicle) return;
            
            const vehicleToDelete = deleteVehicle;
            
            // Remove from state
            const updatedVehicles = vehicles.filter((v: VehicleRecord) => v.vehicleId !== vehicleToDelete.vehicleId);
            setVehicles(updatedVehicles);
            
            // Remove from localStorage if it was a saved vehicle
            const savedVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]') as VehicleRecord[];
            const filteredSaved = savedVehicles.filter((v: VehicleRecord) => v.vehicleId !== vehicleToDelete.vehicleId);
            if (savedVehicles.length !== filteredSaved.length) {
                localStorage.setItem('vehicleManagementVehicles', JSON.stringify(filteredSaved));
            }
            
            // Close modal
            setDeleteVehicle(null);
            
            // Show success message
            if (detailsVehicle?.vehicleId === vehicleToDelete?.vehicleId) {
                setDetailsVehicle(null);
            }
            
            alert(`Vehicle ${vehicleToDelete.vehicleId} has been deleted successfully.`);
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            alert('Failed to delete vehicle. Please try again.');
            setDeleteVehicle(null);
        }
    }

    return (
        <>
            <div className={`vehicle-main-screen ${detailsVehicle ? 'hidden' : ''}`}>
                <header className="vehicle-header">
                    <div className="header-left">
                        <h1><i className="fas fa-car"></i> Vehicle Management</h1>
                    </div>
                </header>
                
                <main className="vehicle-content">
                    <section className="search-section">
                        <div className="search-container">
                            <i className="fas fa-search search-icon"></i>
                            <input 
                                type="text" 
                                className="smart-search-input" 
                                placeholder="Search by any vehicle details"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoComplete="off"
                            />
                        </div>
                        <div className="search-stats">
                            {searchResults.length === 0 ? 'No vehicles found' :
                             searchResults.length === vehicles.length && !searchQuery ? 
                             `Showing ${Math.min((currentPage - 1) * pageSize + 1, searchResults.length)}-${Math.min(currentPage * pageSize, searchResults.length)} of ${searchResults.length} vehicles` :
                             <>
                                Showing {Math.min((currentPage - 1) * pageSize + 1, searchResults.length)}-{Math.min(currentPage * pageSize, searchResults.length)} of {searchResults.length} vehicles
                                {searchQuery && <span style={{color: 'var(--secondary-color)'}}> (Filtered by: "{searchQuery}")</span>}
                             </>
                            }
                        </div>
                    </section>
                    
                    <section className="results-section">
                        <div className="section-header">
                            <h2><i className="fas fa-list"></i> Vehicle Records</h2>
                            <div className="pagination-controls">
                                <div className="records-per-page">
                                    <label htmlFor="pageSizeSelect">Records per page:</label>
                                    <select 
                                        id="pageSizeSelect" 
                                        className="page-size-select"
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                    >
                                        <option value="20">20</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </div>
                                <button className="btn-new-vehicle" onClick={() => setAddVehicle({ customerId: '', make: '', model: '', year: '', type: '', color: '', plateNumber: '', vin: '' })}>
                                    <i className="fas fa-plus-circle"></i> Add New Vehicle
                                </button>
                            </div>
                        </div>
                        
                        {paginatedData.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <i className="fas fa-search"></i>
                                </div>
                                <div className="empty-text">No matching vehicles found</div>
                                <div className="empty-subtext">Try adjusting your search terms or clear the search to see all records</div>
                            </div>
                        ) : (
                            <>
                                <div className="table-wrapper">
                                    <table className="vehicle-table">
                                        <thead>
                                            <tr>
                                                <th>Vehicle ID</th>
                                                <th>Owned by</th>
                                                <th>Make</th>
                                                <th>Model</th>
                                                <th>Year</th>
                                                <th>Color</th>
                                                <th>Plate Number</th>
                                                <th>Completed Services</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedData.map(vehicle => (
                                                <tr key={vehicle.vehicleId} className="match-highlight">
                                                    <td>{highlightSearchMatches(vehicle.vehicleId, searchQuery)}</td>
                                                    <td>{highlightSearchMatches(vehicle.ownedBy, searchQuery)}</td>
                                                    <td>{highlightSearchMatches(vehicle.make, searchQuery)}</td>
                                                    <td>{highlightSearchMatches(vehicle.model, searchQuery)}</td>
                                                    <td>{highlightSearchMatches(vehicle.year, searchQuery)}</td>
                                                    <td>{highlightSearchMatches(vehicle.color, searchQuery)}</td>
                                                    <td>{highlightSearchMatches(vehicle.plateNumber, searchQuery)}</td>
                                                    <td>{getVehicleCompletedServices(vehicle.vehicleId).length}</td>
                                                    <td>
                                                        <PermissionGate moduleId="vehicle" optionId="vehicle_actions">
                                                            <div className="action-dropdown-container">
                                                                <button 
                                                                    className={`btn-action-dropdown ${activeDropdown === vehicle.vehicleId ? 'active' : ''}`}
                                                                    onClick={(e) => {
                                                                        const isActive = activeDropdown === vehicle.vehicleId
                                                                        if (isActive) {
                                                                            setActiveDropdown(null)
                                                                            return
                                                                        }
                                                                        const rect = e.currentTarget.getBoundingClientRect()
                                                                        const menuHeight = 180
                                                                        const menuWidth = 200
                                                                        const spaceBelow = window.innerHeight - rect.bottom
                                                                        const top = spaceBelow < menuHeight ? rect.top - menuHeight - 6 : rect.bottom + 6
                                                                        const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8))
                                                                        setDropdownPosition({
                                                                            top,
                                                                            left
                                                                        })
                                                                        setActiveDropdown(vehicle.vehicleId)
                                                                    }}
                                                                >
                                                                    <i className="fas fa-cogs"></i> Actions <i className="fas fa-chevron-down"></i>
                                                                </button>
                                                            </div>
                                                        </PermissionGate>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {activeDropdown && typeof document !== 'undefined' && createPortal(
                                    <div
                                        className="action-dropdown-menu show action-dropdown-menu-fixed"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            top: `${dropdownPosition.top}px`,
                                            left: `${dropdownPosition.left}px`
                                        }}
                                    >
                                        <button className="dropdown-item view" onClick={() => {
                                            const vehicle = vehicles.find(v => v.vehicleId === activeDropdown)
                                            if (vehicle) {
                                                setDetailsVehicle(vehicle)
                                            }
                                            setActiveDropdown(null)
                                        }}>
                                            <i className="fas fa-eye"></i> View Details
                                        </button>
                                        <div className="dropdown-divider"></div>
                                        <button className="dropdown-item edit" onClick={() => {
                                            const vehicle = vehicles.find(v => v.vehicleId === activeDropdown)
                                            if (vehicle) {
                                                setEditVehicle({...vehicle, newOwnerId: vehicle.customerId, color: vehicle.color, plateNumber: vehicle.plateNumber, vin: vehicle.vin})
                                            }
                                            setActiveDropdown(null)
                                        }}>
                                            <i className="fas fa-edit"></i> Edit Vehicle
                                        </button>
                                        <div className="dropdown-divider"></div>
                                        <button className="dropdown-item delete" onClick={(e) => {
                                            e.stopPropagation();
                                            console.log('Delete vehicle button clicked, activeDropdown:', activeDropdown);
                                            const vehicle = vehicles.find(v => v.vehicleId === activeDropdown)
                                            console.log('Found vehicle:', vehicle);
                                            if (vehicle) {
                                                console.log('Setting deleteVehicle state:', vehicle);
                                                setDeleteVehicle(vehicle)
                                            }
                                            setActiveDropdown(null)
                                        }}>
                                            <i className="fas fa-trash"></i> Delete Vehicle
                                        </button>
                                    </div>,
                                    document.body
                                )}
                                
                                {totalPages > 1 && (
                                    <div className="pagination">
                                        <button 
                                            className="pagination-btn" 
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <i className="fas fa-chevron-left"></i>
                                        </button>
                                        <div className="page-numbers">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1
                                                } else {
                                                    const start = Math.max(1, currentPage - 2)
                                                    const end = Math.min(totalPages, start + 4)
                                                    const adjustedStart = Math.max(1, end - 4)
                                                    pageNum = adjustedStart + i
                                                }
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <button 
                                            className="pagination-btn" 
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <i className="fas fa-chevron-right"></i>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </main>
                
                <footer className="vehicle-footer">
                    <p>Service Management System &copy; 2023 | Vehicle Management Module</p>
                </footer>
            </div>
            
            {/* Details Screen */}
            {detailsVehicle && (
                                <div className="pim-details-screen">
                                    <div className="pim-details-header">
                                        <div className="pim-details-title-container">
                                            <h2>
                                                <i className="fas fa-car"></i> Vehicle Details - <span>{detailsVehicle.vehicleId}</span>
                                            </h2>
                                        </div>
                                        <button className="pim-btn-close-details" onClick={() => {
                                            setDetailsVehicle(null);
                                            if (navigationSource && onNavigateBack) {
                                                const customerId = returnToCustomerId;
                                                setNavigationSource(null);
                                                setReturnToCustomerId(null);
                                                onNavigateBack(navigationSource, customerId);
                                            }
                                        }}>
                                            <i className="fas fa-times"></i> Close Details
                                        </button>
                                    </div>

                                    <div className="pim-details-body">
                                        <div className="pim-details-grid">
                                            {/* Customer Info Card */}
                                            <div className="pim-detail-card">
                                                <div className="details-card-header">
                                                    <h3><i className="fas fa-user"></i> Customer Information</h3>
                                                </div>
                                                <div className="pim-card-content">
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Customer ID</span>
                                                        <span className="pim-info-value">{detailsVehicle.customerDetails.customerId}</span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Customer Name</span>
                                                        <span className="pim-info-value">{detailsVehicle.customerDetails.name}</span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Mobile Number</span>
                                                        <span className="pim-info-value">{detailsVehicle.customerDetails.mobile}</span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Email Address</span>
                                                        <span className="pim-info-value">{detailsVehicle.customerDetails.email || 'Not provided'}</span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Home Address</span>
                                                        <span className="pim-info-value">{detailsVehicle.customerDetails.address || 'Not provided'}</span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Registered Vehicles</span>
                                                        <span className="pim-info-value">
                                                            <span className="count-badge">{detailsVehicle.customerDetails.registeredVehiclesCount} vehicles</span>
                                                        </span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Completed Services</span>
                                                        <span className="pim-info-value">
                                                            <span className="count-badge">{getCustomerCompletedCount(detailsVehicle.customerDetails.customerId, detailsVehicle.customerDetails.name, detailsVehicle.customerDetails.mobile)} services</span>
                                                        </span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Customer Since</span>
                                                        <span className="pim-info-value">{detailsVehicle.customerDetails.customerSince}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Vehicle Info Card */}
                                            <div className="pim-detail-card">
                                                <div className="details-card-header">
                                                    <h3><i className="fas fa-car"></i> Vehicle Information</h3>
                                                </div>
                                                <div className="pim-card-content">
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Vehicle ID</span>
                                                        <span className="pim-info-value">{detailsVehicle.vehicleId}</span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Owned By</span>
                                                        <span className="pim-info-value">{detailsVehicle.ownedBy}</span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Make</span>
                                                        <span className="pim-info-value">{detailsVehicle.make}</span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Model</span>
                                                        <span className="pim-info-value">{detailsVehicle.model}</span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Year</span>
                                                        <span className="pim-info-value">{detailsVehicle.year}</span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Color</span>
                                                        <span className="pim-info-value">{detailsVehicle.color}</span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Plate Number</span>
                                                        <span className="pim-info-value">{detailsVehicle.plateNumber}</span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">VIN</span>
                                                        <span className="pim-info-value">{detailsVehicle.vehicleDetails?.vin || 'N/A'}</span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Vehicle Type</span>
                                                        <span className="pim-info-value">{detailsVehicle.vehicleDetails?.type || 'N/A'}</span>
                                                    </div>
                                                    <div className="pim-info-item">
                                                        <span className="pim-info-label">Completed Services</span>
                                                        <span className="pim-info-value">{getVehicleCompletedServices(detailsVehicle.vehicleId).length}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Services Card */}
                                            <div className="pim-detail-card">
                                                <div className="details-card-header">
                                                    <h3><i className="fas fa-tasks"></i> Completed Services</h3>
                                                    <button
                                                        className="btn-add-vehicle"
                                                        onClick={() => {
                                                            if (!onNavigate || !detailsVehicle) {
                                                                return;
                                                            }
                                                            const customerDetails = detailsVehicle.customerDetails || {};
                                                            const vehicleDetails = detailsVehicle.vehicleDetails || {};
                                                            onNavigate('Job Order Management', {
                                                                openNewJob: true,
                                                                startStep: 3,
                                                                source: 'Vehicles Management',
                                                                returnToVehicle: detailsVehicle.vehicleId,
                                                                customerData: {
                                                                    id: customerDetails.customerId || detailsVehicle.customerId || 'Unknown',
                                                                    name: customerDetails.name || detailsVehicle.ownedBy || 'Unknown',
                                                                    email: customerDetails.email || '',
                                                                    mobile: customerDetails.mobile || '',
                                                                    address: customerDetails.address || null,
                                                                    registeredVehiclesCount: customerDetails.registeredVehiclesCount || 0,
                                                                    completedServicesCount: customerDetails.completedServicesCount || 0,
                                                                    customerSince: customerDetails.customerSince || ''
                                                                },
                                                                vehicleData: {
                                                                    vehicleId: detailsVehicle.vehicleId,
                                                                    make: detailsVehicle.make,
                                                                    model: detailsVehicle.model,
                                                                    year: detailsVehicle.year,
                                                                    color: detailsVehicle.color,
                                                                    plateNumber: detailsVehicle.plateNumber,
                                                                    license: detailsVehicle.plateNumber,
                                                                    vehicleType: vehicleDetails.type || detailsVehicle.vehicleType || 'SUV',
                                                                    carType: vehicleDetails.type || detailsVehicle.vehicleType || 'SUV',
                                                                    vin: vehicleDetails.vin || detailsVehicle.vin || '',
                                                                    registrationDate: vehicleDetails.registrationDate || ''
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        <i className="fas fa-plus-circle"></i> Add New Order
                                                    </button>
                                                </div>
                                                <div className="table-wrapper details-table-wrapper">
                                                    <table className="vehicles-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Create Date</th>
                                                                <th>Job Card ID</th>
                                                                <th>Order Type</th>
                                                                <th>Work Status</th>
                                                                <th>Payment Status</th>
                                                                <th>Total Cost</th>
                                                                <th>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(() => {
                                                                const completedServices = getVehicleCompletedServices(detailsVehicle.vehicleId);
                                                                return completedServices.length > 0 ? (
                                                                    completedServices.map((service, idx) => (
                                                                        <tr key={idx}>
                                                                            <td className="date-column">{service.createDate}</td>
                                                                            <td>{service.jobCardId}</td>
                                                                            <td>
                                                                                <span className={`order-type-badge ${service.orderType === 'New Job Order' ? 'order-type-new-job' : 'order-type-service'}`}>
                                                                                    {service.orderType}
                                                                                </span>
                                                                            </td>
                                                                            <td>
                                                                                <span className={`status-badge ${getWorkStatusClass(service.workStatus)}`}>
                                                                                    {service.workStatus}
                                                                                </span>
                                                                            </td>
                                                                            <td>
                                                                                <span className={`status-badge ${service.paymentStatus === 'Fully Paid' ? 'payment-full' : service.paymentStatus === 'Partially Paid' ? 'payment-partial' : 'payment-unpaid'}`}>
                                                                                    {service.paymentStatus}
                                                                                </span>
                                                                            </td>
                                                                            <td>{service.totalCost}</td>
                                                                            <td>
                                                                                <button 
                                                                                    className="btn-action-dropdown" 
                                                                                    style={{minWidth: '100px'}}
                                                                                    onClick={() => handleViewJobOrderDetails(service.jobOrderData, detailsVehicle.vehicleId)}
                                                                                >
                                                                                    <i className="fas fa-eye"></i> View Details
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan={7} style={{textAlign: 'center', padding: '40px'}}>
                                                                            <i className="fas fa-clipboard-list" style={{fontSize: '48px', color: '#ddd', marginBottom: '15px', display: 'block'}}></i>
                                                                            <div style={{color: '#7f8c8d', fontSize: '16px'}}>No completed services found for this vehicle</div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })()}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
            )}
            
            {/* Edit Modal */}
            {editVehicle && (
                <div className="edit-modal-overlay" onClick={() => setEditVehicle(null)}>
                    <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="edit-modal-header">
                            <h3><i className="fas fa-edit"></i> Edit Vehicle Details</h3>
                            <button className="btn-close-modal" onClick={() => setEditVehicle(null)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="edit-modal-body">
                            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit() }}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Change Ownership (Customer ID)</label>
                                        <div className="customer-verify-section">
                                            <div className="form-group">
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    placeholder="Enter Customer ID"
                                                    value={editVehicle.newOwnerId}
                                                    onChange={(e) => setEditVehicle({...editVehicle, newOwnerId: e.target.value})}
                                                />
                                            </div>
                                            <button type="button" className="btn-verify" onClick={handleVerifyCustomer}>
                                                <i className="fas fa-check-circle"></i> Verify
                                            </button>
                                        </div>
                                        {verifiedCustomer && (
                                            <div className="customer-verified-info visible">
                                                Customer verified: <strong>{verifiedCustomer.name}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Color</label>
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            value={editVehicle.color}
                                            onChange={(e) => setEditVehicle({...editVehicle, color: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Plate Number</label>
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            value={editVehicle.plateNumber}
                                            onChange={(e) => setEditVehicle({...editVehicle, plateNumber: e.target.value})}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">VIN</label>
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            value={editVehicle.vin}
                                            onChange={(e) => setEditVehicle({...editVehicle, vin: e.target.value})}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-actions">
                                    <button type="submit" className="btn-save">
                                        <i className="fas fa-save"></i> Save Changes
                                    </button>
                                    <button type="button" className="btn-cancel" onClick={() => setEditVehicle(null)}>
                                        <i className="fas fa-times"></i> Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Add Vehicle Modal */}
            {addVehicle && (
                <div className="edit-modal-overlay" onClick={() => { setAddVehicle(null); setAddVerifiedCustomer(null); }}>
                    <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="edit-modal-header">
                            <h3><i className="fas fa-plus-circle"></i> Add New Vehicle</h3>
                            <button className="btn-close-modal" onClick={() => { setAddVehicle(null); setAddVerifiedCustomer(null); }}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="edit-modal-body">
                            <form onSubmit={(e) => { e.preventDefault(); handleSaveNewVehicle() }}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Customer ID <span style={{color: 'red'}}>*</span></label>
                                        <div className="customer-verify-section">
                                            <div className="form-group">
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    placeholder="Enter Customer ID"
                                                    value={addVehicle.customerId}
                                                    onChange={(e) => setAddVehicle({...addVehicle, customerId: e.target.value})}
                                                />
                                            </div>
                                            <button type="button" className="btn-verify" onClick={handleVerifyCustomerForAdd}>
                                                <i className="fas fa-check-circle"></i> Verify
                                            </button>
                                        </div>
                                        {addVerifiedCustomer && (
                                            <div className="customer-verified-info visible">
                                                Customer verified: <strong>{addVerifiedCustomer.name}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Make <span style={{color: 'red'}}>*</span></label>
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            placeholder="e.g., Toyota, BMW"
                                            value={addVehicle.make}
                                            onChange={(e) => setAddVehicle({...addVehicle, make: e.target.value})}
                                            disabled={!addVerifiedCustomer}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Model <span style={{color: 'red'}}>*</span></label>
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            placeholder="e.g., Camry, X5"
                                            value={addVehicle.model}
                                            onChange={(e) => setAddVehicle({...addVehicle, model: e.target.value})}
                                            disabled={!addVerifiedCustomer}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Year <span style={{color: 'red'}}>*</span></label>
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            placeholder="e.g., 2023"
                                            value={addVehicle.year}
                                            onChange={(e) => setAddVehicle({...addVehicle, year: e.target.value})}
                                            disabled={!addVerifiedCustomer}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Vehicle Type <span style={{color: 'red'}}>*</span></label>
                                        <select 
                                            className="form-input"
                                            value={addVehicle.type}
                                            onChange={(e) => setAddVehicle({...addVehicle, type: e.target.value})}
                                            disabled={!addVerifiedCustomer}
                                        >
                                            <option value="">Select Type</option>
                                            <option value="Sedan">Sedan</option>
                                            <option value="SUV">SUV</option>
                                            <option value="Truck">Truck</option>
                                            <option value="Hatchback">Hatchback</option>
                                            <option value="Coupe">Coupe</option>
                                            <option value="Van">Van</option>
                                            <option value="Convertible">Convertible</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Color <span style={{color: 'red'}}>*</span></label>
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            placeholder="e.g., Black, White"
                                            value={addVehicle.color}
                                            onChange={(e) => setAddVehicle({...addVehicle, color: e.target.value})}
                                            disabled={!addVerifiedCustomer}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Plate Number <span style={{color: 'red'}}>*</span></label>
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            placeholder="e.g., DXB-1234A"
                                            value={addVehicle.plateNumber}
                                            onChange={(e) => setAddVehicle({...addVehicle, plateNumber: e.target.value})}
                                            disabled={!addVerifiedCustomer}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">VIN (Optional)</label>
                                        <input 
                                            type="text" 
                                            className="form-input"
                                            placeholder="17-character VIN"
                                            maxLength={17}
                                            value={addVehicle.vin}
                                            onChange={(e) => setAddVehicle({...addVehicle, vin: e.target.value})}
                                            disabled={!addVerifiedCustomer}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-actions">
                                    <button type="submit" className="btn-save" disabled={!addVerifiedCustomer}>
                                        <i className="fas fa-save"></i> Add Vehicle
                                    </button>
                                    <button type="button" className="btn-cancel" onClick={() => { setAddVehicle(null); setAddVerifiedCustomer(null); }}>
                                        <i className="fas fa-times"></i> Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Delete Modal */}
            {deleteVehicle && typeof document !== 'undefined' && createPortal(
                <div className="delete-modal-overlay" onClick={() => setDeleteVehicle(null)}>
                    <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-modal-header">
                            <h3><i className="fas fa-exclamation-triangle"></i> Confirm Deletion</h3>
                        </div>
                        <div className="delete-modal-body">
                            <div className="delete-warning">
                                <i className="fas fa-exclamation-circle"></i>
                                <div className="delete-warning-text">
                                    <p>You are about to delete the vehicle <strong>{deleteVehicle.vehicleId}</strong>.</p>
                                    <p>This action cannot be undone. All vehicle records and service history will be permanently removed from the system.</p>
                                </div>
                            </div>
                            
                            <div className="delete-modal-actions">
                                <button className="btn-confirm-delete" onClick={handleConfirmDelete}>
                                    <i className="fas fa-trash"></i> Delete Vehicle
                                </button>
                                <button className="btn-cancel" onClick={() => setDeleteVehicle(null)}>
                                    <i className="fas fa-times"></i> Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

export default VehicleManagement
