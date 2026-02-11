import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './VehicleManagement.css'
import { getVehicles, getStoredJobOrders } from './demoData'

// Demo data generator functions (kept for backward compatibility but not used)
const generateVIN = () => {
    const chars = '0123456789ABCDEFGHJKLMNPRSTUVWXYZ'
    let vin = ''
    for (let i = 0; i < 17; i++) {
        vin += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return vin
}

const generateDemoVehicles = () => {
    const makes = ['Toyota', 'BMW', 'Mercedes', 'Honda', 'Ford', 'Hyundai', 'Kia', 'Nissan', 'Chevrolet', 'Volkswagen']
    const models = ['Camry', 'X5', 'C300', 'Civic', 'Explorer', 'Sonata', 'Sorento', 'Altima', 'Malibu', 'Passat']
    const colors = ['Silver Metallic', 'Black Sapphire', 'White', 'Blue', 'Red', 'Gray', 'Green', 'Brown', 'Black', 'White Pearl']
    const firstNames = ['John', 'Emma', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Maria', 'James', 'Patricia', 'Ahmed', 'Fatima', 'Mohammed', 'Aisha']
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Hassan', 'Rahman', 'Ali', 'Khan']
    
    const vehicles = []
    
    for (let i = 0; i < 20; i++) {
        const makeIndex = i % makes.length
        const modelIndex = i % models.length
        const colorIndex = i % colors.length
        const firstNameIndex = i % firstNames.length
        const lastNameIndex = i % lastNames.length
        const ownerName = `${firstNames[firstNameIndex]} ${lastNames[lastNameIndex]}`
        
        const vehicle = {
            vehicleId: `VEH-00${1260 - i}`,
            ownedBy: ownerName,
            customerId: `CUST-2023-00${1260 - i}`,
            make: makes[makeIndex],
            model: models[modelIndex],
            year: (2020 + Math.floor(Math.random() * 4)).toString(),
            color: colors[colorIndex],
            plateNumber: `${['DXB', 'SHJ', 'AUH', 'RAK', 'FJH', 'AJM'][Math.floor(Math.random() * 6)]}-${Math.floor(1000 + Math.random() * 9000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            completedServices: Math.floor(Math.random() * 10) + 1,
            
            customerDetails: {
                customerId: `CUST-2023-00${1260 - i}`,
                name: ownerName,
                email: `${firstNames[firstNameIndex].toLowerCase()}.${lastNames[lastNameIndex].toLowerCase()}@example.com`,
                mobile: `+971 5${Math.floor(Math.random() * 9)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`,
                address: Math.random() > 0.5 ? `Building ${Math.floor(Math.random() * 100) + 1}, Street ${Math.floor(Math.random() * 50) + 1}, ${['Dubai', 'Sharjah', 'Abu Dhabi', 'Ajman'][Math.floor(Math.random() * 4)]}` : null,
                registeredVehiclesCount: Math.floor(Math.random() * 3) + 1,
                registeredVehicles: `${Math.floor(Math.random() * 3) + 1} vehicles`,
                completedServicesCount: Math.floor(Math.random() * 10) + 1,
                customerSince: `${Math.floor(Math.random() * 28) + 1} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Math.floor(Math.random() * 12)]} ${2022 + Math.floor(Math.random() * 2)}`
            },
            
            vehicleDetails: {
                vehicleId: `VEH-00${1260 - i}`,
                ownedBy: ownerName,
                make: makes[makeIndex],
                model: models[modelIndex],
                year: (2020 + Math.floor(Math.random() * 4)).toString(),
                color: colors[colorIndex],
                plateNumber: `${['DXB', 'SHJ', 'AUH', 'RAK', 'FJH', 'AJM'][Math.floor(Math.random() * 6)]}-${Math.floor(1000 + Math.random() * 9000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
                vin: generateVIN(),
                registrationDate: `${Math.floor(Math.random() * 28) + 1} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][Math.floor(Math.random() * 6)]} ${2020 + Math.floor(Math.random() * 4)}`,
                type: ['Sedan', 'SUV', 'Truck', 'Hatchback', 'Coupe'][Math.floor(Math.random() * 5)],
                lastServiceDate: `${Math.floor(Math.random() * 28) + 1} ${['Sep', 'Oct', 'Nov', 'Dec', 'Jan'][Math.floor(Math.random() * 5)]} ${2023 + Math.floor(Math.random() * 2)}`
            },
            
            services: []
        }
        
        // Add random services
        const serviceCount = Math.floor(Math.random() * 5) + 1
        for (let j = 0; j < serviceCount; j++) {
            const orderTypes = ['New Job Order', 'Service Order']
            const workStatuses = ['Completed', 'Inprogress', 'Quality Check', 'Ready', 'Inspection', 'New Request']
            const paymentStatuses = ['Fully Paid', 'Partially Paid', 'Unpaid']
            
            vehicle.services.push({
                createDate: `${Math.floor(Math.random() * 28) + 1} ${['Sep', 'Oct', 'Nov', 'Dec', 'Jan'][Math.floor(Math.random() * 5)]} 2023, ${Math.floor(Math.random() * 12) + 8}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
                jobCardId: `JO-2023-00${Math.floor(Math.random() * 1000) + 1100}`,
                orderType: orderTypes[Math.floor(Math.random() * orderTypes.length)],
                workStatus: workStatuses[Math.floor(Math.random() * workStatuses.length)],
                paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
                totalCost: `QAR ${(Math.floor(Math.random() * 3000) + 300).toFixed(2)}`
            })
        }
        
        vehicles.push(vehicle)
    }
    
    return vehicles
}

const VehicleManagement = ({ navigationData, onClearNavigation, onNavigateBack, onNavigate }) => {
    // Load vehicles from demo data and localStorage
    const [vehicles, setVehicles] = useState(() => {
        const demoVehicles = getVehicles();
        const savedVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]');
        // Merge: demo vehicles + saved vehicles (avoiding duplicates)
        const allVehicles = [...demoVehicles];
        savedVehicles.forEach(saved => {
            if (!allVehicles.some(v => v.vehicleId === saved.vehicleId)) {
                allVehicles.push(saved);
            }
        });
        return allVehicles;
    });
    const [jobOrders] = useState(() => getStoredJobOrders())
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [activeDropdown, setActiveDropdown] = useState(null)
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
    const [detailsVehicle, setDetailsVehicle] = useState(null)
    const [editVehicle, setEditVehicle] = useState(null)
    const [deleteVehicle, setDeleteVehicle] = useState(null)
    const [addVehicle, setAddVehicle] = useState(null)
    const [verifiedCustomer, setVerifiedCustomer] = useState(null)
    const [addVerifiedCustomer, setAddVerifiedCustomer] = useState(null)
    const [navigationSource, setNavigationSource] = useState(null)
    const [returnToCustomerId, setReturnToCustomerId] = useState(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside dropdown button and menu
            const isDropdownButton = event.target.closest('.btn-action-dropdown')
            const isDropdownMenu = event.target.closest('.action-dropdown-menu')
            
            if (!isDropdownButton && !isDropdownMenu) {
                setActiveDropdown(null)
            }
        }

        if (activeDropdown) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => {
                document.removeEventListener('mousedown', handleClickOutside)
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
                const demoVehicles = getVehicles();
                const savedVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]');
                const allVehicles = [...demoVehicles, ...savedVehicles];
                const vehicle = allVehicles.find(v => v.vehicleId === navigationData.vehicleId);
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
        if (!searchQuery.trim()) {
            setSearchResults([...vehicles])
        } else {
            const results = performSmartSearch(searchQuery)
            setSearchResults(results)
        }
        setCurrentPage(1)
    }, [searchQuery, vehicles])

    const performSmartSearch = (query) => {
        const terms = query.toLowerCase().split(' ').filter(term => term.trim())
        let results = [...vehicles]
        
        terms.forEach(term => {
            if (term.startsWith('!')) {
                const excludeTerm = term.substring(1)
                if (excludeTerm) {
                    results = results.filter(vehicle => !matchesTerm(vehicle, excludeTerm))
                }
            } else if (term.includes(':')) {
                const [field, value] = term.split(':')
                if (field && value) {
                    results = results.filter(vehicle => matchesField(vehicle, field.trim(), value.trim()))
                }
            } else {
                results = results.filter(vehicle => matchesTerm(vehicle, term))
            }
        })
        
        return results
    }

    const matchesTerm = (vehicle, term) => {
        return (
            vehicle.vehicleId.toLowerCase().includes(term) ||
            vehicle.ownedBy.toLowerCase().includes(term) ||
            vehicle.make.toLowerCase().includes(term) ||
            vehicle.model.toLowerCase().includes(term) ||
            vehicle.year.toLowerCase().includes(term) ||
            vehicle.color.toLowerCase().includes(term) ||
            vehicle.plateNumber.toLowerCase().includes(term)
        )
    }

    const matchesField = (vehicle, field, value) => {
        const fieldMap = {
            'make': 'make',
            'brand': 'make',
            'model': 'model',
            'year': 'year',
            'color': 'color',
            'plate': 'plateNumber',
            'owner': 'ownedBy',
            'id': 'vehicleId'
        }
        
        const actualField = fieldMap[field.toLowerCase()] || field
        
        if (vehicle[actualField]) {
            const fieldValue = vehicle[actualField].toString().toLowerCase()
            const searchValue = value.toLowerCase()
            return fieldValue.includes(searchValue)
        }
        
        return false
    }

    const highlightSearchMatches = (text, query) => {
        if (!query || query.startsWith('!') || query.includes(':')) {
            return text
        }
        
        const terms = query.toLowerCase().split(' ')
            .filter(term => !term.startsWith('!') && !term.includes(':'))
        
        if (terms.length === 0) {
            return text
        }
        
        let result = text.toString()
        const textLower = result.toLowerCase()
        
        terms.forEach(term => {
            if (term && textLower.includes(term)) {
                const regex = new RegExp(`(${term})`, 'gi')
                result = result.replace(regex, '<span class="search-highlight">$1</span>')
            }
        })
        
        return <span dangerouslySetInnerHTML={{ __html: result }} />
    }

    const totalPages = Math.ceil(searchResults.length / pageSize)
    const paginatedData = searchResults.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const getWorkStatusClass = (status) => {
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
    const getVehicleCompletedServices = (vehicleId) => {
        if (!jobOrders || !vehicleId) return []
        
        // Filter job orders for this vehicle and only completed ones
        return jobOrders
            .filter(order => 
                order.vehicleDetails?.vehicleId === vehicleId && 
                order.workStatus === 'Completed'
            )
            .map(order => ({
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
                return dateB - dateA
            })
    }

    // Navigate to Job Order History with details view
    const handleViewJobOrderDetails = (jobOrderData, vehicleId) => {
        if (onNavigate) {
            onNavigate('Job Order History', {
                openDetails: true,
                jobOrder: jobOrderData,
                source: 'Vehicles Management',
                returnToVehicle: vehicleId
            })
        }
    }

    const handlePageSizeChange = (e) => {
        setPageSize(parseInt(e.target.value))
        setCurrentPage(1)
    }

    const handleVerifyCustomer = () => {
        if (!editVehicle?.newOwnerId?.trim()) {
            alert('Please enter a Customer ID')
            return
        }
        
        const customer = vehicles.find(v => v.customerId === editVehicle.newOwnerId)
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
        
        const customer = vehicles.find(v => v.customerId === addVehicle.customerId)
        if (customer) {
            setAddVerifiedCustomer({ id: customer.customerId, name: customer.ownedBy })
            alert(`Customer verified: ${customer.ownedBy}`)
        } else {
            setAddVerifiedCustomer(null)
            alert('Customer not found. Customer must be pre-registered in the system.')
        }
    }

    const handleSaveEdit = () => {
        if (!editVehicle.newOwnerId || !editVehicle.color || !editVehicle.plateNumber || !editVehicle.vin) {
            alert('Please fill in all fields')
            return
        }
        
        if (!verifiedCustomer) {
            alert('Please verify the customer before saving')
            return
        }
        
        // Update vehicle in state
        const updatedVehicles = vehicles.map(v => {
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
                        vin: editVehicle.vin
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
        const savedVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]');
        const vehicleIndex = savedVehicles.findIndex(v => v.vehicleId === editVehicle.vehicleId);
        if (vehicleIndex !== -1) {
            savedVehicles[vehicleIndex] = updatedVehicles.find(v => v.vehicleId === editVehicle.vehicleId);
            localStorage.setItem('vehicleManagementVehicles', JSON.stringify(savedVehicles));
        }
        
        // Update detailsVehicle if it's the one being edited
        if (detailsVehicle?.vehicleId === editVehicle.vehicleId) {
            setDetailsVehicle(updatedVehicles.find(v => v.vehicleId === editVehicle.vehicleId));
        }
        
        alert(`Vehicle ${editVehicle.vehicleId} details updated successfully!`)
        setEditVehicle(null)
        setVerifiedCustomer(null)
    }

    const handleSaveNewVehicle = () => {
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
        const newVehicle = {
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
        const updatedVehicles = [newVehicle, ...vehicles];
        setVehicles(updatedVehicles);
        
        // Save to localStorage
        const savedVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]');
        savedVehicles.push(newVehicle);
        localStorage.setItem('vehicleManagementVehicles', JSON.stringify(savedVehicles));
        
        alert(`New vehicle added successfully for customer: ${addVerifiedCustomer.name}!`)
        setAddVehicle(null)
        setAddVerifiedCustomer(null)
        setVerifiedCustomer(null)
    }

    const handleConfirmDelete = () => {
        // Remove from state
        const updatedVehicles = vehicles.filter(v => v.vehicleId !== deleteVehicle.vehicleId);
        setVehicles(updatedVehicles);
        
        // Remove from localStorage if it was a saved vehicle
        const savedVehicles = JSON.parse(localStorage.getItem('vehicleManagementVehicles') || '[]');
        const filteredSaved = savedVehicles.filter(v => v.vehicleId !== deleteVehicle.vehicleId);
        if (savedVehicles.length !== filteredSaved.length) {
            localStorage.setItem('vehicleManagementVehicles', JSON.stringify(filteredSaved));
        }
        
        alert(`Vehicle ${deleteVehicle.vehicleId} has been deleted successfully.`)
        setDeleteVehicle(null)
        if (detailsVehicle?.vehicleId === deleteVehicle?.vehicleId) {
            setDetailsVehicle(null)
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
                                                    <td>{vehicle.completedServices}</td>
                                                    <td>
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
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {activeDropdown && typeof document !== 'undefined' && createPortal(
                                    <div
                                        className="action-dropdown-menu show action-dropdown-menu-fixed"
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
                                        <button className="dropdown-item delete" onClick={() => {
                                            const vehicle = vehicles.find(v => v.vehicleId === activeDropdown)
                                            if (vehicle) {
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
                                                            <span className="count-badge">{detailsVehicle.customerDetails.completedServicesCount} services</span>
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
                                                        <span className="pim-info-value">{detailsVehicle.completedServices}</span>
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
                                                                        <td colSpan="7" style={{textAlign: 'center', padding: '40px'}}>
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
                                            maxLength="17"
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
            {deleteVehicle && (
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
                </div>
            )}
        </>
    )
}

export default VehicleManagement
