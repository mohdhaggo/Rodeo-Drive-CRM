import './PurchaseModule.css'

interface PurchaseModuleProps {
  currentUser: any
}

const PurchaseModule = ({ currentUser: _currentUser }: PurchaseModuleProps) => {

  return (
    <div className="form-container">
      <h2>Purchase Management</h2>
      <div className="form-grid">
        <div className="field-group full-width">
          <label>Welcome to Purchase Module</label>
          <p>This module handles purchase order management and supplier interactions.</p>
        </div>
      </div>
    </div>
  )
}

export default PurchaseModule
