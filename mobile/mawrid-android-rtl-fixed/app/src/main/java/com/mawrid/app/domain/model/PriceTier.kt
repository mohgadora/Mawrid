package com.mawrid.app.domain.model

/**
 * A wholesale price break. The more cartons you order, the cheaper each carton.
 *
 * Framework-free and USD-based, like everything under domain/. `minQty` is the
 * lowest quantity that unlocks this tier; `pricePerCartonUsd` is the wholesale
 * price per carton (before any consumer retail markup / FX conversion).
 */
data class PriceTier(
    val minQty: Int,
    val pricePerCartonUsd: Double,
)
