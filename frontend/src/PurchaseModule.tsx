import { useState, useMemo } from 'react'
import './PurchaseModule.css'

const PurchaseModule = ({ currentUser }) => {
  const [screenState, setScreenState] = useState('main') // main, details, newRequest
  const [currentDetailsRequest, setCurrentDetailsRequest] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [newRequestData, setNewRequestData] = useState({
    request: { item: '', type: '', description: '' },
    supplier: null,
    supplierType: null,
    pricePerUnit: 0,
    availableQty: 1,
    uploadedFile: null
  })
  const [requestList, setRequestList] = useState([
    {
      id: 'PR-1001',
      item: 'Laptop Dell',
      type: 'Assets',
      est: 2150,
      qty: 2,
      supplier: 'DellDistri',
      initStat: 'Approved',
      quotStat: 'Pending',
      poStat: '—',
      suppliersDetails: [
        { name: 'DellDistri', pricePerUnit: 2150, availableQty: 5, totalQuot: 4300, file: 'quotation_dell.pdf' }
      ],
      description: 'Business laptop 16GB RAM, 512GB SSD',
      createdDate: new Date().toLocaleDateString()
    }
  ])

  const existingSuppliersDB = [
    { id: 'SUP001', name: 'DellDistri', address: '123 IT Park', contact: 'John Doe', phone: '+1 555 1234', email: 'dell@distri.com' },
    { id: 'SUP002', name: 'FurniCorp', address: '456 Office Ave', contact: 'Jane Smith', phone: '+1 555 5678', email: 'sales@furnicorp.com' },
    { id: 'SUP003', name: 'OfficePlus', address: '789 Business Blvd', contact: 'Mike Lee', phone: '+1 555 9012', email: 'contact@officeplus.com' },
    { id: 'SUP004', name: 'VisualInc', address: '321 Media St', contact: 'Sarah Brown', phone: '+1 555 3456', email: 'info@visualinc.com' }
  ]

  // Filter and paginate
  const filteredRequests = useMemo(() => {
    return requestList.filter(req =>
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.supplier.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [requestList, searchQuery])

  const totalPages = Math.ceil(filteredRequests.length / pageSize)
  const paginatedRequests = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    return filteredRequests.slice(startIdx, startIdx + pageSize)
  }, [filteredRequests, currentPage, pageSize])

  const handleShowDetails = (request) => {
    setCurrentDetailsRequest(request)
    setScreenState('details')
  }

  const handleBackToMain = () => {
    setScreenState('main')
    setCurrentDetailsRequest(null)
  }

  const handleNewRequest = () => {
    setCurrentStep(1)
    setNewRequestData({
      request: { item: '', type: '', description: '' },
      supplier: null,
      supplierType: null,
      pricePerUnit: 0,
      availableQty: 1,
      uploadedFile: null
    })
    setScreenState('newRequest')
  }

  const showModalMessage = (msg) => {
    setModalMessage(msg)
    setShowModal(true)
  }

  const handleStep1Submit = (itemName, itemType, description) => {
    setNewRequestData(prev => ({
      ...prev,
      request: { item: itemName, type: itemType, description }
    }))
    setCurrentStep(2)
  }

  const handleStep2Submit = (supplierType, supplierData) => {
    setNewRequestData(prev => ({
      ...prev,
      supplierType,
      supplier: supplierData
    }))
    if (supplierType === 'skip') {
      setCurrentStep(4)
    } else {
      setCurrentStep(3)
    }
  }

  const handleStep3Submit = (pricePerUnit, availableQty, uploadedFile) => {
    setNewRequestData(prev => ({
      ...prev,
      pricePerUnit: parseFloat(pricePerUnit) || 0,
      availableQty: parseInt(availableQty) || 1,
      uploadedFile
    }))
    setCurrentStep(4)
  }

  const handleSubmitRequest = () => {
    const newId = 'PR-' + Math.floor(Math.random() * 900 + 1000)
    const supplierEntry = newRequestData.supplier ? {
      name: newRequestData.supplier.name || 'Unknown',
      pricePerUnit: newRequestData.pricePerUnit,
      availableQty: newRequestData.availableQty,
      totalQuot: newRequestData.pricePerUnit * newRequestData.availableQty,
      file: newRequestData.uploadedFile
    } : null

    const newRequest = {
      id: newId,
      item: newRequestData.request.item,
      type: newRequestData.request.type,
      est: newRequestData.pricePerUnit,
      qty: newRequestData.availableQty,
      supplier: newRequestData.supplier ? newRequestData.supplier.name : '—',
      initStat: 'Pending',
      quotStat: '—',
      poStat: '—',
      suppliersDetails: supplierEntry ? [supplierEntry] : [],
      description: newRequestData.request.description,
      createdDate: new Date().toLocaleDateString()
    }

    setRequestList([...requestList, newRequest])
    showModalMessage(`Request ${newId} has been created successfully.`)
    setScreenState('main')
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      if (currentStep === 4 && newRequestData.supplierType === 'skip') {
        setCurrentStep(2)
      } else {
        setCurrentStep(currentStep - 1)
      }
    }
  }

  const handleCancelRequest = () => {
    setScreenState('main')
  }

  // Main List View
  if (screenState === 'main') {
    return (
      <section className="purchase-module-section">
        <div className="app-container">
          <div className="app-header">
            <div className="header-left">
              <h1>
                <i className="fas fa-shopping-cart"></i> Purchase Management
              </h1>
            </div>
          </div>

          <div className="main-content">
            <div className="search-section">
              <div className="search-container">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  className="smart-search-input"
                  placeholder="Search by Request ID, Item, or Supplier..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
              <div className="search-stats">
                Showing {paginatedRequests.length} of {filteredRequests.length} requests
              </div>
            </div>

            <div className="results-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-list"></i> Purchase Requests
                </h2>
                <div className="pagination-controls">
                  <div className="records-per-page">
                    <label>Records per page:</label>
                    <select
                      className="page-size-select"
                      value={pageSize}
                      onChange={e => {
                        setPageSize(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <button className="btn-new-job" onClick={handleNewRequest}>
                    <i className="fas fa-plus-circle"></i> New Request
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Item</th>
                      <th>Type</th>
                      <th>Unit (QAR)</th>
                      <th>Qty</th>
                      <th>Total (QAR)</th>
                      <th>Supplier</th>
                      <th>Status</th>
                      <th>Quotation</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRequests.map(request => (
                      <tr key={request.id}>
                        <td><strong>{request.id}</strong></td>
                        <td>{request.item}</td>
                        <td>{request.type}</td>
                        <td>{request.est} QAR</td>
                        <td>{request.qty}</td>
                        <td><strong>{(request.est * request.qty)} QAR</strong></td>
                        <td>{request.supplier}</td>
                        <td>
                          <span className={`status-badge status-${request.initStat.toLowerCase()}`}>
                            {request.initStat}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${request.quotStat.toLowerCase()}`}>
                            {request.quotStat}
                          </span>
                        </td>
                        <td className="date-column">{request.createdDate}</td>
                        <td>
                          <button
                            className="btn-view-details"
                            onClick={() => handleShowDetails(request)}
                          >
                            <i className="fas fa-eye"></i> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination-footer">
                <div className="pagination-info">
                  Page {currentPage} of {totalPages} ({filteredRequests.length} total requests)
                </div>
                <div className="pagination-buttons">
                  <button
                    className="btn-pagination"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-chevron-left"></i> Previous
                  </button>
                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`page-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn-pagination"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-badge">
          <i className="fas fa-scale-balanced"></i> Approval Limits: &lt;1k:1 &nbsp; 1k-5k:1 &nbsp; 5k-15k:2 &nbsp; 15k-30k:3 &nbsp; &gt;30k:4
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content">
              <i className="fas fa-check-circle"></i>
              <h3>Success!</h3>
              <p>{modalMessage}</p>
              <button onClick={() => setShowModal(false)}>OK</button>
            </div>
          </div>
        )}
      </section>
    )
  }

  // Details View
  if (screenState === 'details' && currentDetailsRequest) {
    return (
      <section className="purchase-module-section">
        <div className="app-container">
          <div className="app-header">
            <div className="header-left">
              <h1>
                <i className="fas fa-clipboard"></i> Request Details
              </h1>
            </div>
          </div>

          <div className="main-content">
            <div className="details-content">
              <button className="btn-back" onClick={handleBackToMain}>
                <i className="fas fa-arrow-left"></i> Back to Requests
              </button>

              <div className="detail-card">
                <h3><i className="fas fa-info-circle"></i> Request Information</h3>
                <div className="info-grid">
                  <div className="info-item"><span className="info-label">Request ID</span><span className="info-value">{currentDetailsRequest.id}</span></div>
                  <div className="info-item"><span className="info-label">Item Name</span><span className="info-value">{currentDetailsRequest.item}</span></div>
                  <div className="info-item"><span className="info-label">Item Type</span><span className="info-value">{currentDetailsRequest.type}</span></div>
                  <div className="info-item full-row"><span className="info-label">Description</span><span className="info-value">{currentDetailsRequest.description || '—'}</span></div>
                  <div className="info-item"><span className="info-label">Quantity</span><span className="info-value">{currentDetailsRequest.qty}</span></div>
                  <div className="info-item"><span className="info-label">Price per Unit</span><span className="info-value">{currentDetailsRequest.est} QAR</span></div>
                  <div className="info-item"><span className="info-label">Total Price</span><span className="info-value">{(currentDetailsRequest.est * currentDetailsRequest.qty).toFixed(2)} QAR</span></div>
                  <div className="info-item"><span className="info-label">Request Date</span><span className="info-value">{currentDetailsRequest.createdDate}</span></div>
                </div>
              </div>

              <div className="detail-card">
                <h3><i className="fas fa-building"></i> Supplier Information</h3>
                {currentDetailsRequest.suppliersDetails && currentDetailsRequest.suppliersDetails.length > 0 ? (
                  <div className="supplier-list">
                    {currentDetailsRequest.suppliersDetails.map((supplier, idx) => (
                      <div key={idx} className="supplier-item">
                        <div className="supplier-field"><span className="tag">Supplier Name</span><div className="value">{supplier.name}</div></div>
                        <div className="supplier-field"><span className="tag">Price/Unit</span><div className="value">{supplier.pricePerUnit} QAR</div></div>
                        <div className="supplier-field"><span className="tag">Available Qty</span><div className="value">{supplier.availableQty}</div></div>
                        <div className="supplier-field"><span className="tag">Total Quote</span><div className="value">{supplier.totalQuot} QAR</div></div>
                        {supplier.file ? (
                          <button className="pdf-download-btn" onClick={() => alert(`Downloading ${supplier.file}`)}>
                            <i className="fas fa-file-pdf"></i> PDF
                          </button>
                        ) : (
                          <span className="pdf-download-btn no-pdf">
                            <i className="fas fa-ban"></i> No PDF
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No supplier quotations added yet.</p>
                )}
              </div>

              <div className="detail-actions">
                <button className="btn-secondary" onClick={handleBackToMain}>
                  <i className="fas fa-times"></i> Close
                </button>
              </div>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content">
              <i className="fas fa-check-circle"></i>
              <h3>Success!</h3>
              <p>{modalMessage}</p>
              <button onClick={() => setShowModal(false)}>OK</button>
            </div>
          </div>
        )}
      </section>
    )
  }

  // New Request View
  if (screenState === 'newRequest') {
    return (
      <section className="purchase-module-section">
        <div className="app-container">
          <div className="app-header">
            <div className="header-left">
              <h1>
                <i className="fas fa-plus-circle"></i> New Purchase Request
              </h1>
            </div>
          </div>

          <div className="main-content">
            <div className="new-request-content">
              <button className="btn-back" onClick={handleCancelRequest}>
                <i className="fas fa-arrow-left"></i> Back
              </button>

              <ProgressBar currentStep={currentStep} totalSteps={4} />

              {currentStep === 1 && <Step1Form onSubmit={handleStep1Submit} />}
              {currentStep === 2 && <Step2Form onSubmit={handleStep2Submit} suppliers={existingSuppliersDB} />}
              {currentStep === 3 && <Step3Form onSubmit={handleStep3Submit} />}
              {currentStep === 4 && (
                <Step4Confirmation
                  data={newRequestData}
                  onSubmit={handleSubmitRequest}
                  onBack={handlePrevStep}
                />
              )}

              <div className="step-navigation">
                {currentStep > 1 && (
                  <button className="btn-secondary" onClick={handlePrevStep}>
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                )}
                {currentStep === 1 && (
                  <button className="btn-secondary" onClick={handleCancelRequest}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content">
              <i className="fas fa-check-circle"></i>
              <h3>Success!</h3>
              <p>{modalMessage}</p>
              <button onClick={() => setShowModal(false)}>OK</button>
            </div>
          </div>
        )}
      </section>
    )
  }
}

function ProgressBar({ currentStep, totalSteps }) {
  return (
    <div className="progress-bar">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
        <div key={step} className={`progress-step ${step === currentStep ? 'active' : step < currentStep ? 'completed' : ''}`}>
          {step}
          <span className="step-label">
            {step === 1 ? 'Request' : step === 2 ? 'Supplier' : step === 3 ? 'Pricing' : 'Confirm'}
          </span>
        </div>
      ))}
    </div>
  )
}

function Step1Form({ onSubmit }) {
  const [itemName, setItemName] = useState('Office laptop')
  const [itemType, setItemType] = useState('Assets')
  const [description, setDescription] = useState('Business laptop')

  return (
    <div className="form-step active">
      <div className="form-container">
        <div className="form-grid">
          <div className="field-group">
            <label><i className="fas fa-box"></i> Item name</label>
            <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} />
          </div>
          <div className="field-group">
            <label><i className="fas fa-tag"></i> Item type</label>
            <select value={itemType} onChange={e => setItemType(e.target.value)}>
              <option>Assets</option>
              <option>Expenses</option>
            </select>
          </div>
          <div className="field-group full-width">
            <label><i className="fas fa-align-left"></i> Description</label>
            <textarea rows="2" value={description} onChange={e => setDescription(e.target.value)}></textarea>
          </div>
        </div>
        <div className="action-buttons">
          <button className="btn btn-outline">Cancel</button>
          <button className="btn btn-primary" onClick={() => onSubmit(itemName, itemType, description)}>
            Next: Supplier
          </button>
        </div>
      </div>
    </div>
  )
}

function Step2Form({ onSubmit, suppliers }) {
  const [supplierType, setSupplierType] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [newSupplier, setNewSupplier] = useState({
    name: 'NewCo',
    address: '456 Trade St',
    contact: 'Alice Green',
    phone: '+1 555 9876',
    email: 'alice@newco.com'
  })

  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="form-step active">
      <div className="form-container">
        <div className="option-row">
          <div className={`option-card ${supplierType === 'skip' ? 'selected' : ''}`} onClick={() => setSupplierType('skip')}>
            <i className="fas fa-forward"></i>
            <h4>Skip</h4>
            <p>Proceed without supplier</p>
          </div>
          <div className={`option-card ${supplierType === 'new' ? 'selected' : ''}`} onClick={() => setSupplierType('new')}>
            <i className="fas fa-plus-circle"></i>
            <h4>New supplier</h4>
            <p>Enter supplier details</p>
          </div>
          <div className={`option-card ${supplierType === 'existing' ? 'selected' : ''}`} onClick={() => setSupplierType('existing')}>
            <i className="fas fa-database"></i>
            <h4>Existing supplier</h4>
            <p>Search from list</p>
          </div>
        </div>

        {supplierType === 'new' && (
          <div>
            <h4 style={{ marginBottom: '1rem' }}>New supplier</h4>
            <div className="form-grid">
              <div className="field-group full-width">
                <label>Supplier name</label>
                <input type="text" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
              </div>
              <div className="field-group full-width">
                <label>Address</label>
                <input type="text" value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} />
              </div>
              <div className="field-group">
                <label>Contact person</label>
                <input type="text" value={newSupplier.contact} onChange={e => setNewSupplier({...newSupplier, contact: e.target.value})} />
              </div>
              <div className="field-group">
                <label>Contact number</label>
                <input type="text" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
              </div>
              <div className="field-group full-width">
                <label>Email address</label>
                <input type="email" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} />
              </div>
            </div>
          </div>
        )}

        {supplierType === 'existing' && (
          <div>
            <h4 style={{ marginBottom: '1rem' }}>Search existing supplier</h4>
            <div className="field-group">
              <label>Supplier name</label>
              <input type="text" placeholder="Type name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="supplier-search-result" style={{ marginTop: '1rem' }}>
              {filteredSuppliers.length === 0 ? (
                <p>No matches</p>
              ) : (
                filteredSuppliers.map(supplier => (
                  <div
                    key={supplier.id}
                    className={`supplier-match ${selectedSupplier?.id === supplier.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    <span>
                      <strong>{supplier.name}</strong>
                      <br />
                      <small>{supplier.contact} | {supplier.email}</small>
                    </span>
                    <i className="fas fa-chevron-right"></i>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="action-buttons" style={{ marginTop: '2rem' }}>
          <button className="btn btn-outline" onClick={() => onSubmit('cancel')}>Back</button>
          <button className="btn btn-primary" onClick={() => {
            if (supplierType === 'skip') {
              onSubmit('skip', null)
            } else if (supplierType === 'new') {
              onSubmit('new', newSupplier)
            } else if (supplierType === 'existing') {
              onSubmit('existing', selectedSupplier)
            }
          }}>Next: Pricing</button>
        </div>
      </div>
    </div>
  )
}

function Step3Form({ onSubmit }) {
  const [pricePerUnit, setPricePerUnit] = useState('2150')
  const [availableQty, setAvailableQty] = useState('5')
  const [uploadedFile, setUploadedFile] = useState(null)

  return (
    <div className="form-step active">
      <div className="form-container">
        <div className="form-grid">
          <div className="field-group">
            <label><i className="fas fa-coins"></i> Price per unit (QAR)</label>
            <input type="number" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} min="0" step="0.01" />
          </div>
          <div className="field-group">
            <label><i className="fas fa-hashtag"></i> Available quantity</label>
            <input type="number" value={availableQty} onChange={e => setAvailableQty(e.target.value)} min="1" />
          </div>
          <div className="field-group full-width">
            <label><i className="fas fa-file-pdf"></i> Upload quotation (optional)</label>
            <input type="file" onChange={e => setUploadedFile(e.target.files[0])} accept=".pdf,.doc,.docx,.xls,.xlsx" />
          </div>
        </div>
        <div className="action-buttons">
          <button className="btn btn-outline">Back</button>
          <button className="btn btn-primary" onClick={() => onSubmit(pricePerUnit, availableQty, uploadedFile?.name)}>Next: Confirmation</button>
        </div>
      </div>
    </div>
  )
}

function Step4Confirmation({ data, onSubmit }) {
  const { request, supplier, supplierType, pricePerUnit, availableQty, uploadedFile } = data
  const total = pricePerUnit * availableQty

  let supplierHtml = ''
  if (supplierType === 'skip' || !supplier) {
    supplierHtml = <div className="summary-row"><span className="summary-label">Supplier</span><span className="summary-value">Not provided (skipped)</span></div>
  } else {
    supplierHtml = (
      <>
        <div className="summary-row"><span className="summary-label">Supplier name</span><span className="summary-value">{supplier.name || ''}</span></div>
        {supplier.address && <div className="summary-row"><span className="summary-label">Address</span><span className="summary-value">{supplier.address}</span></div>}
        {supplier.contact && <div className="summary-row"><span className="summary-label">Contact person</span><span className="summary-value">{supplier.contact}</span></div>}
        {supplier.phone && <div className="summary-row"><span className="summary-label">Contact number</span><span className="summary-value">{supplier.phone}</span></div>}
        {supplier.email && <div className="summary-row"><span className="summary-label">Email</span><span className="summary-value">{supplier.email}</span></div>}
      </>
    )
  }

  return (
    <div className="form-step active">
      <div className="summary-box">
        <h4 style={{ marginBottom: '1rem' }}>Request information</h4>
        <div className="summary-row"><span className="summary-label">Item name</span><span className="summary-value">{request.item}</span></div>
        <div className="summary-row"><span className="summary-label">Item type</span><span className="summary-value">{request.type}</span></div>
        <div className="summary-row"><span className="summary-label">Description</span><span className="summary-value">{request.description}</span></div>
      </div>
      <div className="summary-box">
        <h4 style={{ marginBottom: '1rem' }}>Supplier information</h4>
        {supplierHtml}
        {supplierType !== 'skip' && (
          <>
            <div className="summary-row" style={{ marginTop: '1rem' }}>
              <span className="summary-label">Price per unit</span>
              <span className="summary-value">{pricePerUnit} QAR</span>
            </div>
            <div className="summary-row"><span className="summary-label">Available quantity</span><span className="summary-value">{availableQty}</span></div>
            <div className="summary-row"><span className="summary-label">Total</span><span className="summary-value">{total} QAR</span></div>
            {uploadedFile && <div className="summary-row"><span className="summary-label">Quotation file</span><span className="summary-value"><i className="fas fa-file-pdf"></i> {uploadedFile}</span></div>}
          </>
        )}
      </div>
      <div className="action-buttons">
        <button className="btn btn-outline">Cancel</button>
        <button className="btn btn-primary" onClick={onSubmit}>
          <i className="fas fa-paper-plane"></i> Submit request
        </button>
      </div>
    </div>
  )
}

export default PurchaseModule
