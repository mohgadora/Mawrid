package com.mawrid.app.core.money

import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class MoneyTest {

    private var savedMerchant = false

    @Before
    fun setUp() {
        // Money.merchantPricing is process-global; snapshot and default it off so
        // each test starts from the consumer-pricing baseline.
        savedMerchant = Money.merchantPricing
        Money.merchantPricing = false
    }

    @After
    fun tearDown() {
        Money.merchantPricing = savedMerchant
    }

    // ---- retailUsd -------------------------------------------------------

    @Test
    fun retailUsd_appliesMarkup_forConsumers() {
        Money.merchantPricing = false
        assertEquals(115.0, Money.retailUsd(100.0), 1e-9)
    }

    @Test
    fun retailUsd_skipsMarkup_forMerchants() {
        Money.merchantPricing = true
        assertEquals(100.0, Money.retailUsd(100.0), 1e-9)
    }

    // ---- format ----------------------------------------------------------

    @Test
    fun format_convertsUsdToSar_arabicSymbolAfterAmount() {
        // 100 USD * 3.75 = 375 SAR, symbol trails the amount in Arabic.
        assertEquals("375 ر.س", Money.format(100.0, Currency.SAR, isArabic = true))
    }

    @Test
    fun format_englishPutsSymbolBeforeAmount() {
        assertEquals("\$100", Money.format(100.0, Currency.USD, isArabic = false))
    }

    @Test
    fun format_groupsThousands() {
        assertEquals("\$1,000", Money.format(1000.0, Currency.USD, isArabic = false))
    }

    @Test
    fun format_honoursCurrencyDecimals_kwdHasThree() {
        // 0.1 USD * 0.31 = 0.031 KWD -> KWD keeps 3 fraction digits.
        assertEquals("KWD0.031", Money.format(0.1, Currency.KWD, isArabic = false))
    }

    @Test
    fun format_usesWesternNumerals_evenInArabic() {
        // Regression guard: prices must render 0-9, never Eastern Arabic digits (٠-٩).
        val out = Money.format(1234.0, Currency.SAR, isArabic = true)
        assertTrue("expected ASCII digits in \"$out\"", out.any { it in '0'..'9' })
        val easternArabicDigits = '٠'..'٩'
        assertFalse(
            "must not contain Eastern Arabic numerals in \"$out\"",
            out.any { it in easternArabicDigits },
        )
    }
}
