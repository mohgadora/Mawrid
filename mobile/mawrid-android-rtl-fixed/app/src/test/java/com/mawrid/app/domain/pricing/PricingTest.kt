package com.mawrid.app.domain.pricing

import com.mawrid.app.TestFixtures
import com.mawrid.app.domain.model.PriceTier
import org.junit.Assert.assertEquals
import org.junit.Test

class PricingTest {

    private val tiers = listOf(
        PriceTier(minQty = 1, pricePerCartonUsd = 20.0),
        PriceTier(minQty = 10, pricePerCartonUsd = 18.0),
        PriceTier(minQty = 50, pricePerCartonUsd = 15.0),
    )

    // ---- unitPriceUsd ----------------------------------------------------

    @Test
    fun unitPrice_fallsBackToBasePrice_whenNoTiers() {
        val p = TestFixtures.product(basePriceUsd = 22.0, tiers = emptyList())
        assertEquals(22.0, Pricing.unitPriceUsd(p, qty = 5), 1e-9)
    }

    @Test
    fun unitPrice_picksHighestApplicableTier() {
        val p = TestFixtures.product(basePriceUsd = 99.0, tiers = tiers)
        assertEquals(20.0, Pricing.unitPriceUsd(p, qty = 5), 1e-9)   // >=1 only
        assertEquals(18.0, Pricing.unitPriceUsd(p, qty = 25), 1e-9)  // >=10
        assertEquals(15.0, Pricing.unitPriceUsd(p, qty = 100), 1e-9) // >=50
    }

    @Test
    fun unitPrice_belowLowestTier_fallsBackToBasePrice() {
        val p = TestFixtures.product(
            basePriceUsd = 30.0,
            tiers = listOf(PriceTier(minQty = 10, pricePerCartonUsd = 18.0)),
        )
        assertEquals(30.0, Pricing.unitPriceUsd(p, qty = 5), 1e-9)
    }

    // ---- lineTotalUsd ----------------------------------------------------

    @Test
    fun lineTotal_isUnitPriceTimesQty() {
        val p = TestFixtures.product(tiers = tiers)
        // qty 10 -> tier 18.0 -> 180.0
        assertEquals(180.0, Pricing.lineTotalUsd(p, qty = 10), 1e-9)
    }

    // ---- savingsPerCartonUsd --------------------------------------------

    @Test
    fun savings_isZero_whenNoMarketPrice() {
        val p = TestFixtures.product(marketPriceUsd = null, tiers = tiers)
        assertEquals(0.0, Pricing.savingsPerCartonUsd(p, qty = 10), 1e-9)
    }

    @Test
    fun savings_isMarketMinusWholesale_whenCheaper() {
        val p = TestFixtures.product(marketPriceUsd = 30.0, tiers = tiers)
        // qty 10 -> wholesale 18 -> savings 12
        assertEquals(12.0, Pricing.savingsPerCartonUsd(p, qty = 10), 1e-9)
    }

    @Test
    fun savings_coercedToZero_whenWholesaleExceedsMarket() {
        val p = TestFixtures.product(marketPriceUsd = 10.0, tiers = tiers)
        // qty 5 -> wholesale 20 > market 10 -> no negative savings
        assertEquals(0.0, Pricing.savingsPerCartonUsd(p, qty = 5), 1e-9)
    }

    // ---- savingsPercent --------------------------------------------------

    @Test
    fun savingsPercent_isZero_whenMarketMissingOrZero() {
        assertEquals(0, Pricing.savingsPercent(TestFixtures.product(marketPriceUsd = null), 10))
        assertEquals(0, Pricing.savingsPercent(TestFixtures.product(marketPriceUsd = 0.0), 10))
    }

    @Test
    fun savingsPercent_isTruncatedShareOfMarket() {
        val p = TestFixtures.product(marketPriceUsd = 30.0, tiers = tiers)
        // qty 10 -> savings 12 / 30 = 40%
        assertEquals(40, Pricing.savingsPercent(p, qty = 10))
    }
}
