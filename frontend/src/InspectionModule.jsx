import { useEffect, useMemo, useState, useRef } from 'react'
import inspectionListConfig from './inspectionConfig'
import { getStoredJobOrders } from './demoData'
import SuccessPopup from './SuccessPopup'
import ConfirmationPopup from './ConfirmationPopup'
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

function InspectionModule() {
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
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationData, setConfirmationData] = useState({
    message: '',
    onConfirm: null,
    confirmText: 'Yes',
    cancelText: 'No'
  })
  const [screenState, setScreenState] = useState('main')
  const [currentAddServiceOrder, setCurrentAddServiceOrder] = useState(null)
  const [showAddServiceSuccessPopup, setShowAddServiceSuccessPopup] = useState(false)
  const [addServiceSuccessData, setAddServiceSuccessData] = useState({ orderId: '', invoiceId: '' })
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
              actionBy: 'Inspector'
            }
          } else if (step.step === 'Inspection') {
            return {
              ...step,
              stepStatus: 'Active',
              status: 'InProgress',
              startTimestamp: new Date().toLocaleString(),
              actionBy: 'Inspector'
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
              actionBy: 'Inspector'
            }
          } else if (step.step === 'Service') {
            return {
              ...step,
              stepStatus: 'Active',
              status: 'InProgress',
              startTimestamp: new Date().toLocaleString(),
              actionBy: 'Inspector'
            }
          }
          return step
        })
        return {
          ...order,
          roadmap: updatedRoadmap
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
    setConfirmationData({
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
        setShowConfirmation(false)
      },
      confirmText: 'Save',
      cancelText: 'Cancel'
    })
    setShowConfirmation(true)
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
    setConfirmationData({
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
        setShowConfirmation(false)
      },
      confirmText: 'Yes',
      cancelText: 'No'
    })
    setShowConfirmation(true)
  }

  const completeSection = (sectionKey) => {
    setConfirmationData({
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
        setShowConfirmation(false)
      },
      confirmText: 'Yes',
      cancelText: 'No'
    })
    setShowConfirmation(true)
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
    setConfirmationData({
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
        setShowConfirmation(false)
      },
      confirmText: 'Yes',
      cancelText: 'No'
    })
    setShowConfirmation(true)
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
        <div className="container" id="mainView">
          <header>
            <div className="header-content">
              <h1><i className="fas fa-car"></i> Vehicle Service Center - Inspection Module</h1>
            </div>
          </header>

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
                <label htmlFor="inspectionPageSize" className="pagination-label">Records per page:</label>
                <select
                  id="inspectionPageSize"
                  className="pagination-select"
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
            <div className="table-container">
              <table id="jobTable">
                <thead>
                  <tr>
                    <th>Create Date</th>
                    <th>Job Card ID</th>
                    <th>Order Type</th>
                    <th>Customer Name</th>
                    <th>Mobile Number</th>
                    <th>Vehicle Plate</th>
                    <th>Work Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody id="jobTableBody">
                  {filteredJobs.length === 0 && (
                    <tr>
                      <td colSpan="8" className="empty-row">No jobs found.</td>
                    </tr>
                  )}
                  {paginatedJobs.map((job) => (
                    <tr key={job.id}>
                      <td>{job.createDate}</td>
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
                            job.status === 'New Job Order' ? 'status-new' : 'status-inspection'
                          }`}
                        >
                          {job.workStatus}
                        </span>
                      </td>
                      <td>
                        <button className="action-btn" onClick={() => viewDetails(job)}>
                          <i className="fas fa-eye"></i> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

          <footer className="footer">
            <p>Vehicle Service Center Management System v2.1 • Inspection Module</p>
          </footer>
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
            <h2>
              Inspection Details - Job Order #<span id="detailJobIdHeader">{detailData.jobOrderId}</span>
            </h2>
            <button className="close-detail" onClick={() => { closeDetailView(); setScreenState('main'); }}>
              <i className="fas fa-times"></i> Close Details
            </button>
          </div>

          <div className="detail-container">
            <div className="detail-cards">
              <div className="epm-detail-card">
                <h3><i className="fas fa-info-circle"></i> Job Order Summary</h3>
                <div className="epm-card-content">
                  <div className="epm-info-item">
                    <span className="epm-info-label">Job Order ID</span>
                    <span className="epm-info-value">{detailData.jobOrderId}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Order Type</span>
                    <span className="epm-info-value">
                      <span
                        className={`epm-order-type-badge ${
                          detailData.orderType === 'New Job Order'
                            ? 'epm-order-type-new-job'
                            : 'epm-order-type-service'
                        }`}
                      >
                        {detailData.orderType}
                      </span>
                    </span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Request Create Date</span>
                    <span className="epm-info-value">{detailData.createDate}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Created By</span>
                    <span className="epm-info-value">{detailData.createdBy}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Expected Delivery Date</span>
                    <span className="epm-info-value">{detailData.expectedDelivery}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Work Status</span>
                    <span className="epm-info-value">
                      <span
                        className={`epm-status-badge ${
                          detailData.workStatus === 'New Request'
                            ? 'epm-status-new'
                            : 'epm-status-inprogress'
                        }`}
                      >
                        {detailData.workStatus}
                      </span>
                    </span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Payment Status</span>
                    <span className="epm-info-value">
                      <span className="epm-status-badge epm-payment-unpaid">{detailData.paymentStatus}</span>
                    </span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Exit Permit Status</span>
                    <span className="epm-info-value">
                      <span className="epm-status-badge epm-permit-created">{detailData.exitPermitStatus}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Roadmap Section */}
              {detailData.roadmap && detailData.roadmap.length > 0 && (
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
              )}

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

              <div className="epm-detail-card">
                <h3><i className="fas fa-car"></i> Vehicle Information</h3>
                <div className="epm-card-content">
                  <div className="epm-info-item">
                    <span className="epm-info-label">Vehicle ID</span>
                    <span className="epm-info-value">{detailData.vehicleId}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Make & Model</span>
                    <span className="epm-info-value">{detailData.vehicleModel}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Year</span>
                    <span className="epm-info-value">{detailData.year}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Vehicle Type</span>
                    <span className="epm-info-value">{detailData.type}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Color</span>
                    <span className="epm-info-value">{detailData.color}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">License Plate</span>
                    <span className="epm-info-value">{activeJob.vehiclePlate}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">VIN</span>
                    <span className="epm-info-value">{detailData.vin}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Owned By</span>
                    <span className="epm-info-value">{detailData.ownedBy}</span>
                  </div>
                  <div className="epm-info-item">
                    <span className="epm-info-label">Registration Date</span>
                    <span className="epm-info-value">{detailData.registrationDate}</span>
                  </div>
                </div>
              </div>

              <div className="epm-detail-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}><i className="fas fa-tasks"></i> Services Summary</h3>
                  <button className="btn-add-service" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={handleAddService}>
                    <i className="fas fa-plus-circle"></i> Add Service
                  </button>
                </div>
                <div className="pim-services-list">
                  {detailData.services && detailData.services.length > 0 ? (
                    detailData.services.map((service, idx) => (
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
            </div>

            {/* Customer Notes Card */}
            {detailData.customerNotes && (
              <div className="epm-detail-card" style={{ backgroundColor: '#fffbea', borderLeft: '4px solid #f59e0b', marginBottom: '20px' }}>
                <h3><i className="fas fa-comment-dots"></i> Customer Notes</h3>
                <div style={{ padding: '15px 20px', whiteSpace: 'pre-wrap', color: '#78350f', fontSize: '14px', lineHeight: '1.6' }}>
                  {detailData.customerNotes}
                </div>
              </div>
            )}

            <div className="epm-detail-card inspection-list-card">
              <h3><i className="fas fa-clipboard-check"></i> Inspection List</h3>
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
                          <button
                            className="inspection-btn btn-start"
                            onClick={() => startInspection(sectionKey)}
                            style={{ display: isStarted ? 'none' : 'flex' }}
                          >
                            <i className="fas fa-play"></i> {startLabel}
                          </button>
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
                          <button
                            className="inspection-btn btn-resume"
                            onClick={() => resumeInspection(sectionKey)}
                            disabled={!resumeAvailable[sectionKey]}
                          >
                            <i className="fas fa-play-circle"></i> Resume
                          </button>
                        )}
                        {!isCompleted && !isNotRequired && (
                          <button
                            className="inspection-btn btn-complete"
                            onClick={() => completeSection(sectionKey)}
                            disabled={!canComplete}
                          >
                            <i className="fas fa-check-circle"></i> Complete Inspection
                          </button>
                        )}
                        {!isCompleted && !isNotRequired && (
                          <button
                            className="inspection-btn btn-not-required"
                            onClick={() => markNotRequired(sectionKey)}
                          >
                            <i className="fas fa-ban"></i> Not Required
                          </button>
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

            <div className="completion-section">
              <button className="finish-btn" disabled={!canFinish} onClick={finishInspection}>
                <i className="fas fa-flag-checkered"></i> Finish Inspection
              </button>
            </div>
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

      {showPopup && (
        <SuccessPopup
          isVisible={showPopup}
          onClose={() => setShowPopup(false)}
          message={popupMessage}
        />
      )}
      
      {showConfirmation && (
        <ConfirmationPopup
          isVisible={showConfirmation}
          message={confirmationData.message}
          confirmText={confirmationData.confirmText}
          cancelText={confirmationData.cancelText}
          onConfirm={confirmationData.onConfirm}
          onCancel={() => setShowConfirmation(false)}
        />
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
                  <div className="service-price">
                    {formatPrice(vehicleType === 'SUV' ? product.suvPrice : product.sedanPrice)}
                  </div>
                </div>
              ))}
            </div>

            <div className="price-summary-box">
              <h4>Price Summary</h4>
              <div className="price-row">
                <span>Services:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="price-row">
                <span>Apply Discount:</span>
                <div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    style={{ width: '80px' }}
                  />
                  <span> %</span>
                </div>
              </div>
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
              <button className="btn btn-primary" onClick={() => onSubmit({ selectedServices, discountPercent })} disabled={selectedServices.length === 0}>
                Add Services
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InspectionModule
