import { useEffect, useMemo, useState } from 'react';
import PermissionGate from './PermissionGate';
import { clampDiscountPercent, getDiscountAllowance, parseCurrencyValue } from './discountLimits';

interface Service {
  name: string;
  price: number;
}

interface Product {
  name: string;
  suvPrice: number;
  sedanPrice: number;
}

interface AddServiceScreenProps {
  order: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
  products?: Product[];
  moduleId?: string;
  permissionId?: string;
  servicePriceOptionId?: string;
  serviceDiscountOptionId?: string;
  discountOptionId?: string;
  existingTotalAmount?: number | string;
  existingDiscountAmount?: number | string;
}

function AddServiceScreen({
  order,
  onClose,
  onSubmit,
  products = [],
  moduleId = 'joborder',
  permissionId = 'joborder_pricesummary',
  servicePriceOptionId,
  serviceDiscountOptionId,
  discountOptionId,
  existingTotalAmount,
  existingDiscountAmount,
}: AddServiceScreenProps) {
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const vehicleType = order?.vehicleDetails?.type || 'SUV';
  const resolvedServicePriceOptionId = servicePriceOptionId || `${moduleId}_serviceprice`;
  const resolvedServiceDiscountOptionId = serviceDiscountOptionId || `${moduleId}_servicediscount`;
  const resolvedDiscountOptionId = discountOptionId || `${moduleId}_servicediscount_percent`;

  const handleToggleService = (product: Product) => {
    const price = vehicleType === 'SUV' ? product.suvPrice : product.sedanPrice;
    if (selectedServices.some(s => s.name === product.name)) {
      setSelectedServices(selectedServices.filter(s => s.name !== product.name));
    } else {
      setSelectedServices([...selectedServices, { name: product.name, price }]);
    }
  };

  const formatPrice = (price: number) => `QAR ${price.toLocaleString()}`;
  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const priorOrderTotal = parseCurrencyValue(existingTotalAmount ?? order?.billing?.totalAmount);
  const priorOrderDiscount = parseCurrencyValue(existingDiscountAmount ?? order?.billing?.discount);
  const discountAllowance = useMemo(
    () =>
      getDiscountAllowance({
        optionId: resolvedDiscountOptionId,
        totalAmount: priorOrderTotal + subtotal,
        existingDiscountAmount: priorOrderDiscount,
        currentDiscountBaseAmount: subtotal,
        fallbackPercent: 100,
      }),
    [resolvedDiscountOptionId, priorOrderTotal, priorOrderDiscount, subtotal]
  );

  useEffect(() => {
    setDiscountPercent((prev) => clampDiscountPercent(prev, discountAllowance.maxAdditionalPercent));
  }, [discountAllowance.maxAdditionalPercent]);

  const handleDiscountChange = (rawValue: string) => {
    const requestedPercent = parseFloat(rawValue);
    const safeRequestedPercent = Number.isFinite(requestedPercent) ? requestedPercent : 0;
    setDiscountPercent(clampDiscountPercent(safeRequestedPercent, discountAllowance.maxAdditionalPercent));
  };

  const discount = (subtotal * discountPercent) / 100;
  const total = subtotal - discount;

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
                  <PermissionGate moduleId={moduleId} optionId={resolvedServicePriceOptionId}>
                    <div className="service-price">
                      {formatPrice(vehicleType === 'SUV' ? product.suvPrice : product.sedanPrice)}
                    </div>
                  </PermissionGate>
                </div>
              ))}
            </div>

            <PermissionGate moduleId={moduleId} optionId={permissionId}>
              <div className="price-summary-box">
                <h4>Price Summary</h4>
                <div className="price-row">
                  <span>Services:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <PermissionGate moduleId={moduleId} optionId={resolvedServiceDiscountOptionId}>
                  <div className="price-row">
                    <span>Apply Discount:</span>
                    <div>
                      <PermissionGate moduleId={moduleId} optionId={resolvedDiscountOptionId}>
                        <input
                          type="number"
                          min="0"
                          max={discountAllowance.maxAdditionalPercent}
                          value={discountPercent}
                          onChange={(e) => handleDiscountChange(e.target.value)}
                          style={{ width: '80px' }}
                        />
                        <span> %</span>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Max now: {discountAllowance.maxAdditionalPercent.toFixed(2)}% (Remaining {formatPrice(discountAllowance.remainingAmount)})
                        </div>
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
            </PermissionGate>

            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => onSubmit({ selectedServices, discountPercent })}
                disabled={selectedServices.length === 0}
              >
                Add Services
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddServiceScreen;
