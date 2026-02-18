import { useEffect, useMemo, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getStoredJobOrders } from './demoData'
import SuccessPopup from './SuccessPopup'
import ConfirmationPopup from './ConfirmationPopup'
import PermissionGate from './PermissionGate'
import './QualityCheckModule.css'

const defaultDetailData = {
  jobOrderId: 'JO-2026-176638',
  orderType: 'New Job Order',
  createDate: '2/10/2026, 9:06:33 AM',
  createdBy: 'System User',
  expectedDelivery: '2/13/2026, 9:06:33 AM',
  workStatus: 'Quality Check',
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
  services: [],
  roadmap: [],
  customerNotes: null
}

const mapOrderToQCJob = (order) => ({
  id: order.id,
  createDate: order.jobOrderSummary?.createDate || order.createDate || 'Not specified',
  orderType: order.orderType || 'New Job Order',
  customerName: order.customerName,
  mobile: order.mobile,
  vehiclePlate: order.vehiclePlate || order.vehicleDetails?.plateNumber || 'Not specified',
  workStatus: order.workStatus || 'Quality Check',
  status: order.workStatus === 'Quality Check' ? 'Quality Check' : 'Quality Check'
})

const filterQCOrders = (orders) =>
  orders.filter((order) => order.workStatus === 'Quality Check')

function QualityCheckModule({ currentUser }) {
  const [jobOrders, setJobOrders] = useState([])
  const [jobData, setJobData] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [activeJobId, setActiveJobId] = useState(null)
  const [detailData, setDetailData] = useState(defaultDetailData)
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
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [cancelOrderId, setCancelOrderId] = useState(null)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [serviceQCResults, setServiceQCResults] = useState({})
  const [showQCConfirmation, setShowQCConfirmation] = useState(false)

  useEffect(() => {
    const orders = getStoredJobOrders()
    const qcOrders = filterQCOrders(orders)
    setJobOrders(qcOrders)
    setJobData(qcOrders.map(mapOrderToQCJob))
    setFilteredJobs(qcOrders.map(mapOrderToQCJob))
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

    const cancelledOrder = {
      ...orderToCancel,
      workStatus: 'Cancelled'
    }

    const updatedOrders = storedOrders.map(order =>
      order.id === cancelOrderId ? cancelledOrder : order
    )
    localStorage.setItem('jobOrders', JSON.stringify(updatedOrders))

    const qcOrders = filterQCOrders(updatedOrders)
    setJobOrders(qcOrders)
    setJobData(qcOrders.map(mapOrderToQCJob))
    setFilteredJobs(qcOrders.map(mapOrderToQCJob))

    setShowCancelConfirmation(false)
    setCancelOrderId(null)
  }

  const getQCStepStatusClass = (stepStatus) => {
    switch (stepStatus) {
      case 'Completed': return 'qc-step-completed'
      case 'Active': return 'qc-step-active'
      case 'InProgress': return 'qc-step-active'
      case 'Pending': return 'qc-step-pending'
      case 'Cancelled': return 'qc-step-cancelled'
      case 'Upcoming': return 'qc-step-upcoming'
      default: return 'qc-step-upcoming'
    }
  }

  const getQCStepIcon = (stepStatus) => {
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

  const getQCStatusClass = (status) => {
    switch (status) {
      case 'Completed': return 'qc-status-completed'
      case 'InProgress': return 'qc-status-inprogress'
      case 'Pending': return 'qc-status-pending'
      case 'New': return 'qc-status-new'
      default: return 'qc-status-pending'
    }
  }

  const handleServiceQCChange = (serviceIndex, qcResult) => {
    setServiceQCResults(prev => ({
      ...prev,
      [serviceIndex]: qcResult
    }))
  }

  const combinedServices = detailData.orderType === 'Service Order'
    ? [...(detailData.serviceOrderReference?.services || []), ...(detailData.services || [])]
    : (detailData.services || [])

  const allServicesEvaluated = () => {
    if (combinedServices.length === 0) return false
    return combinedServices.every((_, idx) => serviceQCResults[idx])
  }

  const calculateOverallStatus = () => {
    const results = Object.values(serviceQCResults)
    if (results.length === 0) return 'N/A'
    
    const hasFailed = results.some(result => result === 'Failed')
    if (hasFailed) return 'Failed'
    
    const hasAcceptable = results.some(result => result === 'Acceptable')
    if (hasAcceptable) return 'Acceptable'
    
    return 'Pass'
  }

  const generateQualityCheckPdf = async (order, detailData, activeJob, serviceQCResults) => {
    const orderId = order?.id || detailData?.jobOrderId || 'N/A'
    const overallStatus = calculateOverallStatus()

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
      .qc-item-row { margin: 0 0 12px 0; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #3498db; }
      .qc-service-name { font-size: 14px; font-weight: 600; color: #2c3e50; margin-bottom: 6px; }
      .qc-result { display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: 600; font-size: 12px; margin-top: 4px; }
      .qc-pass { background: #d1fae5; color: #065f46; }
      .qc-failed { background: #fee2e2; color: #991b1b; }
      .qc-acceptable { background: #fef3c7; color: #92400e; }
      .overall-status { text-align: center; padding: 16px; margin: 20px 0; border-radius: 8px; font-size: 18px; font-weight: 700; }
      .overall-pass { background: #d1fae5; color: #065f46; border: 2px solid #10b981; }
      .overall-failed { background: #fee2e2; color: #991b1b; border: 2px solid #ef4444; }
      .overall-acceptable { background: #fef3c7; color: #92400e; border: 2px solid #f59e0b; }
    `

    const headerHtml = `
      <div class="report-header">
        <h1>Quality Check Result Report</h1>
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

    let qcResultsHtml = `
      <div class="report-card">
        <h2 class="card-title orange">✓ Quality Check Results</h2>
    `

    // Overall Status
    const overallStatusClass = overallStatus === 'Pass' 
      ? 'overall-pass' 
      : overallStatus === 'Failed' 
        ? 'overall-failed' 
        : 'overall-acceptable'
    
    qcResultsHtml += `
      <div class="overall-status ${overallStatusClass}">
        Overall Status: ${overallStatus}
      </div>
    `

    // Individual service results
    combinedServices.forEach((service, idx) => {
      const serviceName = typeof service === 'string' ? service : service.name
      const result = serviceQCResults[idx] || 'Not Evaluated'
      const resultClass = result === 'Pass' 
        ? 'qc-pass' 
        : result === 'Failed' 
          ? 'qc-failed' 
          : result === 'Acceptable'
            ? 'qc-acceptable'
            : ''
      
      qcResultsHtml += `
        <div class="qc-item-row">
          <div class="qc-service-name">${serviceName}</div>
          <span class="qc-result ${resultClass}">${result}</span>
        </div>
      `
    })

    qcResultsHtml += `</div>`

    const fullHtml = headerHtml + orderSummaryHtml + customerInfoHtml + vehicleInfoHtml + qcResultsHtml

    // Create a data URL for an HTML document that can be printed as PDF
    const htmlDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Quality_Check_Result_${orderId}.html</title>
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

  const buildQualityCheckReportDocument = async ({ order, detailData, activeJob, serviceQCResults }) => {
    if (!order) return null

    const dataUrl = await generateQualityCheckPdf(order, detailData, activeJob, serviceQCResults)
    const createdAt = new Date().toLocaleString()

    return {
      id: `quality-check-report-${order.id}`,
      name: `Quality Check Result ${order.id}.html`,
      type: 'quality-check-report',
      createdAt,
      url: dataUrl
    }
  }

  const handleFinishQC = () => {
    if (!allServicesEvaluated()) return
    setShowQCConfirmation(true)
  }

  const viewDetails = (job) => {
    const order = jobOrders.find((item) => item.id === job.id)
    const orderSummary = order?.jobOrderSummary || {}
    const customerDetails = order?.customerDetails || {}
    const vehicleDetails = order?.vehicleDetails || {}
    const vehicleModel = vehicleDetails.make && vehicleDetails.model
      ? `${vehicleDetails.make} ${vehicleDetails.model} ${vehicleDetails.year || ''}`.trim()
      : defaultDetailData.vehicleModel

    // Reset QC results when opening details
    setServiceQCResults({})

    setDetailData({
      jobOrderId: order?.id || job.id,
      orderType: order?.orderType || (job.status === 'New Job Order' ? 'New Job Order' : 'Service Order'),
      createDate: orderSummary.createDate || order?.createDate || defaultDetailData.createDate,
      createdBy: orderSummary.createdBy || defaultDetailData.createdBy,
      expectedDelivery: orderSummary.expectedDelivery || defaultDetailData.expectedDelivery,
      workStatus: order?.workStatus || 'Quality Check',
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

    setActiveJobId(job.id)
    setScreenState('details')
  }

  const closeDetailView = () => {
    setActiveJobId(null)
    setScreenState('main')
  }

  const getPaymentMethodClass = (method) => {
    if (!method) return '';
    const normalized = method.toLowerCase();
    if (normalized.includes('cash')) return 'epm-payment-method-cash';
    if (normalized.includes('card')) return 'epm-payment-method-card';
    if (normalized.includes('transfer')) return 'epm-payment-method-transfer';
    return 'epm-payment-method-card';
  }

  const formatServiceStatus = (status) => {
    switch (status) {
      case 'Completed': return 'qc-status-completed'
      case 'InProgress': return 'qc-status-inprogress'
      case 'In Progress': return 'qc-status-inprogress'
      case 'Pending Approval': return 'qc-status-pending-approval'
      case 'Paused': return 'qc-status-paused'
      case 'New': return 'qc-status-new'
      case 'Postponed': return 'qc-status-postponed'
      default: return 'qc-status-new'
    }
  }

  const handleApproveQC = async () => {
    const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]')
    const targetOrder = storedOrders.find((order) => order.id === activeJobId)
    
    // Generate quality check report
    const qualityCheckReport = await buildQualityCheckReportDocument({
      order: targetOrder,
      detailData,
      activeJob,
      serviceQCResults
    })

    const updatedOrders = storedOrders.map((order) => {
      if (order.id !== activeJobId) return order
      
      const updatedRoadmap = order.roadmap?.map((step) => {
        if (step.step === 'Quality Check') {
          return {
            ...step,
            stepStatus: 'Completed',
            status: 'Completed',
            endTimestamp: new Date().toLocaleString(),
            actionBy: currentUser?.name || 'QC Inspector'
          }
        } else if (step.step === 'Ready') {
          return {
            ...step,
            stepStatus: 'Active',
            status: 'InProgress',
            startTimestamp: new Date().toLocaleString(),
            actionBy: currentUser?.name || 'QC Inspector'
          }
        }
        return step
      }) || []

      // Add quality check report to documents
      const documents = Array.isArray(order.documents) ? order.documents : []
      const filteredDocuments = documents.filter((doc) => doc.type !== 'quality-check-report')

      return {
        ...order,
        workStatus: 'Ready',
        roadmap: updatedRoadmap,
        documents: qualityCheckReport
          ? [...filteredDocuments, qualityCheckReport]
          : filteredDocuments
      }
    })
    localStorage.setItem('jobOrders', JSON.stringify(updatedOrders))

    const qcOrders = filterQCOrders(updatedOrders)
    setJobOrders(qcOrders)
    setJobData(qcOrders.map(mapOrderToQCJob))
    setFilteredJobs(qcOrders.map(mapOrderToQCJob))

    setPopupMessage('Quality Check Approved! Order moved to Ready status and will appear in Exit Permit module.')
    setShowPopup(true)
    setShowQCConfirmation(false)
    closeDetailView()
  }

  const handleRejectQC = async () => {
    const storedOrders = JSON.parse(localStorage.getItem('jobOrders') || '[]')
    const updatedOrders = storedOrders.map((order) => {
      if (order.id !== activeJobId) return order
      
      const updatedRoadmap = order.roadmap?.map((step) => {
        if (step.step === 'Quality Check') {
          return {
            ...step,
            stepStatus: 'Pending',
            status: 'Pending',
            endTimestamp: new Date().toLocaleString(),
            actionBy: currentUser?.name || 'QC Inspector'
          }
        } else if (step.step === 'Inprogress') {
          return {
            ...step,
            stepStatus: 'Active',
            status: 'InProgress',
            actionBy: currentUser?.name || 'QC Inspector'
          }
        }
        return step
      }) || []

      return {
        ...order,
        workStatus: 'Inprogress',
        roadmap: updatedRoadmap,
        assignedToUser: null,
        assignedTo: null,
        shouldBeUnassigned: true
      }
    })
    localStorage.setItem('jobOrders', JSON.stringify(updatedOrders))

    const qcOrders = filterQCOrders(updatedOrders)
    setJobOrders(qcOrders)
    setJobData(qcOrders.map(mapOrderToQCJob))
    setFilteredJobs(qcOrders.map(mapOrderToQCJob))

    setPopupMessage('Quality Check Rejected! Order returned to Service Execution as unassigned.')
    setShowPopup(true)
    setShowQCConfirmation(false)
    closeDetailView()
  }

  return (
    <div className="quality-check-module">
      {screenState === 'main' && !activeJobId ? (
        <div className="app-container">
          <header className="app-header">
            <div className="header-left">
              <h1><i className="fas fa-check-double"></i> Quality Check Module</h1>
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
                  : `Showing ${Math.min((currentPage - 1) * pageSize + 1, filteredJobs.length)}-${Math.min(currentPage * pageSize, filteredJobs.length)} of ${filteredJobs.length} quality check jobs`}
              </div>
            </section>

            <section className="results-section">
              <div className="section-header">
                <h2><i className="fas fa-list"></i> Quality Check Records</h2>
                <div className="pagination-controls">
                  <div className="records-per-page">
                    <label htmlFor="qcPageSize">Records per page:</label>
                    <select
                      id="qcPageSize"
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
                              job.workStatus === 'Quality Check' ? 'status-pending' : 'status-completed'
                            }`}
                          >
                            {job.workStatus}
                          </span>
                        </td>
                        <td>
                          <PermissionGate moduleId="deliveryqc" optionId="deliveryqc_actions">
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
                  <p>No quality check jobs found</p>
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

          {/* Footer */}
          <div className="quality-footer">
            <p>Service Management System &copy; 2023 | Quality Check Module</p>
          </div>
        </main>
      </div>
      ) : screenState === 'details' && activeJobId ? (
        <div className="detail-view" id="detailView">
          <div className="detail-header">
            <h2>
              Quality Check Details - Job Order #<span id="detailJobIdHeader">{detailData.jobOrderId}</span>
            </h2>
            <button className="close-detail" onClick={() => { closeDetailView(); setScreenState('main'); }}>
              <i className="fas fa-times"></i> Close Details
            </button>
          </div>

          <div className="detail-container">
            <div className="detail-cards">
              <PermissionGate moduleId="deliveryqc" optionId="deliveryqc_summary">
              <div className="qc-detail-card">
                <h3><i className="fas fa-info-circle"></i> Job Order Summary</h3>
                <div className="qc-card-content">
                  <div className="qc-info-item">
                    <span className="qc-info-label">Job Order ID</span>
                    <span className="qc-info-value">{detailData.jobOrderId}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Order Type</span>
                    <span className="qc-info-value">
                      <span
                        className={`qc-order-type-badge ${
                          detailData.orderType === 'New Job Order'
                            ? 'qc-order-type-new-job'
                            : 'qc-order-type-service'
                        }`}
                      >
                        {detailData.orderType}
                      </span>
                    </span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Request Create Date</span>
                    <span className="qc-info-value">{detailData.createDate}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Created By</span>
                    <span className="qc-info-value">{detailData.createdBy}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Expected Delivery Date</span>
                    <span className="qc-info-value">{detailData.expectedDelivery}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Work Status</span>
                    <span className="qc-info-value">
                      <span
                        className={`qc-status-badge ${
                          detailData.workStatus === 'Quality Check'
                            ? 'qc-status-pending'
                            : 'qc-status-completed'
                        }`}
                      >
                        {detailData.workStatus}
                      </span>
                    </span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Payment Status</span>
                    <span className="qc-info-value">
                      <span className="qc-status-badge qc-payment-unpaid">{detailData.paymentStatus}</span>
                    </span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Exit Permit Status</span>
                    <span className="qc-info-value">
                      <span className="qc-status-badge qc-permit-created">{detailData.exitPermitStatus}</span>
                    </span>
                  </div>
                </div>
              </div>
              </PermissionGate>

              {/* Roadmap Section */}
              {detailData.roadmap && detailData.roadmap.length > 0 && (
              <PermissionGate moduleId="deliveryqc" optionId="deliveryqc_roadmap">
                <div className="qc-detail-card">
                  <h3><i className="fas fa-map-signs"></i> Job Order Roadmap</h3>
                  <div className="qc-roadmap-container">
                    <div className="qc-roadmap-steps">
                      {detailData.roadmap.map((step, idx) => (
                        <div key={idx} className={`qc-roadmap-step ${getQCStepStatusClass(step.stepStatus)}`}>
                          <div className="qc-step-icon">
                            <i className={getQCStepIcon(step.stepStatus)}></i>
                          </div>
                          <div className="qc-step-content">
                            <div className="qc-step-header">
                              <div className="qc-step-name">{step.step}</div>
                              <span className={`qc-status-badge-roadmap ${getQCStatusClass(step.status)}`}>{step.status}</span>
                            </div>
                            <div className="qc-step-details">
                              <div className="qc-step-detail">
                                <span className="qc-detail-label">Started</span>
                                <span className="qc-detail-value">{step.startTimestamp || 'Not started'}</span>
                              </div>
                              <div className="qc-step-detail">
                                <span className="qc-detail-label">Ended</span>
                                <span className="qc-detail-value">{step.endTimestamp || 'Not completed'}</span>
                              </div>
                              <div className="qc-step-detail">
                                <span className="qc-detail-label">Action By</span>
                                <span className="qc-detail-value">{step.actionBy || 'Not assigned'}</span>
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

              <PermissionGate moduleId="deliveryqc" optionId="deliveryqc_customer">
              <div className="qc-detail-card">
                <h3><i className="fas fa-user"></i> Customer Information</h3>
                <div className="qc-card-content">
                  <div className="qc-info-item">
                    <span className="qc-info-label">Customer ID</span>
                    <span className="qc-info-value">{detailData.customerId}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Customer Name</span>
                    <span className="qc-info-value">{activeJob?.customerName}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Mobile Number</span>
                    <span className="qc-info-value">{activeJob?.mobile}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Email Address</span>
                    <span className="qc-info-value">{detailData.email}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Home Address</span>
                    <span className="qc-info-value">{detailData.address}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Registered Vehicles</span>
                    <span className="qc-info-value"><span className="count-badge">{detailData.registeredVehicles} {detailData.registeredVehicles === 1 ? 'vehicle' : 'vehicles'}</span></span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Completed Services</span>
                    <span className="qc-info-value"><span className="count-badge">{detailData.completedServices} {detailData.completedServices === 1 ? 'service' : 'services'}</span></span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Customer Since</span>
                    <span className="qc-info-value">{detailData.customerSince}</span>
                  </div>
                </div>
              </div>
              </PermissionGate>

              <PermissionGate moduleId="deliveryqc" optionId="deliveryqc_vehicle">
              <div className="qc-detail-card">
                <h3><i className="fas fa-car"></i> Vehicle Information</h3>
                <div className="qc-card-content">
                  <div className="qc-info-item">
                    <span className="qc-info-label">Vehicle Unique ID</span>
                    <span className="qc-info-value">{activeOrder?.vehicleDetails?.vehicleId || 'N/A'}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Owned By</span>
                    <span className="qc-info-value">{activeOrder?.vehicleDetails?.ownedBy || 'N/A'}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Make</span>
                    <span className="qc-info-value">{activeOrder?.vehicleDetails?.make || 'N/A'}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Model</span>
                    <span className="qc-info-value">{activeOrder?.vehicleDetails?.model || 'N/A'}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Year</span>
                    <span className="qc-info-value">{activeOrder?.vehicleDetails?.year || 'N/A'}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Vehicle Type</span>
                    <span className="qc-info-value">{activeOrder?.vehicleDetails?.type || 'N/A'}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Color</span>
                    <span className="qc-info-value">{activeOrder?.vehicleDetails?.color || 'N/A'}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Plate Number</span>
                    <span className="qc-info-value">{activeOrder?.vehicleDetails?.plateNumber || activeOrder?.vehiclePlate || 'N/A'}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">VIN</span>
                    <span className="qc-info-value">{activeOrder?.vehicleDetails?.vin || 'N/A'}</span>
                  </div>
                  <div className="qc-info-item">
                    <span className="qc-info-label">Registration Date</span>
                    <span className="qc-info-value">{activeOrder?.vehicleDetails?.registrationDate || 'N/A'}</span>
                  </div>
                </div>
              </div>
              </PermissionGate>

              <PermissionGate moduleId="deliveryqc" optionId="deliveryqc_services">
              <div className="qc-detail-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}><i className="fas fa-tasks"></i> Services Summary</h3>
                </div>
                <div className="qc-services-list">
                  {combinedServices.length > 0 ? (
                    combinedServices.map((service, idx) => (
                      <div key={idx} className="qc-service-item">
                        <div className="qc-service-header">
                          <span className="qc-service-name">{typeof service === 'string' ? service : service.name}</span>
                          <span className={`qc-status-badge ${formatServiceStatus(typeof service === 'string' ? 'New' : service.status)}`}>
                            {typeof service === 'string' ? 'New' : service.status}
                          </span>
                        </div>
                        <div className="qc-service-timeline">
                          <div className="qc-timeline-item">
                            <i className="fas fa-play-circle"></i>
                            <span className="qc-timeline-label">Started:</span>
                            <span className="qc-timeline-value">{typeof service === 'string' ? 'Not started' : (service.started || 'Not started')}</span>
                          </div>
                          <div className="qc-timeline-item">
                            <i className="fas fa-flag-checkered"></i>
                            <span className="qc-timeline-label">Ended:</span>
                            <span className="qc-timeline-value">{typeof service === 'string' ? 'Not completed' : (service.ended || 'Not completed')}</span>
                          </div>
                          <div className="qc-timeline-item">
                            <i className="fas fa-clock"></i>
                            <span className="qc-timeline-label">Duration:</span>
                            <span className="qc-timeline-value">{typeof service === 'string' ? 'N/A' : (service.duration || 'N/A')}</span>
                          </div>
                          <div className="qc-timeline-item">
                            <i className="fas fa-user-cog"></i>
                            <span className="qc-timeline-label">Technician:</span>
                            <span className="qc-timeline-value">{typeof service === 'string' ? 'Not assigned' : (service.technician || 'Not assigned')}</span>
                          </div>
                        </div>
                        {typeof service !== 'string' && service.notes && (
                          <div className="qc-service-notes">
                            <span className="qc-notes-label">Notes:</span>
                            <span className="qc-notes-value">{service.notes}</span>
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

              <PermissionGate moduleId="deliveryqc" optionId="deliveryqc_quality">
              <div className="qc-detail-card" style={{ backgroundColor: '#e8f4f1', borderLeft: '4px solid #16a085' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}><i className="fas fa-clipboard-check"></i> Quality Check List</h3>
                  <button 
                    className="qc-btn-finish"
                    onClick={handleFinishQC}
                    disabled={!allServicesEvaluated()}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: allServicesEvaluated() ? '#10b981' : '#d1d5db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: allServicesEvaluated() ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fas fa-flag-checkered"></i> Finish
                  </button>
                </div>

                <div className="qc-checklist-items">
                  {combinedServices.length > 0 ? (
                    combinedServices.map((service, idx) => (
                      <div key={idx} className="qc-checklist-item" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        border: '1px solid #e5e7eb',
                        gap: '12px'
                      }}>
                        <span className="qc-checklist-service-name" style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#1f2937',
                          flex: 1
                        }}>
                          {typeof service === 'string' ? service : service.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <select
                            className="qc-service-dropdown"
                            value={serviceQCResults[idx] || ''}
                            onChange={(e) => handleServiceQCChange(idx, e.target.value)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '4px',
                              border: '1px solid #d1d5db',
                              backgroundColor: 'white',
                              color: '#1f2937',
                              fontSize: '13px',
                              cursor: 'pointer',
                              minWidth: '130px',
                              fontWeight: '500'
                            }}
                          >
                            <option value="">-- Select Result --</option>
                            <option value="Pass">✓ Pass</option>
                            <option value="Failed">✗ Failed</option>
                            <option value="Acceptable">~ Acceptable</option>
                          </select>
                          {serviceQCResults[idx] && (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                              whiteSpace: 'nowrap',
                              ...(serviceQCResults[idx] === 'Pass' && {
                                backgroundColor: '#d1fae5',
                                color: '#065f46'
                              }),
                              ...(serviceQCResults[idx] === 'Failed' && {
                                backgroundColor: '#fee2e2',
                                color: '#991b1b'
                              }),
                              ...(serviceQCResults[idx] === 'Acceptable' && {
                                backgroundColor: '#fef3c7',
                                color: '#92400e'
                              })
                            }}>
                              {serviceQCResults[idx]}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      No services to evaluate
                    </div>
                  )}
                </div>
              </div>
              </PermissionGate>

              <PermissionGate moduleId="deliveryqc" optionId="deliveryqc_billing">
              <div className="epm-detail-card">
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
                        {activeOrder?.billing?.billId || 'N/A'}
                      </span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label"><i className="fas fa-calculator"></i> Total Bill Amount</span>
                      <span className="epm-info-value" style={{ fontSize: '17px' }}>{activeOrder?.billing?.totalAmount || 'N/A'}</span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label"><i className="fas fa-tag"></i> Total Discount</span>
                      <span className="epm-info-value" style={{ color: '#27ae60', fontSize: '17px' }}>{activeOrder?.billing?.discount || 'N/A'}</span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label"><i className="fas fa-money-bill-wave"></i> Net Amount</span>
                      <span className="epm-info-value" style={{ fontSize: '18px', fontWeight: '700', color: '#1e40af' }}>
                        {activeOrder?.billing?.netAmount || 'N/A'}
                      </span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label"><i className="fas fa-check-circle"></i> Amount Paid</span>
                      <span className="epm-info-value" style={{ color: '#27ae60', fontSize: '17px' }}>{activeOrder?.billing?.amountPaid || 'N/A'}</span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label"><i className="fas fa-exclamation-circle"></i> Balance Due</span>
                      <span className="epm-info-value" style={{ color: '#dc2626', fontSize: '17px', fontWeight: '600' }}>
                        {activeOrder?.billing?.balanceDue || 'N/A'}
                      </span>
                    </div>
                  </div>
                  {activeOrder?.billing?.paymentMethod && (
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
                {activeOrder?.billing?.invoices && activeOrder.billing.invoices.length > 0 && (
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

              {/* Payment Activity Log Card */}
              {activeOrder?.paymentActivityLog && activeOrder.paymentActivityLog.length > 0 && (
              <PermissionGate moduleId="deliveryqc" optionId="deliveryqc_paymentlog">
                <div>
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
              {activeOrder?.exitPermit && (
              <PermissionGate moduleId="deliveryqc" optionId="deliveryqc_exitpermit">
                <div className="epm-detail-card">
                  <h3><i className="fas fa-id-card"></i> Exit Permit Details</h3>
                  <div className="epm-card-content">
                    <div className="epm-info-item">
                      <span className="epm-info-label">Permit ID</span>
                      <span className="epm-info-value">{activeOrder.exitPermit?.permitId || 'N/A'}</span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label">Create Date</span>
                      <span className="epm-info-value">{activeOrder.exitPermit?.createDate || 'N/A'}</span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label">Next Service Date</span>
                      <span className="epm-info-value">{activeOrder.exitPermit?.nextServiceDate || 'N/A'}</span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label">Created By</span>
                      <span className="epm-info-value">{activeOrder.exitPermit?.createdBy || 'N/A'}</span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label">Collected By</span>
                      <span className="epm-info-value">{activeOrder.exitPermit?.collectedBy || 'N/A'}</span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label">Mobile Number</span>
                      <span className="epm-info-value">{activeOrder.exitPermit?.collectedByMobile || 'N/A'}</span>
                    </div>
                    <div className="epm-info-item">
                      <span className="epm-info-label">Permit Status</span>
                      <span className="epm-info-value">
                        <span className={`epm-status-badge ${activeOrder.exitPermitStatus === 'Created' ? 'epm-payment-full' : 'epm-payment-unpaid'}`}>
                          {activeOrder.exitPermitStatus || 'Not Created'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </PermissionGate>
              )}

              {/* Documents Card */}
              {activeOrder?.documents && Array.isArray(activeOrder.documents) && activeOrder.documents.length > 0 && (
              <PermissionGate moduleId="deliveryqc" optionId="deliveryqc_documents">
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
                        <button
                          onClick={() => {
                            if (doc.url || doc.fileData) {
                              const link = document.createElement('a');
                              link.href = doc.fileData || doc.url;
                              link.download = doc.name || 'document';
                              link.click();
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
                      </div>
                    ))}
                  </div>
                </PermissionGate>
              )}

            {/* Customer Notes Card */}
            {detailData.customerNotes && (
            <PermissionGate moduleId="deliveryqc" optionId="deliveryqc_notes">
              <div className="qc-detail-card" style={{ backgroundColor: '#fffbea', borderLeft: '4px solid #f59e0b', marginBottom: '20px' }}>
                <h3><i className="fas fa-comment-dots"></i> Customer Notes</h3>
                <div style={{ padding: '15px 20px', whiteSpace: 'pre-wrap', color: '#78350f', fontSize: '14px', lineHeight: '1.6' }}>
                  {detailData.customerNotes}
                </div>
              </div>
            </PermissionGate>
            )}
            </div>
          </div>
        </div>
      ) : null}

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

      {showQCConfirmation && (
        <ConfirmationPopup
          isVisible={showQCConfirmation}
          message="Quality Check Evaluation Complete. Please select an action:"
          confirmText="Approve Quality Check"
          secondaryActionText="Reject Quality Check"
          cancelText="Cancel"
          confirmButtonStyle={{
            backgroundColor: '#27ae60',
            color: 'white',
            padding: '12px 28px',
            fontSize: '15px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'center',
            minWidth: 'auto',
            transition: 'all 0.3s ease'
          }}
          secondaryActionStyle={{
            backgroundColor: '#e74c3c',
            color: 'white',
            padding: '12px 28px',
            fontSize: '15px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'center',
            minWidth: 'auto',
            transition: 'all 0.3s ease'
          }}
          cancelButtonStyle={{
            backgroundColor: '#f5f5f5',
            color: '#333',
            border: '1px solid #ddd',
            padding: '12px 28px',
            fontSize: '15px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'center',
            minWidth: 'auto',
            transition: 'all 0.3s ease'
          }}
          onConfirm={handleApproveQC}
          secondaryAction={handleRejectQC}
          onCancel={() => setShowQCConfirmation(false)}
        />
      )}
      
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
          <button className="dropdown-item view" onClick={() => { viewDetails(filteredJobs.find(j => j.id === activeDropdown)); setActiveDropdown(null); }}>
            <i className="fas fa-eye"></i> View Details
          </button>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item delete" onClick={() => { handleShowCancelConfirmation(activeDropdown); }}>
            <i className="fas fa-times-circle"></i> Cancel Order
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

export default QualityCheckModule
