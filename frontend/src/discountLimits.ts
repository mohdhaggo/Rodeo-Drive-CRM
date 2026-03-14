import { getCurrentUserPercentLimit, getRolePercentLimitForUser } from './roleAccess.ts'

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

const toFiniteNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '')
    if (!cleaned) {
      return 0
    }

    const parsed = Number(cleaned)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

export const parseCurrencyValue = (value: unknown): number => toFiniteNumber(value)

export interface DiscountAllowanceInput {
  optionId: string
  totalAmount: number
  existingDiscountAmount?: number
  currentDiscountBaseAmount: number
  fallbackPercent?: number
  user?: unknown
}

export interface DiscountAllowance {
  roleMaxPercent: number
  roleMaxAmount: number
  existingDiscountAmount: number
  remainingAmount: number
  maxAdditionalPercent: number
}

export const getDiscountAllowance = ({
  optionId,
  totalAmount,
  existingDiscountAmount = 0,
  currentDiscountBaseAmount,
  fallbackPercent = 100,
  user,
}: DiscountAllowanceInput): DiscountAllowance => {
  const normalizedTotalAmount = Math.max(0, toFiniteNumber(totalAmount))
  const normalizedExistingDiscount = Math.max(0, toFiniteNumber(existingDiscountAmount))
  const normalizedCurrentBase = Math.max(0, toFiniteNumber(currentDiscountBaseAmount))

  const roleLimit = user
    ? getRolePercentLimitForUser(user as any, optionId, fallbackPercent)
    : getCurrentUserPercentLimit(optionId, fallbackPercent)

  const roleMaxPercent = clamp(roleLimit, 0, 100)
  const roleMaxAmount = (normalizedTotalAmount * roleMaxPercent) / 100
  const remainingAmount = Math.max(0, roleMaxAmount - normalizedExistingDiscount)

  const maxAdditionalPercent = normalizedCurrentBase > 0
    ? clamp((remainingAmount / normalizedCurrentBase) * 100, 0, 100)
    : 0

  return {
    roleMaxPercent,
    roleMaxAmount,
    existingDiscountAmount: normalizedExistingDiscount,
    remainingAmount,
    maxAdditionalPercent,
  }
}

export const clampDiscountPercent = (requestedPercent: number, maxPercent: number): number => {
  const requested = toFiniteNumber(requestedPercent)
  const allowed = Math.max(0, toFiniteNumber(maxPercent))
  return clamp(requested, 0, allowed)
}

export const clampDiscountAmount = (requestedAmount: number, maxAmount: number): number => {
  const requested = toFiniteNumber(requestedAmount)
  const allowed = Math.max(0, toFiniteNumber(maxAmount))
  return clamp(requested, 0, allowed)
}
