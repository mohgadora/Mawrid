package com.mawrid.app.domain.model

import com.mawrid.app.TestFixtures
import com.mawrid.app.core.money.Money
import com.mawrid.app.core.money.SHIPPING_FLAT_USD
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Before
import org.junit.Test

class CartSummaryTest {

    private var savedMerchant = false

    @Before
    fun setUp() {
        savedMerchant = Money.merchantPricing
        Money.merchantPricing = false // consumer pricing: retail markup applies
    }

    @After
    fun tearDown() {
        Money.merchantPricing = savedMerchant
    }

    private fun line(basePriceUsd: Double, qty: Int, marketPriceUsd: Double? = null) =
        CartLine(
            product = TestFixtures.product(
                basePriceUsd = basePriceUsd,
                marketPriceUsd = marketPriceUsd,
            ),
            variant = null,
            qty = qty,
        )

    @Test
    fun from_emptyLines_returnsEmptySingleton() {
        assertSame(CartSummary.EMPTY, CartSummary.from(emptyList()))
    }

    @Test
    fun from_belowFreeThreshold_addsFlatShipping_notMarkedUp() {
        // wholesale subtotal 200 -> retail 230 (< 500) -> flat $15 shipping.
        val summary = CartSummary.from(listOf(line(basePriceUsd = 20.0, qty = 10)))

        assertEquals(200.0, summary.subtotalUsd, 1e-9)          // subtotal stays wholesale
        assertEquals(SHIPPING_FLAT_USD, summary.shippingUsd, 1e-9) // shipping is the flat fee, un-marked-up
        assertEquals(230.0 + SHIPPING_FLAT_USD, summary.totalUsd, 1e-9) // retail(subtotal) + shipping
        assertEquals(10, summary.itemCount)
    }

    @Test
    fun from_retailSubtotalAtOrAboveThreshold_shipsFree() {
        // wholesale 500 -> retail 575 (>= 500) -> free shipping, total == retail.
        val summary = CartSummary.from(listOf(line(basePriceUsd = 50.0, qty = 10)))

        assertEquals(0.0, summary.shippingUsd, 1e-9)
        assertEquals(575.0, summary.totalUsd, 1e-9)
    }

    @Test
    fun from_thresholdComparesRetailSubtotal_notWholesale() {
        // wholesale 460 is < 500, but retail 460*1.15 = 529 >= 500 -> free shipping.
        // Guards that the free-shipping bar is measured against the consumer price.
        val summary = CartSummary.from(listOf(line(basePriceUsd = 46.0, qty = 10)))

        assertEquals(0.0, summary.shippingUsd, 1e-9)
        assertEquals(529.0, summary.totalUsd, 1e-9)
    }

    @Test
    fun from_sumsSavingsAcrossLines() {
        // market 30, wholesale 20, qty 10 -> savings 100 for the line.
        val summary = CartSummary.from(
            listOf(line(basePriceUsd = 20.0, qty = 10, marketPriceUsd = 30.0)),
        )
        assertEquals(100.0, summary.savingsUsd, 1e-9)
    }
}
