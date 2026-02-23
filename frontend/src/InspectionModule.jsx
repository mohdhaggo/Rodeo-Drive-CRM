import { useEffect, useMemo, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import inspectionListConfig from './inspectionConfig'
import { getStoredJobOrders } from './demoData'
import SuccessPopup from './SuccessPopup'
import PermissionGate from './PermissionGate'
import './InspectionModule.css'

const YOUR_PRODUCTS = [
  { name: "Extra Cool Tint", suvPrice: 3200, sedanPrice: 2900 },
  { name: "UV Protection Film", suvPrice: 2500, sedanPrice: 2200 },
  { name: "Cool Shade Tint", suvPrice: 1800, sedanPrice: 1500 },
  { name: "Smart Pro Protection", suvPrice: 17500, sedanPrice: 15500 },
  { name: "Full Body Protection", suvPrice: 5500, sedanPrice: 4400 },
  { name: "Quarter Panel Protection", suvPrice: 4300, sedanPrice: 3500 },
  { name: "Glass Protection (Light)", suvPrice: 400, sedanPrice: 400 },
  { name: "Extreme Glass Protection", suvPrice: 1200, sedanPrice: 1200 },
  { name: "City Glass Protection", suvPrice: 800, sedanPrice: 800 },
  { name: "Matte Protection", suvPrice: 18500, sedanPrice: 16500 },
  { name: "Color Change", suvPrice: 20500, sedanPrice: 18500 },
  { name: "Leather Protection", suvPrice: 1200, sedanPrice: 1200 },
  { name: "Wheel Protection", suvPrice: 600, sedanPrice: 600 },
  { name: "VIP Interior & Exterior Polish", suvPrice: 1650, sedanPrice: 1650 },
  { name: "Interior Polish", suvPrice: 850, sedanPrice: 850 },
  { name: "Exterior Polish", suvPrice: 800, sedanPrice: 800 },
  { name: "Nano Interior & Exterior Polish", suvPrice: 2200, sedanPrice: 2200 },
  { name: "Rear Bumper Protection", suvPrice: 2200, sedanPrice: 2200 },
  { name: "Fender Protection", suvPrice: 2000, sedanPrice: 2000 },
  { name: "Roof Protection", suvPrice: 2200, sedanPrice: 2200 },
  { name: "Single Door Protection", suvPrice: 400, sedanPrice: 400 },
  { name: "Front Bumper Protection", suvPrice: 1500, sedanPrice: 1500 },
  { name: "Mirror Protection (Each)", suvPrice: 150, sedanPrice: 150 },
  { name: "Front Fender Protection (Each)", suvPrice: 500, sedanPrice: 500 },
  { name: "Rear Fender for Pickups & Small Cars", suvPrice: 1700, sedanPrice: 1700 },
  { name: "Rear Fender Protection (Each)", suvPrice: 2800, sedanPrice: 2800 },
  { name: "Headlight Protection (Each)", suvPrice: 150, sedanPrice: 150 },
  { name: "Trunk Door Protection", suvPrice: 1000, sedanPrice: 1000 },
  { name: "Tire Base Protection (Each)", suvPrice: 400, sedanPrice: 400 },
  { name: "Pedal Protection (Each)", suvPrice: 400, sedanPrice: 400 }
]

const buildSectionState = (sectionConfig, sectionKey) => {
  const items = sectionConfig[sectionKey]?.groups
    ? sectionConfig[sectionKey].groups
    .flatMap((group) => group.items)
    .reduce((acc, item) => {
      acc[item.id] = { status: null, comment: '', photos: [] }
      return acc
    }, {})
    : {}

  return {
    started: false,
    completed: false,
    paused: false,
    notRequired: false,
    items
  }
}

const buildInitialInspectionState = (sectionConfig) => ({
  exterior: buildSectionState(sectionConfig, 'exterior'),
  interior: buildSectionState(sectionConfig, 'interior')
})

const defaultDetailData = {
  jobOrderId: 'JO-2026-176638',
  orderType: 'New Job Order',
  createDate: '2/10/2026, 9:06:33 AM',
  createdBy: 'System User',
  expectedDelivery: '2/13/2026, 9:06:33 AM',
  workStatus: 'New Request',
  paymentStatus: 'Unpaid',
  exitPermitStatus: 'Created',
  customerId: 'CUST-2023-001240',
  email: 'michael.chen@example.com',
  address: '123 Main St, Anytown',
  registeredVehicles: 1,
  completedServices: 0,
  customerSince: '6 Oct 2022',
  vehicleId: 'VEH-001245',
  vehicleModel: 'Toyota Camry 2022',
  year: '2022',
  type: 'Sedan',
  color: 'Black',
  vin: '1HGCM82633A123456',
  mileage: '24,580 miles',
  ownedBy: 'Michael Chen',
  registrationDate: 'N/A',
  serviceOrderReference: null,
  services: [
    'Annual Maintenance Service',
    'Brake Inspection & Service',
    'Air Conditioning Check'
  ],
  roadmap: [],
  customerNotes: null
}

const mapOrderToInspectionJob = (order) => ({
  id: order.id,
  createDate: order.jobOrderSummary?.createDate || order.createDate || 'Not specified',
  orderType: order.orderType || 'New Job Order',
  customerName: order.customerName,
  mobile: order.mobile,
  vehiclePlate: order.vehiclePlate || order.vehicleDetails?.plateNumber || 'Not specified',
  workStatus: order.workStatus || 'New Request',
  status: order.workStatus === 'New Request' ? 'New Job Order' : 'Inspection'
})

const filterInspectionOrders = (orders) =>
  orders.filter((order) => ['New Request', 'Inspection'].includes(order.workStatus))

function InspectionModule({ currentUser }) {
  const [inspectionConfig, setInspectionConfig] = useState(() => {
    const stored = localStorage.getItem('inspection_list_config')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return inspectionListConfig
      }
    }
    return inspectionListConfig
  })

  useEffect(() => {
    const handleConfigUpdate = () => {
      const stored = localStorage.getItem('inspection_list_config')
      if (!stored) {
        setInspectionConfig(inspectionListConfig)
        return
      }

      try {
        setInspectionConfig(JSON.parse(stored))
      } catch {
        setInspectionConfig(inspectionListConfig)
      }
    }

    window.addEventListener('inspection-config-updated', handleConfigUpdate)
    return () => window.removeEventListener('inspection-config-updated', handleConfigUpdate)
  }, [])

  const sectionConfig = useMemo(() => {
    const exterior = inspectionConfig.find(
      (category) => category.category === 'Exterior of the Vehicle'
    )
    const interior = inspectionConfig.find(
      (category) => category.category === 'Interior of the Vehicle'
    )

    return {
      exterior: {
        title: 'Exterior Inspection',
        groups:
          exterior?.sections.map((section) => ({
            title: section.name,
            items: section.items.map((item) => ({
              id: item.id,
              name: item.name,
              required: item.required
            }))
          })) || []
      },
      interior: {
        title: 'Interior Inspection',
        groups:
          interior?.sections.map((section) => ({
            title: section.name,
            items: section.items.map((item) => ({
              id: item.id,
              name: item.name,
              required: item.required
            }))
          })) || []
      }
    }
  }, [inspectionConfig])

  const [jobOrders, setJobOrders] = useState([])
  const [jobData, setJobData] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [activeJobId, setActiveJobId] = useState(null)
  const [detailData, setDetailData] = useState(defaultDetailData)
  const [inspectionState, setInspectionState] = useState(() =>
    buildInitialInspectionState(sectionConfig)
  )
  const [resumeAvailable, setResumeAvailable] = useState({ exterior: false, interior: false })
  const [expandedGroups, setExpandedGroups] = useState({})
  const [showPopup, setShowPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')
  const [showInspectionConfirmation, setShowInspectionConfirmation] = useState(false)
  const [inspectionConfirmAction, setInspectionConfirmAction] = useState(null)
  const [inspectionConfirmData, setInspectionConfirmData] = useState({
    title: '',
    message: '',
    onConfirm: null
  })
  const [screenState, setScreenState] = useState('main')
  const [currentAddServiceOrder, setCurrentAddServiceOrder] = useState(null)
  const [showAddServiceSuccessPopup, setShowAddServiceSuccessPopup] = useState(false)
  const [addServiceSuccessData, setAddServiceSuccessData] = useState({ orderId: '', invoiceId: '' })
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [cancelOrderId, setCancelOrderId] = useState(null)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [submittedOrderId, setSubmittedOrderId] = useState('')
  const [lastAction, setLastAction] = useState('cancel')
  const reportRef = useRef(null)

  // Initialize expanded groups based on sectionConfig
  useEffect(() => {
    const initialExpanded = {}
    Object.keys(sectionConfig).forEach((sectionKey) => {
      sectionConfig[sectionKey].groups.forEach((group) => {
        const groupKey = `${sectionKey}-${group.title}`
        initialExpanded[groupKey] = false
      })
    })
    setExpandedGroups(initialExpanded)
  }, [sectionConfig])

  const toggleGroupExpand = (sectionKey, groupTitle) => {
    const groupKey = `${sectionKey}-${groupTitle}`
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  useEffect(() => {
    setInspectionState(buildInitialInspectionState(sectionConfig))
    setResumeAvailable({ exterior: false, interior: false })
  }, [sectionConfig])

  useEffect(() => {
    const orders = getStoredJobOrders()
    const inspectionOrders = filterInspectionOrders(orders)
    setJobOrders(inspectionOrders)
    setJobData(inspectionOrders.map(mapOrderToInspectionJob))
    setFilteredJobs(inspectionOrders.map(mapOrderToInspectionJob))
    setCurrentPage(1)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  const activeJob = useMemo(
    () => jobData.find((job) => job.id === activeJobId) || null,
    [jobData, activeJobId]
  )

  const activeOrder = useMemo(
    () => jobOrders.find((order) => order.id === activeJobId) || null,
    [jobOrders, activeJobId]
  )

  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const resetInspectionState = () => {
    setInspectionState(buildInitialInspectionState(sectionConfig))
    setResumeAvailable({ exterior: false, interior: false })
  }

  const applySearch = () => {
    if (!searchQuery) {
      setFilteredJobs(jobData)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = jobData.filter((job) => {
      return (
        (job.id && job.id.toLowerCase().includes(query)) ||
        (job.createDate && job.createDate.toLowerCase().includes(query)) ||
        (job.orderType && job.orderType.toLowerCase().includes(query)) ||
        (job.customerName && job.customerName.toLowerCase().includes(query)) ||
        (job.mobile && job.mobile.toString().toLowerCase().includes(query)) ||
        (job.vehiclePlate && job.vehiclePlate.toLowerCase().includes(query)) ||
        (job.workStatus && job.workStatus.toLowerCase().includes(query))
      )
    })

    setFilteredJobs(filtered)
  }

  useEffect(() => {
    applySearch()
  }, [searchQuery, jobData])

  const handleShowCancelConfirmation = (orderId) => {
    setCancelOrderId(orderId)
    setShowCancelConfirmation(true)
    setActiveDropdown(null)
  }

  const handleOpenDropdown = (e, jobId) => {
    const isActive = activeDropdown === jobId
    if (isActive) {
      setActiveDropdown(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const menuHeight = 140
    const menuWidth = 200
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow < menuHeight ? rect.top - menuHeight - 6 : rect.bottom + 6
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8))
    setDropdownPosition({
      top,
      left
    })
    setActiveDropdown(jobId)
  }

  const handleCancelOrder = () => {
    if (!cancelOrderId) return

    // Find the order to cancel
    const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]')
    const orderToCancel = storedOrders.find(order => order.id === cancelOrderId)
    if (!orderToCancel) return

    // Check if order is already cancelled
    if (orderToCancel.workStatus === 'Cancelled') {
      alert(`Job Order ${cancelOrderId} is already cancelled.`)
      setShowCancelConfirmation(false)
      setCancelOrderId(null)
      return
    }

    // Create a cancelled version of the order
    const cancelledOrder = {
      ...orderToCancel,
      workStatus: 'Cancelled'
    }

    // Update the order status in jobOrders storage
    const updatedOrders = storedOrders.map(order =>
      order.id === cancelOrderId ? cancelledOrder : order
    )
    localStorage.setItem('jobOrders', JSON.stringify(updatedOrders))

    // Remove from current active orders display
    const inspectionOrders = filterInspectionOrders(updatedOrders)
    setJobOrders(inspectionOrders)
    setJobData(inspectionOrders.map(mapOrderToInspectionJob))
    setFilteredJobs(inspectionOrders.map(mapOrderToInspectionJob))

    setSubmittedOrderId(cancelOrderId)
    setLastAction('cancel')
    setShowSuccessPopup(true)
    setShowCancelConfirmation(false)
    setCancelOrderId(null)
  }

  const getSectionItems = (sectionKey) =>
    sectionConfig[sectionKey].groups.flatMap((group) => group.items)

  const getProgress = (sectionKey) => {
    const items = getSectionItems(sectionKey)
    const checked = items.filter(
      (item) => inspectionState[sectionKey].items[item.id]?.status
    ).length
    return Math.round((checked / items.length) * 100)
  }

  const isRequirementsMet = (sectionKey) => {
    const items = getSectionItems(sectionKey)
    return items.every((item) => {
      const status = inspectionState[sectionKey].items[item.id]?.status
      const comment = inspectionState[sectionKey].items[item.id]?.comment
      const photos = inspectionState[sectionKey].items[item.id]?.photos || []
      if (status === 'attention' || status === 'failed') {
        return comment && comment.trim().length > 0 && photos.length > 0
      }
      return !!status
    })
  }

  const canCompleteSection = (sectionKey) => {
    const items = getSectionItems(sectionKey)
    const allChecked = items.every(
      (item) => inspectionState[sectionKey].items[item.id]?.status
    )
    return allChecked && isRequirementsMet(sectionKey)
  }

  const updateItemStatus = (sectionKey, itemId, status) => {
    setInspectionState((prev) => {
      const updated = { ...prev }
      const section = { ...updated[sectionKey] }
      const items = { ...section.items }
      const item = { ...items[itemId], status }

      if (status === 'pass') {
        item.comment = ''
      }

      items[itemId] = item
      section.items = items
      updated[sectionKey] = section
      return updated
    })
  }

  const updateItemComment = (sectionKey, itemId, comment) => {
    setInspectionState((prev) => {
      const updated = { ...prev }
      const section = { ...updated[sectionKey] }
      const items = { ...section.items }
      items[itemId] = { ...items[itemId], comment }
      section.items = items
      updated[sectionKey] = section
      return updated
    })
  }

  const handlePhotoUpload = async (sectionKey, itemId, fileList) => {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith('image/'))
    if (files.length === 0) return

    const dataUrls = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = () => resolve(null)
            reader.readAsDataURL(file)
          })
      )
    )

    const safeUrls = dataUrls.filter(Boolean)
    if (safeUrls.length === 0) return

    setInspectionState((prev) => {
      const updated = { ...prev }
      const section = { ...updated[sectionKey] }
      const items = { ...section.items }
      const item = { ...items[itemId] }
      const existingPhotos = Array.isArray(item.photos) ? item.photos : []
      item.photos = [...existingPhotos, ...safeUrls]
      items[itemId] = item
      section.items = items
      updated[sectionKey] = section
      return updated
    })
  }

  const getInspectionStepStatusClass = (stepStatus) => {
    switch (stepStatus) {
      case 'Completed': return 'inspection-step-completed'
      case 'Active': return 'inspection-step-active'
      case 'InProgress': return 'inspection-step-active'
      case 'Pending': return 'inspection-step-pending'
      case 'Cancelled': return 'inspection-step-cancelled'
      case 'Upcoming': return 'inspection-step-upcoming'
      default: return 'inspection-step-upcoming'
    }
  }

  const getInspectionStepIcon = (stepStatus) => {
    switch (stepStatus) {
      case 'Completed': return 'fas fa-check-circle'
      case 'Active': return 'fas fa-play-circle'
      case 'InProgress': return 'fas fa-play-circle'
      case 'Pending': return 'fas fa-clock'
      case 'Cancelled': return 'fas fa-times-circle'
      case 'Upcoming': return 'fas fa-circle'
      default: return 'fas fa-circle'
    }
  }

  const getInspectionStatusClass = (status) => {
    switch (status) {
      case 'Completed': return 'inspection-status-completed'
      case 'InProgress': return 'inspection-status-inprogress'
      case 'Pending': return 'inspection-status-pending'
      case 'New': return 'inspection-status-new'
      default: return 'inspection-status-pending'
    }
  }

  const startInspection = (sectionKey) => {
    const saved = localStorage.getItem(`inspection_${sectionKey}_state`)
    if (saved) {
      const parsed = JSON.parse(saved)
      setInspectionState((prev) => ({
        ...prev,
        [sectionKey]: {
          ...parsed,
          started: true,
          paused: false
        }
      }))
    } else {
      setInspectionState((prev) => ({
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          started: true,
          paused: false
        }
      }))
    }

    // Update roadmap and work status
    updateRoadmapOnInspectionStart()
  }

  const updateRoadmapOnInspectionStart = () => {
    const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]')
    const updatedOrders = storedOrders.map((order) => {
      if (order.id === activeJobId && order.roadmap) {
        const updatedRoadmap = order.roadmap.map((step) => {
          if (step.step === 'New Order') {
            return {
              ...step,
              stepStatus: 'Completed',
              status: 'Completed',
              endTimestamp: new Date().toLocaleString(),
              actionBy: currentUser?.name || 'Inspector'
            }
          } else if (step.step === 'Inspection') {
            return {
              ...step,
              stepStatus: 'Active',
              status: 'InProgress',
              startTimestamp: new Date().toLocaleString(),
              actionBy: currentUser?.name || 'Inspector'
            }
          }
          return step
        })
        return {
          ...order,
          roadmap: updatedRoadmap,
          workStatus: 'Inspection'
        }
      }
      return order
    })
    localStorage.setItem('jobOrders', JSON.stringify(updatedOrders))
    
    // Update state to reflect changes
    const inspectionOrders = filterInspectionOrders(updatedOrders)
    setJobOrders(inspectionOrders)
    setJobData(inspectionOrders.map(mapOrderToInspectionJob))
  }

  const updateRoadmapOnInspectionFinish = () => {
    const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]')
    const updatedOrders = storedOrders.map((order) => {
      if (order.id === activeJobId && order.roadmap) {
        const updatedRoadmap = order.roadmap.map((step) => {
          if (step.step === 'Inspection') {
            return {
              ...step,
              stepStatus: 'Completed',
              status: 'Completed',
              endTimestamp: new Date().toLocaleString(),
              actionBy: currentUser?.name || 'Inspector'
            }
          } else if (step.step === 'Inprogress') {
            return {
              ...step,
              stepStatus: 'Active',
              status: 'InProgress',
              startTimestamp: new Date().toLocaleString(),
              actionBy: currentUser?.name || 'Inspector'
            }
          }
          return step
        })
        return {
          ...order,
          roadmap: updatedRoadmap,
          workStatus: 'Inprogress'
        }
      }
      return order
    })
    localStorage.setItem('jobOrders', JSON.stringify(updatedOrders))
    
    // Update state to reflect changes
    const inspectionOrders = filterInspectionOrders(updatedOrders)
    setJobOrders(inspectionOrders)
    setJobData(inspectionOrders.map(mapOrderToInspectionJob))
  }

  const saveAndPause = (sectionKey) => {
    setInspectionConfirmData({
      title: 'Save and Pause Inspection',
      message: `Save and pause ${sectionKey} inspection? You can resume later.`,
      onConfirm: () => {
        setInspectionState((prev) => {
          const updatedSection = {
            ...prev[sectionKey],
            paused: true
          }
          localStorage.setItem(
            `inspection_${sectionKey}_state`,
            JSON.stringify(updatedSection)
          )
          return { ...prev, [sectionKey]: updatedSection }
        })
        setResumeAvailable((prev) => ({ ...prev, [sectionKey]: true }))
        setPopupMessage(`${sectionKey} inspection saved and paused.`)
        setShowPopup(true)
        setShowInspectionConfirmation(false)
      }
    })
    setInspectionConfirmAction('pause')
    setShowInspectionConfirmation(true)
  }

  const resumeInspection = (sectionKey) => {
    const saved = localStorage.getItem(`inspection_${sectionKey}_state`)
    if (saved) {
      const parsed = JSON.parse(saved)
      setInspectionState((prev) => ({
        ...prev,
        [sectionKey]: {
          ...parsed,
          started: true,
          paused: false
        }
      }))
    } else {
      setInspectionState((prev) => ({
        ...prev,
        [sectionKey]: {
          ...prev[sectionKey],
          started: true,
          paused: false
        }
      }))
    }

    setPopupMessage(`${sectionKey} inspection resumed.`)
    setShowPopup(true)
  }

  const markNotRequired = (sectionKey) => {
    setInspectionConfirmData({
      title: 'Mark as Not Required',
      message: `Mark ${sectionKey} inspection as not required?`,
      onConfirm: () => {
        setInspectionState((prev) => ({
          ...prev,
          [sectionKey]: {
            ...prev[sectionKey],
            started: false,
            completed: true,
            paused: false,
            notRequired: true
          }
        }))
        setShowInspectionConfirmation(false)
      }
    })
    setInspectionConfirmAction('notRequired')
    setShowInspectionConfirmation(true)
  }

  const completeSection = (sectionKey) => {
    setInspectionConfirmData({
      title: 'Complete Inspection',
      message: `Complete ${sectionKey} inspection?`,
      onConfirm: () => {
        setInspectionState((prev) => ({
          ...prev,
          [sectionKey]: {
            ...prev[sectionKey],
            completed: true,
            started: false,
            paused: false
          }
        }))
        setPopupMessage(`${sectionKey} inspection completed successfully.`)
        setShowPopup(true)
        setShowInspectionConfirmation(false)
      }
    })
    setInspectionConfirmAction('complete')
    setShowInspectionConfirmation(true)
  }

  const checkSavedInspection = () => {
    const savedExterior = localStorage.getItem('inspection_exterior_state')
    const savedInterior = localStorage.getItem('inspection_interior_state')
    setResumeAvailable({ exterior: !!savedExterior, interior: !!savedInterior })
  }

  const viewDetails = (job) => {
    const order = jobOrders.find((item) => item.id === job.id)
    const orderSummary = order?.jobOrderSummary || {}
    const customerDetails = order?.customerDetails || {}
    const vehicleDetails = order?.vehicleDetails || {}
    const vehicleModel = vehicleDetails.make && vehicleDetails.model
      ? `${vehicleDetails.make} ${vehicleDetails.model} ${vehicleDetails.year || ''}`.trim()
      : defaultDetailData.vehicleModel

    setDetailData({
      jobOrderId: order?.id || job.id,
      orderType: order?.orderType || (job.status === 'New Job Order' ? 'New Job Order' : 'Service Order'),
      createDate: orderSummary.createDate || order?.createDate || defaultDetailData.createDate,
      createdBy: orderSummary.createdBy || defaultDetailData.createdBy,
      expectedDelivery: orderSummary.expectedDelivery || defaultDetailData.expectedDelivery,
      workStatus: order?.workStatus || (job.status === 'New Job Order' ? 'New Request' : 'Inspection'),
      paymentStatus: order?.paymentStatus || defaultDetailData.paymentStatus,
      exitPermitStatus: order?.exitPermitStatus || (order?.exitPermit ? 'Created' : defaultDetailData.exitPermitStatus),
      customerId: customerDetails.customerId || defaultDetailData.customerId,
      email: customerDetails.email || defaultDetailData.email,
      address: customerDetails.address || defaultDetailData.address,
      registeredVehicles: customerDetails.registeredVehiclesCount ?? defaultDetailData.registeredVehicles,
      completedServices: customerDetails.completedServicesCount ?? defaultDetailData.completedServices,
      customerSince: customerDetails.customerSince || defaultDetailData.customerSince,
      vehicleId: vehicleDetails.vehicleId || defaultDetailData.vehicleId,
      vehicleModel,
      year: vehicleDetails.year || defaultDetailData.year,
      type: vehicleDetails.type || defaultDetailData.type,
      color: vehicleDetails.color || defaultDetailData.color,
      vin: vehicleDetails.vin || defaultDetailData.vin,
      mileage: vehicleDetails.mileage || defaultDetailData.mileage,
      ownedBy: vehicleDetails.ownedBy || defaultDetailData.ownedBy,
      registrationDate: vehicleDetails.registrationDate || defaultDetailData.registrationDate,
      serviceOrderReference: order?.serviceOrderReference || defaultDetailData.serviceOrderReference,
      services: order?.services || defaultDetailData.services,
      roadmap: order?.roadmap || defaultDetailData.roadmap,
      customerNotes: order?.customerNotes || defaultDetailData.customerNotes
    })

    resetInspectionState()
    setActiveJobId(job.id)
    setScreenState('details')
    checkSavedInspection()
  }

  const closeDetailView = () => {
    setActiveJobId(null)
    setScreenState('main')
    resetInspectionState()
  }

  const canFinish =
    (inspectionState.exterior.completed || inspectionState.exterior.notRequired) &&
    (inspectionState.interior.completed || inspectionState.interior.notRequired)

  const parseAmount = (str) => {
    if (typeof str === 'number') return str
    if (!str) return 0
    return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0
  }

  const formatAmount = (num) => {
    if (typeof num === 'string') num = parseAmount(num)
    return `QAR ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const combinedServices = detailData.orderType === 'Service Order'
    ? [...(detailData.serviceOrderReference?.services || []), ...(detailData.services || [])]
    : (detailData.services || [])

  const handleAddService = () => {
    // Get order from localStorage to ensure we have the full order data
    const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]')
    const order = storedOrders.find(o => o.id === activeJobId)
    if (order) {
      setCurrentAddServiceOrder(order)
      setScreenState('addService')
    }
  }

  const handleAddServiceSubmit = ({ selectedServices, discountPercent }) => {
    if (!currentAddServiceOrder || !selectedServices || selectedServices.length === 0) {
      setScreenState('details')
      return
    }

    const now = new Date()
    const year = now.getFullYear()
    const invoiceNumber = `INV-${year}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`
    const billId = currentAddServiceOrder.billing?.billId || `BILL-${year}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`

    const subtotal = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0)
    const discount = (subtotal * (discountPercent || 0)) / 100
    const netAmount = subtotal - discount

    const existingTotal = parseAmount(currentAddServiceOrder.billing?.totalAmount)
    const existingDiscount = parseAmount(currentAddServiceOrder.billing?.discount)
    const existingNet = parseAmount(currentAddServiceOrder.billing?.netAmount)
    const existingPaid = parseAmount(currentAddServiceOrder.billing?.amountPaid)

    const updatedBilling = {
      billId,
      totalAmount: formatAmount(existingTotal + subtotal),
      discount: formatAmount(existingDiscount + discount),
      netAmount: formatAmount(existingNet + netAmount),
      amountPaid: formatAmount(existingPaid),
      balanceDue: formatAmount((existingNet + netAmount) - existingPaid),
      paymentMethod: currentAddServiceOrder.billing?.paymentMethod || null,
      invoices: [
        ...(currentAddServiceOrder.billing?.invoices || []),
        {
          number: invoiceNumber,
          amount: formatAmount(netAmount),
          discount: formatAmount(discount),
          status: 'Unpaid',
          paymentMethod: null,
          services: selectedServices.map(s => s.name)
        }
      ]
    }

    const newServiceEntries = selectedServices.map((service) => ({
      name: service.name,
      status: 'New',
      started: 'Not started',
      ended: 'Not completed',
      duration: 'Not started',
      technician: 'Not assigned',
      notes: 'Added from Inspection module'
    }))

    const updatedOrder = {
      ...currentAddServiceOrder,
      services: [...(currentAddServiceOrder.services || []), ...newServiceEntries],
      billing: updatedBilling
    }

    const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]')
    const updatedOrders = storedOrders.map((order) =>
      order.id === currentAddServiceOrder.id ? updatedOrder : order
    )

    localStorage.setItem('jobOrders', JSON.stringify(updatedOrders))
    const inspectionOrders = filterInspectionOrders(updatedOrders)
    setJobOrders(inspectionOrders)
    setJobData(inspectionOrders.map(mapOrderToInspectionJob))
    
    // Update detail data
    setDetailData(prev => ({
      ...prev,
      services: updatedOrder.services || []
    }))
    
    setAddServiceSuccessData({ orderId: currentAddServiceOrder.id, invoiceId: invoiceNumber })
    setShowAddServiceSuccessPopup(true)
    
    setTimeout(() => {
      setScreenState('details')
    }, 100)
  }

  const finishInspection = () => {
    setInspectionConfirmData({
      title: 'Finish Inspection',
      message: 'Finish the inspection? Status will change to Work in Progress.',
      onConfirm: async () => {
        const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]')
        const targetOrder = storedOrders.find((order) => order.id === activeJobId)
        const inspectionReport = await buildInspectionReportDocument({
          order: targetOrder,
          detailData,
          activeJob,
          inspectionState,
          sectionConfig
        })

        const updatedOrders = storedOrders.map((order) => {
          if (order.id !== activeJobId) return order
          const documents = Array.isArray(order.documents) ? order.documents : []
          const filteredDocuments = documents.filter((doc) => doc.type !== 'inspection-report')

          return {
            ...order,
            workStatus: 'Inprogress',
            documents: inspectionReport
              ? [...filteredDocuments, inspectionReport]
              : filteredDocuments
          }
        })
        localStorage.setItem('jobOrders', JSON.stringify(updatedOrders))

        const inspectionOrders = filterInspectionOrders(updatedOrders)
        setJobOrders(inspectionOrders)
        setJobData(inspectionOrders.map(mapOrderToInspectionJob))
        setFilteredJobs(inspectionOrders.map(mapOrderToInspectionJob))

        // Update roadmap with inspection end time and next step
        updateRoadmapOnInspectionFinish()

        localStorage.removeItem('inspection_exterior_state')
        localStorage.removeItem('inspection_interior_state')
        setPopupMessage('Inspection finished! Status changed to Work in Progress.')
        setShowPopup(true)
        closeDetailView()
        setShowInspectionConfirmation(false)
      }
    })
    setInspectionConfirmAction('finish')
    setShowInspectionConfirmation(true)
  }

  const formatServiceStatus = (status) => {
    switch (status) {
      case 'Completed': return 'pim-status-completed'
      case 'InProgress': return 'pim-status-inprogress'
      case 'In Progress': return 'pim-status-inprogress'
      case 'Pending Approval': return 'pim-status-pending-approval'
      case 'Paused': return 'pim-status-paused'
      case 'New': return 'pim-status-new'
      case 'Postponed': return 'pim-status-postponed'
      default: return 'pim-status-new'
    }
  }

  const generateStyledInspectionPdf = async (order, detailData, activeJob, inspectionState, sectionConfig) => {
    const orderId = order?.id || detailData?.jobOrderId || 'N/A'
    const statusLabels = { pass: 'Pass', attention: 'Attention', failed: 'Failed' }

    const reportStyles = `
      body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20mm; background: #f3f6fb; color: #2c3e50; }
      * { box-sizing: border-box; }
      @page { size: A4; margin: 0; }
      @media print { body { background: white; } }
      .report-header { text-align: center; margin-bottom: 28px; padding: 20px 10px; background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); color: white; border-radius: 12px; }
      .report-logo { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; margin: 0 auto 12px; display: block; border: 3px solid white; }
      .report-header h1 { margin: 0 0 6px 0; font-size: 28px; letter-spacing: 0.3px; }
      .report-header p { margin: 0; font-size: 13px; opacity: 0.9; }
      .report-card { background: white; padding: 20px; border-radius: 10px; margin-bottom: 18px; box-shadow: 0 6px 16px rgba(25, 42, 70, 0.08); border: 1px solid #e6ecf5; }
      .card-title { font-size: 17px; margin: 0 0 14px 0; padding-bottom: 10px; border-bottom: 2px solid #eef2f8; display: flex; align-items: center; gap: 8px; }
      .card-title.blue { color: #3498db; }
      .card-title.green { color: #27ae60; }
      .card-title.red { color: #e74c3c; }
      .card-title.orange { color: #f39c12; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 18px; font-size: 13px; }
      .label { font-weight: 600; color: #2c3e50; display: block; margin-bottom: 4px; }
      .value { color: #5a6b7d; }
      .section-title { color: #2c3e50; margin: 14px 0 8px 0; font-size: 15px; }
      .group-title { color: #5a6b7d; margin: 10px 0 6px 10px; font-size: 13px; font-weight: 600; }
      .item-row { margin: 0 0 8px 18px; font-size: 12.5px; }
      .status-pill { display: inline-block; padding: 3px 8px; border-radius: 12px; font-weight: 600; font-size: 11.5px; margin-left: 6px; }
      .status-pass { background: #e8f5e9; color: #1e8449; }
      .status-attention { background: #fff3cd; color: #b36b00; }
      .status-failed { background: #fdeaea; color: #c0392b; }
      .status-na { background: #ecf0f1; color: #7f8c8d; }
      .comment { color: #7f8c8d; font-style: italic; margin-left: 6px; }
      .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 8px 0 12px 18px; }
      .photo-grid img { width: 100%; height: 90px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; }
    `

    const headerHtml = `
      <div class="report-header">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPoCJV5AIkhwzaOSgnWDVpRIZITDAkRDsf5A&s" alt="Logo" class="report-logo" />
        <h1>Inspection Result Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    `

    const orderSummaryHtml = `
      <div class="report-card">
        <h2 class="card-title blue">📋 Order Summary</h2>
        <div class="info-grid">
          <div><span class="label">Job Order ID</span><span class="value">${orderId}</span></div>
          <div><span class="label">Request Date</span><span class="value">${detailData?.createDate || 'N/A'}</span></div>
          <div><span class="label">Created By</span><span class="value">${detailData?.createdBy || 'N/A'}</span></div>
          <div><span class="label">Expected Delivery</span><span class="value">${detailData?.expectedDelivery || 'N/A'}</span></div>
        </div>
      </div>
    `

    const customerInfoHtml = `
      <div class="report-card">
        <h2 class="card-title green">👤 Customer Information</h2>
        <div class="info-grid">
          <div><span class="label">Name</span><span class="value">${activeJob?.customerName || 'N/A'}</span></div>
          <div><span class="label">Mobile</span><span class="value">${activeJob?.mobile || 'N/A'}</span></div>
          <div><span class="label">Email</span><span class="value">${detailData?.email || 'N/A'}</span></div>
          <div><span class="label">Address</span><span class="value">${detailData?.address || 'N/A'}</span></div>
        </div>
      </div>
    `

    const vehicleInfoHtml = `
      <div class="report-card">
        <h2 class="card-title red">🚗 Vehicle Information</h2>
        <div class="info-grid">
          <div><span class="label">Make & Model</span><span class="value">${detailData?.vehicleModel || 'N/A'}</span></div>
          <div><span class="label">Year</span><span class="value">${detailData?.year || 'N/A'}</span></div>
          <div><span class="label">Type</span><span class="value">${detailData?.type || 'N/A'}</span></div>
          <div><span class="label">Color</span><span class="value">${detailData?.color || 'N/A'}</span></div>
          <div><span class="label">License Plate</span><span class="value">${activeJob?.vehiclePlate || 'N/A'}</span></div>
          <div><span class="label">VIN</span><span class="value">${detailData?.vin || 'N/A'}</span></div>
        </div>
      </div>
    `

    let inspectionResultsHtml = `
      <div class="report-card">
        <h2 class="card-title orange">✓ Inspection Results</h2>
    `

    ;['exterior', 'interior'].forEach((sectionKey) => {
      const section = sectionConfig?.[sectionKey]
      if (!section) return
      inspectionResultsHtml += `<div class="section-title">${section.title}</div>`
      section.groups.forEach((group) => {
        inspectionResultsHtml += `<div class="group-title">${group.title}</div>`
        inspectionResultsHtml += `<div>`
        group.items.forEach((item) => {
          const itemState = inspectionState?.[sectionKey]?.items?.[item.id]
          const status = itemState?.status || 'not-checked'
          const statusLabel = statusLabels[status] || 'Not Checked'
          let statusColor = '#95a5a6'
          if (status === 'pass') statusColor = '#27ae60'
          if (status === 'failed') statusColor = '#e74c3c'
          if (status === 'attention') statusColor = '#f39c12'
          const comment = itemState?.comment?.trim()
          const commentText = comment ? ` (${comment})` : ''
          const photos = Array.isArray(itemState?.photos) ? itemState.photos : []
          const photoHtml = photos.length
            ? `
              <div class="photo-grid">
                ${photos.map((photo) => `<img src="${photo}" alt="Inspection photo" />`).join('')}
              </div>
            `
            : ''
          const statusClass = status === 'pass'
            ? 'status-pass'
            : status === 'attention'
              ? 'status-attention'
              : status === 'failed'
                ? 'status-failed'
                : 'status-na'
          inspectionResultsHtml += `
            <div class="item-row">
              ${item.name}:
              <span class="status-pill ${statusClass}" style="color: ${statusColor};">${statusLabel}</span>
              ${commentText ? `<span class="comment">${commentText}</span>` : ''}
            </div>
            ${photoHtml}
          `
        })
        inspectionResultsHtml += `</div>`
      })
    })
    inspectionResultsHtml += `</div>`

    const fullHtml = headerHtml + orderSummaryHtml + customerInfoHtml + vehicleInfoHtml + inspectionResultsHtml

    // Create a data URL for an HTML document that can be printed as PDF
    const htmlDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Inspection_Result_${orderId}.html</title>
        <style>${reportStyles}</style>
      </head>
      <body>
        ${fullHtml}
      </body>
      </html>
    `

    const encoded = btoa(unescape(encodeURIComponent(htmlDoc)))
    return `data:text/html;base64,${encoded}`
  }

  const buildInspectionReportDocument = async ({ order, detailData, activeJob, inspectionState, sectionConfig }) => {
    if (!order) return null

    const dataUrl = await generateStyledInspectionPdf(order, detailData, activeJob, inspectionState, sectionConfig)
    const createdAt = new Date().toLocaleString()

    return {
      id: `inspection-report-${order.id}`,
      name: `Inspection Result ${order.id}.html`,
      type: 'inspection-report',
      createdAt,
      url: dataUrl
    }
  }

  return (
    <div className="inspection-module">
      {screenState === 'main' && !activeJobId ? (
        <div className="app-container">
          <header className="app-header">
            <div className="header-left">
              <h1><i className="fas fa-car"></i> Inspection Module</h1>
            </div>
          </header>

          <main className="main-content">
            <section className="search-section">
              <div className="search-container">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  className="smart-search-input"
                  placeholder="Search by any details"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="search-stats">
                {filteredJobs.length === 0
                  ? 'No jobs found'
                  : `Showing ${Math.min((currentPage - 1) * pageSize + 1, filteredJobs.length)}-${Math.min(currentPage * pageSize, filteredJobs.length)} of ${filteredJobs.length} inspection jobs`}
              </div>
            </section>

            <section className="results-section">
              <div className="section-header">
                <h2><i className="fas fa-list"></i> Inspection Jobs Records</h2>
                <div className="pagination-controls">
                  <div className="records-per-page">
                    <label htmlFor="inspectionPageSize">Records per page:</label>
                    <select
                      id="inspectionPageSize"
                      className="page-size-select"
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(parseInt(event.target.value, 10))
                        setCurrentPage(1)
                      }}
                    >
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredJobs.length > 0 ? (
                <div className="table-wrapper">
                  <table className="job-order-table">
                  <thead>
                    <tr>
                      <th>Create Date</th>
                      <th>Job Card ID</th>
                      <th>Order Type</th>
                      <th>Customer Name</th>
                      <th>Mobile Number</th>
                      <th>Vehicle Plate</th>
                      <th>Work Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedJobs.map((job) => (
                      <tr key={job.id}>
                        <td className="date-column">{job.createDate}</td>
                        <td>{job.id}</td>
                        <td>
                          <span
                            className={`order-type-badge ${
                              job.orderType === 'New Job Order'
                                ? 'order-type-new-job'
                                : 'order-type-service'
                            }`}
                          >
                            {job.orderType}
                          </span>
                        </td>
                        <td>{job.customerName}</td>
                        <td>{job.mobile}</td>
                        <td>{job.vehiclePlate}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              job.workStatus === 'New Request' ? 'status-new-request' : 'status-inspection'
                            }`}
                          >
                            {job.workStatus}
                          </span>
                        </td>
                        <td>
                          <PermissionGate moduleId="inspection" optionId="inspection_actions">
                            <div className="action-dropdown-container">
                              <button
                                className={`btn-action-dropdown ${activeDropdown === job.id ? 'active' : ''}`}
                                onClick={(e) => handleOpenDropdown(e, job.id)}
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
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
                  <p><i className="fas fa-inbox" style={{ fontSize: '36px', marginBottom: '10px' }}></i></p>
                  <p>No inspection jobs found</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = index + 1
                    } else {
                      const start = Math.max(1, currentPage - 2)
                      const end = Math.min(totalPages, start + 4)
                      const adjustedStart = Math.max(1, end - 4)
                      pageNum = adjustedStart + index
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </section>
        </main>

        {/* Footer */}
        <div className="inspection-footer">
          <p>Service Management System &copy; 2023 | Inspection Module</p>
        </div>
      </div>
      ) : screenState === 'addService' && currentAddServiceOrder ? (
        <AddServiceScreen
          order={currentAddServiceOrder}
          products={YOUR_PRODUCTS}
          onClose={() => setScreenState('details')}
          onSubmit={handleAddServiceSubmit}
        />
      ) : screenState === 'details' && activeJobId ? (
        <div className="detail-view" id="detailView">
          <div className="detail-header">
            <div className="detail-title-container">
              <h2>
                <i className="fas fa-clipboard-list"></i> Inspection Details - Job Order #<span id="detailJobIdHeader">{detailData.jobOrderId}</span>
              </h2>
            </div>
            <button className="close-detail" onClick={() => { closeDetailView(); setScreenState('main'); }}>
              <i className="fas fa-times"></i> Close Details
            </button>
          </div>

          <div className="detail-container">
            <div className="detail-cards">
              <PermissionGate moduleId="inspection" optionId="inspection_summary">
                <div className="epm-detail-card">
                  <h3><i className="fas fa-info-circle"></i> Job Order Summary</h3>
                  <div className="epm-card-content">
                  <div className="epm-info-item">
                    <span className="epm-info-label">Job Order ID</span>
                    <span className="epm-info-value">{detailData.jobOrderId}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Order Type</span>
                    <span className="epm-info-value"><span className={`epm-order-type-badge ${detailData.orderType === 'New Job Order' ? 'epm-order-type-new-job' : 'epm-order-type-service'}`}>{detailData.orderType}</span></span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Request Create Date</span>
                    <span className="epm-info-value">{detailData.createDate}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Created By</span>
                    <span className="epm-info-value">{detailData.createdBy || 'Not specified'}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Expected Delivery Date</span>
                    <span className="epm-info-value">{detailData.expectedDelivery || 'Not specified'}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Work Status</span>
                    <span className="epm-info-value"><span className={`epm-status-badge ${getWorkStatusClass(detailData.workStatus)}`}>{detailData.workStatus}</span></span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Payment Status</span>
                    <span className="epm-info-value"><span className={`epm-status-badge ${getPaymentStatusClass(detailData.paymentStatus)}`}>{detailData.paymentStatus}</span></span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Exit Permit Status</span>
                    <span className="epm-info-value"><span className={`epm-status-badge ${detailData.exitPermitStatus === 'Created' ? 'epm-payment-full' : 'epm-payment-unpaid'}`}>{detailData.exitPermitStatus || 'Not Created'}</span></span>
                  </div>
                  </div>
                </div>
              </PermissionGate>

              {/* Roadmap Section */}
              {detailData.roadmap && detailData.roadmap.length > 0 && (
                <PermissionGate moduleId="inspection" optionId="inspection_roadmap">
                  <div className="epm-detail-card">
                    <h3><i className="fas fa-map-signs"></i> Job Order Roadmap</h3>
                    <div className="inspection-roadmap-container">
                      <div className="inspection-roadmap-steps">
                        {detailData.roadmap.map((step, idx) => (
                          <div key={idx} className={`inspection-roadmap-step ${getInspectionStepStatusClass(step.stepStatus)}`}>
                            <div className="inspection-step-icon">
                              <i className={getInspectionStepIcon(step.stepStatus)}></i>
                            </div>
                            <div className="inspection-step-content">
                              <div className="inspection-step-header">
                                <div className="inspection-step-name">{step.step}</div>
                                <span className={`inspection-status-badge-roadmap ${getInspectionStatusClass(step.status)}`}>{step.status}</span>
                              </div>
                              <div className="inspection-step-details">
                                <div className="inspection-step-detail">
                                  <span className="inspection-detail-label">Started</span>
                                  <span className="inspection-detail-value">{step.startTimestamp || 'Not started'}</span>
                                </div>
                                <div className="inspection-step-detail">
                                  <span className="inspection-detail-label">Ended</span>
                                  <span className="inspection-detail-value">{step.endTimestamp || 'Not completed'}</span>
                                </div>
                                <div className="inspection-step-detail">
                                  <span className="inspection-detail-label">Action By</span>
                                  <span className="inspection-detail-value">{step.actionBy || 'Not assigned'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </PermissionGate>
              )}

              <PermissionGate moduleId="inspection" optionId="inspection_customer">
                <div className="epm-detail-card">
                  <h3><i className="fas fa-user"></i> Customer Information</h3>
                  <div className="epm-card-content">
                  <div className="epm-info-item">
                    <span className="epm-info-label">Customer ID</span>
                    <span className="epm-info-value">{detailData.customerId}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Customer Name</span>
                    <span className="epm-info-value">{activeJob.customerName}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Mobile Number</span>
                    <span className="epm-info-value">{activeJob.mobile}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Email Address</span>
                    <span className="epm-info-value">{detailData.email}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Home Address</span>
                    <span className="epm-info-value">{detailData.address}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Registered Vehicles</span>
                    <span className="epm-info-value"><span className="count-badge">{detailData.registeredVehicles} {detailData.registeredVehicles === 1 ? 'vehicle' : 'vehicles'}</span></span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Completed Services</span>
                    <span className="epm-info-value"><span className="count-badge">{detailData.completedServices} {detailData.completedServices === 1 ? 'service' : 'services'}</span></span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Customer Since</span>
                    <span className="epm-info-value">{detailData.customerSince}</span>
                  </div>
                  </div>
                </div>
              </PermissionGate>

              <PermissionGate moduleId="inspection" optionId="inspection_vehicle">
                <div className="epm-detail-card">
                  <h3><i className="fas fa-car"></i> Vehicle Information</h3>
                  <div className="epm-card-content">
                  <div className="epm-info-item">
                    <span className="epm-info-label">Vehicle Unique ID</span>
                    <span className="epm-info-value">{detailData.vehicleId || 'N/A'}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Owned By</span>
                    <span className="epm-info-value">{detailData.ownedBy || 'N/A'}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Make</span>
                    <span className="epm-info-value">{detailData.make || detailData.vehicleModel?.split(' ')[0] || 'N/A'}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Model</span>
                    <span className="epm-info-value">{detailData.model || detailData.vehicleModel?.split(' ').slice(1).join(' ') || 'N/A'}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Year</span>
                    <span className="epm-info-value">{detailData.year || 'N/A'}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Vehicle Type</span>
                    <span className="epm-info-value">{detailData.type || 'N/A'}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Color</span>
                    <span className="epm-info-value">{detailData.color || 'N/A'}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Plate Number</span>
                    <span className="epm-info-value">{activeJob?.vehiclePlate || 'N/A'}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">VIN</span>
                    <span className="epm-info-value">{detailData.vin || 'N/A'}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Registration Date</span>
                    <span className="epm-info-value">{detailData.registrationDate || 'N/A'}</span>
                  </div>
                  </div>
                </div>
              </PermissionGate>

              <PermissionGate moduleId="inspection" optionId="inspection_services">
                <div className="epm-detail-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}><i className="fas fa-tasks"></i> Services Summary</h3>
                    <PermissionGate moduleId="inspection" optionId="inspection_addservice">
                      <button className="btn-add-service" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={handleAddService}>
                        <i className="fas fa-plus-circle"></i> Add Service
                      </button>
                    </PermissionGate>
                  </div>
                  <div className="pim-services-list">
                  {combinedServices.length > 0 ? (
                    combinedServices.map((service, idx) => (
                      <div key={idx} className="pim-service-item">
                        <div className="pim-service-header">
                          <span className="pim-service-name">{typeof service === 'string' ? service : service.name}</span>
                          <span className={`pim-status-badge ${formatServiceStatus(typeof service === 'string' ? 'New' : service.status)}`}>
                            {typeof service === 'string' ? 'New' : service.status}
                          </span>
                        </div>
                        <div className="pim-service-timeline">
                          <div className="pim-timeline-item">
                            <i className="fas fa-play-circle"></i>
                            <span className="pim-timeline-label">Started:</span>
                            <span className="pim-timeline-value">{typeof service === 'string' ? 'Not started' : (service.started || 'Not started')}</span>
                          </div>
                          <div className="pim-timeline-item">
                            <i className="fas fa-flag-checkered"></i>
                            <span className="pim-timeline-label">Ended:</span>
                            <span className="pim-timeline-value">{typeof service === 'string' ? 'Not completed' : (service.ended || 'Not completed')}</span>
                          </div>
                          <div className="pim-timeline-item">
                            <i className="fas fa-clock"></i>
                            <span className="pim-timeline-label">Duration:</span>
                            <span className="pim-timeline-value">{typeof service === 'string' ? 'N/A' : (service.duration || 'N/A')}</span>
                          </div>
                          <div className="pim-timeline-item">
                            <i className="fas fa-user-cog"></i>
                            <span className="pim-timeline-label">Technician:</span>
                            <span className="pim-timeline-value">{typeof service === 'string' ? 'Not assigned' : (service.technician || 'Not assigned')}</span>
                          </div>
                        </div>
                        {typeof service !== 'string' && service.notes && (
                          <div className="pim-service-notes">
                            <span className="pim-notes-label">Notes:</span>
                            <span className="pim-notes-value">{service.notes}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      No services added yet
                    </div>
                  )}
                  </div>
                </div>
              </PermissionGate>
            </div>

            {/* Customer Notes Card */}
            {detailData.customerNotes && (
              <PermissionGate moduleId="inspection" optionId="inspection_notes">
                <div className="epm-detail-card" style={{ backgroundColor: '#fffbea', borderLeft: '4px solid #f59e0b', marginBottom: '20px' }}>
                  <h3><i className="fas fa-comment-dots"></i> Customer Notes</h3>
                  <div style={{ padding: '15px 20px', whiteSpace: 'pre-wrap', color: '#78350f', fontSize: '14px', lineHeight: '1.6' }}>
                    {detailData.customerNotes}
                  </div>
                </div>
              </PermissionGate>
            )}

            <PermissionGate moduleId="inspection" optionId="inspection_list">
              <div className="epm-detail-card inspection-list-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #f5f5f5' }}>
                  <h3 style={{ margin: 0, flex: 1 }}><i className="fas fa-clipboard-check"></i> Inspection List</h3>
                  <PermissionGate moduleId="inspection" optionId="inspection_finish">
                    <button className="finish-btn" disabled={!canFinish} onClick={finishInspection} style={{ marginLeft: '20px' }}>
                      <i className="fas fa-flag-checkered"></i> Finish Inspection
                    </button>
                  </PermissionGate>
                </div>
                <div className="inspection-section">
                {(['exterior', 'interior']).map((sectionKey) => {
                const sectionState = inspectionState[sectionKey]
                const progress = getProgress(sectionKey)
                const progressText = `${progress}%`
                const isPaused = sectionState.paused
                const isCompleted = sectionState.completed
                const isNotRequired = sectionState.notRequired
                const isStarted = sectionState.started
                const canComplete = canCompleteSection(sectionKey)
                const startLabel = resumeAvailable[sectionKey]
                  ? 'Continue Inspection'
                  : 'Start Inspection'

                return (
                  <div className="inspection-card" key={sectionKey}>
                    <div className="inspection-header">
                      <div className="header-title-section">
                        <h3 style={{ margin: 0 }}>
                          {sectionConfig[sectionKey].title}
                          {!isCompleted && !isNotRequired && isStarted && !isPaused && (
                            <span className="status-indicator status-active">
                              <i className="fas fa-spinner fa-spin"></i> In Progress
                            </span>
                          )}
                          {isPaused && (
                            <span className="status-indicator status-paused">
                              <i className="fas fa-pause"></i> Paused
                            </span>
                          )}
                          {isCompleted && (
                            <span className="status-indicator status-active">
                              <i className="fas fa-check"></i> Completed
                            </span>
                          )}
                        </h3>
                      </div>
                      <div className="inspection-actions">
                        {!isCompleted && !isNotRequired && (
                          <PermissionGate moduleId="inspection" optionId="inspection_start">
                            <button
                              className="inspection-btn btn-start"
                              onClick={() => startInspection(sectionKey)}
                              style={{ display: isStarted ? 'none' : 'flex' }}
                            >
                              <i className="fas fa-play"></i> {startLabel}
                            </button>
                          </PermissionGate>
                        )}
                        {!isCompleted && !isNotRequired && (
                          <button
                            className="inspection-btn btn-save"
                            onClick={() => saveAndPause(sectionKey)}
                            style={{ display: isStarted && !isPaused ? 'flex' : 'none' }}
                          >
                            <i className="fas fa-save"></i> Save & Pause
                          </button>
                        )}
                        {!isCompleted && !isNotRequired && (
                          <PermissionGate moduleId="inspection" optionId="inspection_resume">
                            <button
                              className="inspection-btn btn-resume"
                              onClick={() => resumeInspection(sectionKey)}
                              disabled={!resumeAvailable[sectionKey]}
                            >
                              <i className="fas fa-play-circle"></i> Resume
                            </button>
                          </PermissionGate>
                        )}
                        {!isCompleted && !isNotRequired && (
                          <PermissionGate moduleId="inspection" optionId="inspection_complete">
                            <button
                              className="inspection-btn btn-complete"
                              onClick={() => completeSection(sectionKey)}
                              disabled={!canComplete}
                            >
                              <i className="fas fa-check-circle"></i> Complete Inspection
                            </button>
                          </PermissionGate>
                        )}
                        {!isCompleted && !isNotRequired && (
                          <PermissionGate moduleId="inspection" optionId="inspection_notrequired">
                            <button
                              className="inspection-btn btn-not-required"
                              onClick={() => markNotRequired(sectionKey)}
                            >
                              <i className="fas fa-ban"></i> Not Required
                            </button>
                          </PermissionGate>
                        )}
                      </div>
                    </div>

                    {isStarted && !isNotRequired && (
                      <div className="inspection-progress">
                        <div>Progress: <span>{progressText}</span></div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: progressText }}></div>
                        </div>
                      </div>
                    )}

                    {isStarted && !isNotRequired && (
                      <div className="vehicle-sides">
                        {sectionConfig[sectionKey].groups.map((group) => {
                          const groupKey = `${sectionKey}-${group.title}`
                          const isGroupExpanded = expandedGroups[groupKey] !== false
                          return (
                            <div className="side-section" key={group.title}>
                              <div className="side-title">
                                <button 
                                  className="group-toggle-btn"
                                  onClick={() => toggleGroupExpand(sectionKey, group.title)}
                                  title={isGroupExpanded ? "Collapse" : "Expand"}
                                >
                                  <i className={`fas fa-chevron-${isGroupExpanded ? 'down' : 'right'}`}></i>
                                </button>
                                <span>{group.title}</span>
                              </div>
                              {isGroupExpanded && (
                                <div className="section-items-row">
                                  {group.items.map((item) => {
                                    const itemState = sectionState.items[item.id]
                                    const showComments =
                                      itemState?.status === 'attention' || itemState?.status === 'failed'
                                    return (
                                      <div key={item.id} className="inspection-item-wrapper">
                                        <div className="inspection-item">
                                          <div className="item-name">{item.name}</div>
                                          <div className="checkbox-group">
                                            <label className="checkbox-option">
                                              <input
                                                type="radio"
                                                name={`${sectionKey}-${item.id}`}
                                                value="pass"
                                                checked={itemState?.status === 'pass'}
                                                onChange={() =>
                                                  updateItemStatus(sectionKey, item.id, 'pass')
                                                }
                                              />
                                              <span className="status-label green">Pass</span>
                                            </label>
                                            <label className="checkbox-option">
                                              <input
                                                type="radio"
                                                name={`${sectionKey}-${item.id}`}
                                                value="attention"
                                                checked={itemState?.status === 'attention'}
                                                onChange={() =>
                                                  updateItemStatus(sectionKey, item.id, 'attention')
                                                }
                                              />
                                              <span className="status-label amber">Attention</span>
                                            </label>
                                            <label className="checkbox-option">
                                              <input
                                                type="radio"
                                                name={`${sectionKey}-${item.id}`}
                                                value="failed"
                                                checked={itemState?.status === 'failed'}
                                                onChange={() =>
                                                  updateItemStatus(sectionKey, item.id, 'failed')
                                                }
                                              />
                                              <span className="status-label red">Failed</span>
                                            </label>
                                          </div>
                                        </div>
                                        {showComments && (
                                          <div className="comment-section">
                                            <textarea
                                              placeholder="Add comments..."
                                              value={itemState?.comment}
                                              onChange={(event) =>
                                                updateItemComment(sectionKey, item.id, event.target.value)
                                              }
                                            ></textarea>
                                            <div className="photo-upload">
                                              <input
                                                id={`${sectionKey}-${item.id}-photo`}
                                                className="photo-input"
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={(event) => {
                                                  handlePhotoUpload(sectionKey, item.id, event.target.files)
                                                  event.target.value = ''
                                                }}
                                              />
                                              <button
                                                type="button"
                                                className="photo-btn"
                                                onClick={() =>
                                                  document.getElementById(`${sectionKey}-${item.id}-photo`)?.click()
                                                }
                                              >
                                                <i className="fas fa-camera"></i> Upload/Take Photo
                                              </button>
                                              <span className="photo-requirement">
                                                * Required for Amber/Red status
                                              </span>
                                            </div>
                                            {Array.isArray(itemState?.photos) && itemState.photos.length > 0 && (
                                              <div className="photo-preview">
                                                {itemState.photos.map((photo, index) => (
                                                  <div key={`${item.id}-photo-${index}`} className="photo-preview-item">
                                                    <img src={photo} alt={`Inspection ${item.name}`} />
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
                </div>
              </div>
            </PermissionGate>

            {/* Quality Check List Card */}
            <PermissionGate moduleId="inspection" optionId="inspection_quality">
              <div className="epm-detail-card" style={{ backgroundColor: '#e8f4f1', borderLeft: '4px solid #16a085', marginTop: '25px' }}>
                <h3><i className="fas fa-clipboard-check"></i> Quality Check List</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {combinedServices.length > 0 ? (
                    combinedServices.map((service, idx) => {
                      const serviceName = typeof service === 'string' ? service : service.name;
                      const result = (typeof service === 'object' && (service.qualityCheckResult || service.qcResult || service.qcStatus)) || 'Not Evaluated';
                      const isPass = result === 'Pass';
                      const isFailed = result === 'Failed';
                      const isAcceptable = result === 'Acceptable';

                      return (
                        <div
                          key={`${serviceName}-${idx}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 12px',
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb',
                            gap: '12px'
                          }}
                        >
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', flex: 1 }}>
                            {serviceName}
                          </span>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              whiteSpace: 'nowrap',
                              ...(isPass && { backgroundColor: '#d1fae5', color: '#065f46' }),
                              ...(isFailed && { backgroundColor: '#fee2e2', color: '#991b1b' }),
                              ...(isAcceptable && { backgroundColor: '#fef3c7', color: '#92400e' }),
                              ...(!isPass && !isFailed && !isAcceptable && { backgroundColor: '#e5e7eb', color: '#374151' })
                            }}
                          >
                            {result}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
                      No services to evaluate
                    </div>
                  )}
                </div>
              </div>
            </PermissionGate>

            {/* Billing & Invoices Card */}
            {activeOrder?.billing && (
              <PermissionGate moduleId="inspection" optionId="inspection_billing">
                <div className="epm-detail-card" style={{ marginTop: '25px' }}>
                  <h3><i className="fas fa-receipt"></i> Billing & Invoices</h3>
                
                {/* Master Billing Information */}
                <div className="epm-billing-master-section" style={{ 
                  backgroundColor: '#f0f9ff', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  marginBottom: '25px',
                  border: '1px solid #bae6fd'
                }}>
                  <div className="epm-card-content">
                    <div className="epm-info-item">
                      <span className="epm-info-label"><i className="fas fa-barcode"></i> Master Bill ID</span>
                      <span className="epm-info-value" style={{ color: '#0369a1', fontWeight: '600', fontSize: '17px' }}>
                        {activeOrder.billing?.billId || 'N/A'}
                      </span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label"><i className="fas fa-calculator"></i> Total Bill Amount</span>
                      <span className="epm-info-value" style={{ fontSize: '17px' }}>{activeOrder.billing?.totalAmount || 'N/A'}</span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label"><i className="fas fa-tag"></i> Total Discount</span>
                      <span className="epm-info-value" style={{ color: '#27ae60', fontSize: '17px' }}>{activeOrder.billing?.discount || 'N/A'}</span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label"><i className="fas fa-money-bill-wave"></i> Net Amount</span>
                      <span className="epm-info-value" style={{ fontSize: '18px', fontWeight: '700', color: '#1e40af' }}>
                        {activeOrder.billing?.netAmount || 'N/A'}
                      </span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label"><i className="fas fa-check-circle"></i> Amount Paid</span>
                      <span className="epm-info-value" style={{ color: '#27ae60', fontSize: '17px' }}>{activeOrder.billing?.amountPaid || 'N/A'}</span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label"><i className="fas fa-exclamation-circle"></i> Balance Due</span>
                      <span className="epm-info-value" style={{ color: '#dc2626', fontSize: '17px', fontWeight: '600' }}>
                        {activeOrder.billing?.balanceDue || 'N/A'}
                      </span>
                    </div>
                  </div>
                  {activeOrder.billing?.paymentMethod && (
                    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #bae6fd' }}>
                      <div className="epm-info-item">
                        <span className="epm-info-label">Payment Method</span>
                        <span className="epm-info-value">
                          <span className={`epm-payment-method-badge ${getPaymentMethodClass(activeOrder.billing.paymentMethod)}`}>
                            {activeOrder.billing.paymentMethod}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Invoices Section */}
                {activeOrder.billing?.invoices && activeOrder.billing.invoices.length > 0 && (
                  <div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#334155', 
                      marginBottom: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <i className="fas fa-file-invoice" style={{ color: '#3b82f6' }}></i>
                      Invoice Details ({activeOrder.billing.invoices.length})
                    </div>
                    {activeOrder.billing.invoices.map((invoice, idx) => (
                      <div key={idx} className="epm-invoice-item" style={{ 
                        background: 'linear-gradient(to right, #ffffff, #fafbfc)',
                        border: '1px solid #e2e8f0',
                        borderLeft: '4px solid #3b82f6'
                      }}>
                        <div className="epm-invoice-header" style={{ 
                          background: 'white', 
                          padding: '15px', 
                          borderRadius: '6px',
                          marginBottom: '15px'
                        }}>
                          <span className="epm-info-value" style={{ 
                            fontSize: '16px', 
                            fontWeight: '700', 
                            color: '#1e40af',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <i className="fas fa-hashtag"></i> {invoice.number}
                          </span>
                          <span className="epm-info-value" style={{ fontSize: '16px', fontWeight: '600' }}>
                            <i className="fas fa-coins" style={{ color: '#f59e0b', marginRight: '6px' }}></i>
                            Amount: {invoice.amount}
                          </span>
                        </div>
                        <div className="epm-invoice-details">
                          <div className="epm-detail-row">
                            <span className="epm-detail-label"><i className="fas fa-tag"></i> Discount:</span>
                            <span className="epm-detail-value" style={{ color: '#27ae60', fontWeight: '600' }}>{invoice.discount}</span>
                          </div>
                          {invoice.paymentMethod && (
                            <div className="epm-detail-row">
                              <span className="epm-detail-label"><i className="fas fa-credit-card"></i> Payment Method:</span>
                              <span className="epm-detail-value">
                                <span className={`epm-payment-method-badge ${getPaymentMethodClass(invoice.paymentMethod)}`}>
                                  {invoice.paymentMethod}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="epm-invoice-services" style={{ 
                          background: 'white', 
                          padding: '15px', 
                          borderRadius: '6px',
                          marginTop: '15px'
                        }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            color: '#64748b', 
                            marginBottom: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            <i className="fas fa-list-ul"></i> Services Included:
                          </div>
                          {invoice.services?.map((service, sidx) => (
                            <div key={sidx} className="epm-service-in-invoice" style={{ 
                              padding: '8px 0 8px 15px',
                              fontSize: '14px',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <i className="fas fa-check-circle" style={{ color: '#22c55e', fontSize: '12px' }}></i> 
                              {service}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </PermissionGate>
            )}

            {/* Payment Activity Log Card */}
            {activeOrder?.paymentActivityLog && activeOrder.paymentActivityLog.length > 0 && (
              <PermissionGate moduleId="inspection" optionId="inspection_paymentlog">
                <div className="pim-detail-card" style={{ marginTop: '25px' }}>
                  <h3><i className="fas fa-history"></i> Payment Activity Log</h3>
                  <table className="pim-payment-log-table">
                    <thead>
                      <tr>
                        <th>Serial</th>
                        <th>Amount</th>
                        <th>Discount</th>
                        <th>Payment Method</th>
                        <th>Cashier</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...activeOrder.paymentActivityLog].reverse().map((payment, idx) => (
                        <tr key={idx}>
                          <td className="pim-serial-column">{payment.serial}</td>
                          <td className="pim-amount-column">{payment.amount}</td>
                          <td className="pim-discount-column">{payment.discount}</td>
                          <td className="pim-cashier-column">{payment.paymentMethod}</td>
                          <td className="pim-cashier-column">{payment.cashierName}</td>
                          <td>{payment.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </PermissionGate>
            )}

            {/* Exit Permit Details Card */}
            <PermissionGate moduleId="inspection" optionId="inspection_exitpermit">
              <div className="epm-detail-card" style={{ marginTop: '25px' }}>
                <h3><i className="fas fa-id-card"></i> Exit Permit Details</h3>
                <div className="epm-card-content">
                <div className="epm-info-item">
                  <span className="epm-info-label">Permit ID</span>
                  <span className="epm-info-value">{activeOrder?.exitPermit?.permitId || 'N/A'}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Create Date</span>
                  <span className="epm-info-value">{activeOrder?.exitPermit?.createDate || 'N/A'}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Next Service Date</span>
                  <span className="epm-info-value">{activeOrder?.exitPermit?.nextServiceDate || 'N/A'}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Created By</span>
                  <span className="epm-info-value">{activeOrder?.exitPermit?.createdBy || 'N/A'}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Collected By</span>
                  <span className="epm-info-value">{activeOrder?.exitPermit?.collectedBy || 'N/A'}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Mobile Number</span>
                  <span className="epm-info-value">{activeOrder?.exitPermit?.collectedByMobile || 'N/A'}</span>
                </div>
                <div className="epm-info-item">
                  <span className="epm-info-label">Permit Status</span>
                  <span className="epm-info-value">
                    <span className={`epm-status-badge ${activeOrder?.exitPermitStatus === 'Created' ? 'epm-payment-full' : 'epm-payment-unpaid'}`}>
                      {activeOrder?.exitPermitStatus || 'Not Created'}
                    </span>
                  </span>
                </div>
                </div>
              </div>
            </PermissionGate>

            {/* Documents Card */}
            {activeOrder?.documents && activeOrder.documents.length > 0 && (
              <PermissionGate moduleId="inspection" optionId="inspection_documents">
                <div className="pim-detail-card" style={{ marginTop: '25px' }}>
                  <h3><i className="fas fa-folder-open"></i> Documents</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeOrder.documents.map((doc, idx) => (
                      <div key={idx} style={{
                        padding: '15px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        backgroundColor: '#f9fafb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <i className="fas fa-file-alt" style={{ color: '#3b82f6', fontSize: '20px' }}></i>
                            <div>
                              <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                                {doc.name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                {doc.type} {doc.category ? `• ${doc.category}` : ''}
                                {doc.paymentReference ? ` • ${doc.paymentReference}` : ''}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#6b7280', marginLeft: '30px' }}>
                            {doc.uploadDate && (
                              <span>
                                <i className="fas fa-calendar-alt" style={{ marginRight: '5px' }}></i>
                                {doc.uploadDate}
                              </span>
                            )}
                            {doc.uploadedBy && (
                              <span>
                                <i className="fas fa-user" style={{ marginRight: '5px' }}></i>
                                {doc.uploadedBy}
                              </span>
                            )}
                          </div>
                        </div>
                        <PermissionGate moduleId="inspection" optionId="inspection_download">
                          <button
                            onClick={() => {
                              if (doc.url || doc.fileData) {
                                const link = document.createElement('a')
                                link.href = doc.fileData || doc.url
                                link.download = doc.name || 'document'
                                link.click()
                              }
                            }}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <i className="fas fa-download"></i>
                            Download
                          </button>
                        </PermissionGate>
                      </div>
                    ))}
                  </div>
                </div>
              </PermissionGate>
            )}
          </div>
        </div>
      ) : null}

      {showAddServiceSuccessPopup && (
        <SuccessPopup
          isVisible={showAddServiceSuccessPopup}
          onClose={() => setShowAddServiceSuccessPopup(false)}
          message={`Services added successfully to ${addServiceSuccessData.orderId}. Invoice: ${addServiceSuccessData.invoiceId}`}
        />
      )}

      {showSuccessPopup && lastAction === 'cancel' && (
        <SuccessPopup
          isVisible={showSuccessPopup}
          onClose={() => setShowSuccessPopup(false)}
          message={
            <>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4CAF50', display: 'block', marginBottom: '15px' }}>
                <i className="fas fa-check-circle"></i> Order ID Cancelled Successfully!
              </span>
              <span style={{ fontSize: '1.1rem', color: '#333', display: 'block', marginTop: '10px' }}>
                <strong>Job Order ID:</strong> <span style={{ color: '#2196F3', fontWeight: '600' }}>{submittedOrderId}</span>
              </span>
              <span style={{ fontSize: '0.95rem', color: '#666', display: 'block', marginTop: '8px' }}>
                This order has been moved to Job Order History
              </span>
            </>
          }
        />
      )}

      {showPopup && (
        <SuccessPopup
          isVisible={showPopup}
          onClose={() => setShowPopup(false)}
          message={popupMessage}
        />
      )}
      
      {/* Inspection Confirmation Modal */}
      <div className={`cancel-modal-overlay ${showInspectionConfirmation ? 'active' : ''}`}>
        <div className="cancel-modal">
          <div className="cancel-modal-header">
            <h3>
              <i className="fas fa-exclamation-triangle"></i> {inspectionConfirmData.title}
            </h3>
          </div>
          <div className="cancel-modal-body">
            <div className="cancel-warning">
              <i className="fas fa-exclamation-circle"></i>
              <div className="cancel-warning-text">
                <p>{inspectionConfirmData.message}</p>
              </div>
            </div>
            <div className="cancel-modal-actions">
              <button className="btn-cancel" onClick={() => {
                setShowInspectionConfirmation(false)
              }}>
                <i className="fas fa-times"></i> Cancel
              </button>
              <button className="btn-confirm-cancel" onClick={() => {
                if (inspectionConfirmData.onConfirm) {
                  inspectionConfirmData.onConfirm()
                }
              }}>
                <i className="fas fa-check"></i> Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cancel Confirmation Modal */}
      <div className={`cancel-modal-overlay ${showCancelConfirmation && cancelOrderId ? 'active' : ''}`}>
        <div className="cancel-modal">
          <div className="cancel-modal-header">
            <h3>
              <i className="fas fa-exclamation-triangle"></i> Confirm Cancellation
            </h3>
          </div>
          <div className="cancel-modal-body">
            <div className="cancel-warning">
              <i className="fas fa-exclamation-circle"></i>
              <div className="cancel-warning-text">
                <p>
                  You are about to cancel order{' '}
                  <strong>{cancelOrderId}</strong>.
                </p>
                <p>This action cannot be undone.</p>
              </div>
            </div>
            <div className="cancel-modal-actions">
              <button className="btn-cancel" onClick={() => {
                setShowCancelConfirmation(false)
                setCancelOrderId(null)
              }}>
                <i className="fas fa-times"></i> Keep Order
              </button>
              <button className="btn-confirm-cancel" onClick={handleCancelOrder}>
                <i className="fas fa-ban"></i> Cancel Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeDropdown && typeof document !== 'undefined' && createPortal(
        <div
          className="action-dropdown-menu show action-dropdown-menu-fixed"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          <PermissionGate moduleId="inspection" optionId="inspection_viewdetails">
            <button className="dropdown-item view" onClick={() => { viewDetails(filteredJobs.find(j => j.id === activeDropdown)); setActiveDropdown(null); }}>
              <i className="fas fa-eye"></i> View Details
            </button>
          </PermissionGate>
          <PermissionGate moduleId="inspection" optionId="inspection_cancel">
            <>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item delete" onClick={() => { handleShowCancelConfirmation(activeDropdown); }}>
                <i className="fas fa-times-circle"></i> Cancel Order
              </button>
            </>
          </PermissionGate>
        </div>,
        document.body
      )}
    </div>
  )
}

function AddServiceScreen({ order, products = [], onClose, onSubmit }) {
  const [selectedServices, setSelectedServices] = useState([])
  const [discountPercent, setDiscountPercent] = useState(0)
  const vehicleType = order?.vehicleDetails?.type || 'SUV'

  const handleToggleService = (product) => {
    const price = vehicleType === 'SUV' ? product.suvPrice : product.sedanPrice
    if (selectedServices.some(s => s.name === product.name)) {
      setSelectedServices(selectedServices.filter(s => s.name !== product.name))
    } else {
      setSelectedServices([...selectedServices, { name: product.name, price }])
    }
  }

  const formatPrice = (price) => `QAR ${price.toLocaleString()}`
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0)
  const discount = (subtotal * discountPercent) / 100
  const total = subtotal - discount

  return (
    <div className="pim-details-screen">
      <div className="pim-details-header">
        <div className="pim-details-title-container">
          <h2><i className="fas fa-plus-circle"></i> Add Services to Job Order</h2>
        </div>
        <button className="pim-btn-close-details" onClick={onClose}>
          <i className="fas fa-times"></i> Cancel
        </button>
      </div>

      <div className="pim-details-body">
        <div className="form-card">
          <div className="form-card-title">
            <i className="fas fa-concierge-bell"></i>
            <h2>Services Selection</h2>
          </div>

          <div className="form-card-content">
            <p>Select services for {vehicleType}:</p>
            <div className="services-grid">
              {products.map((product) => (
                <div
                  key={product.name}
                  className={`service-checkbox ${selectedServices.some(s => s.name === product.name) ? 'selected' : ''}`}
                  onClick={() => handleToggleService(product)}
                >
                  <div className="service-info">
                    <div className="service-name">{product.name}</div>
                  </div>
                  <PermissionGate moduleId="inspection" optionId="inspection_serviceprice">
                    <div className="service-price">
                      {formatPrice(vehicleType === 'SUV' ? product.suvPrice : product.sedanPrice)}
                    </div>
                  </PermissionGate>
                </div>
              ))}
            </div>

            <div className="price-summary-box">
              <h4>Price Summary</h4>
              <div className="price-row">
                <span>Services:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <PermissionGate moduleId="inspection" optionId="inspection_servicediscount">
                <div className="price-row">
                  <span>Apply Discount:</span>
                  <div>
                    <PermissionGate moduleId="inspection" optionId="inspection_discount_percent">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                        style={{ width: '80px' }}
                      />
                      <span> %</span>
                    </PermissionGate>
                  </div>
                </div>
              </PermissionGate>
              <div className="price-row discount-amount">
                <span>Discount Amount:</span>
                <span>{formatPrice(discount)}</span>
              </div>
              <div className="price-row total">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <PermissionGate moduleId="inspection" optionId="inspection_addservice">
                <button className="btn btn-primary" onClick={() => onSubmit({ selectedServices, discountPercent })} disabled={selectedServices.length === 0}>
                  Add Services
                </button>
              </PermissionGate>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions for status classes
function getWorkStatusClass(status) {
  const statusMap = {
    'New Request': 'status-new-request',
    'Inspection': 'status-inspection',
    'Inprogress': 'status-inprogress',
    'Quality Check': 'status-quality-check',
    'Ready': 'status-ready',
    'Completed': 'status-completed',
    'Cancelled': 'status-cancelled'
  };
  return statusMap[status] || 'status-inprogress';
}

function getPaymentStatusClass(status) {
  if (status === 'Fully Paid') return 'payment-full';
  if (status === 'Partially Paid') return 'payment-partial';
  return 'payment-unpaid';
}

function getPaymentMethodClass(method) {
  if (!method) return '';
  const normalized = method.toLowerCase();
  if (normalized.includes('cash')) return 'epm-payment-method-cash';
  if (normalized.includes('card')) return 'epm-payment-method-card';
  if (normalized.includes('transfer')) return 'epm-payment-method-transfer';
  return 'epm-payment-method-card';
}

export default InspectionModule
