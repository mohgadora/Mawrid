import { describe, it, expect } from 'vitest'
import { orderTotals } from './order-totals'

describe('orderTotals', () => {
  it('sums line subtotals and adds shipping', () => {
    expect(orderTotals([10, 20, 5.5], 15)).toEqual({ subtotalUsd: 35.5, totalUsd: 50.5 })
  })

  it('subtracts the discount', () => {
    expect(orderTotals([100], 10, 25)).toEqual({ subtotalUsd: 100, totalUsd: 85 })
  })

  it('avoids float drift on fractional lines', () => {
    expect(orderTotals([0.1, 0.2], 0, 0)).toEqual({ subtotalUsd: 0.3, totalUsd: 0.3 })
  })

  it('floors the total at zero when the discount exceeds subtotal + shipping', () => {
    expect(orderTotals([20], 5, 100)).toEqual({ subtotalUsd: 20, totalUsd: 0 })
  })

  it('handles an empty order', () => {
    expect(orderTotals([], 0, 0)).toEqual({ subtotalUsd: 0, totalUsd: 0 })
  })
})
