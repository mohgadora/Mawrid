package com.mawrid.app

import com.mawrid.app.domain.model.PriceTier
import com.mawrid.app.domain.model.Product
import com.mawrid.app.domain.model.Variant

/**
 * Shared builders for the framework-free unit tests. Keeps each test focused on
 * the field(s) under test while filling the rest of the (large) [Product]
 * constructor with harmless defaults.
 */
object TestFixtures {

    fun product(
        id: String = "p1",
        basePriceUsd: Double = 20.0,
        marketPriceUsd: Double? = null,
        tiers: List<PriceTier> = emptyList(),
        moq: Int = 1,
    ): Product = Product(
        id = id,
        nameAr = "منتج",
        nameEn = "Product",
        supplierAr = "مورّد",
        supplierEn = "Supplier",
        supplierId = "s1",
        imageUrl = null,
        basePriceUsd = basePriceUsd,
        oldPriceUsd = null,
        marketPriceUsd = marketPriceUsd,
        rating = 4.5,
        moq = moq,
        verified = true,
        categorySlug = null,
        tiers = tiers,
    )

    fun variant(
        id: String = "v1",
        priceDeltaUsd: Double = 0.0,
        inStock: Boolean = true,
    ): Variant = Variant(
        id = id,
        nameAr = "خيار",
        nameEn = "Option",
        priceDeltaUsd = priceDeltaUsd,
        inStock = inStock,
    )
}
