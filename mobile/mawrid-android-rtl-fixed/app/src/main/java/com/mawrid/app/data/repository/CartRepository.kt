package com.mawrid.app.data.repository

import com.mawrid.app.domain.model.CartLine
import com.mawrid.app.domain.model.Product
import com.mawrid.app.domain.model.Variant
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import javax.inject.Inject
import javax.inject.Singleton

/**
 * In-memory cart (app-process lifetime). A single source of truth shared across
 * screens via StateFlow. MOQ is enforced here so no screen can push a line below
 * a product's minimum order quantity.
 *
 * Persistence across restarts is a deliberate follow-up: lines hold full Product
 * snapshots, so persisting means serializing them or rehydrating by id on launch.
 */
@Singleton
class CartRepository @Inject constructor() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private val _lines = MutableStateFlow<List<CartLine>>(emptyList())
    val lines: StateFlow<List<CartLine>> = _lines.asStateFlow()

    /** Total carton count across all lines — drives the bottom-nav badge. */
    val itemCount: StateFlow<Int> = _lines
        .map { lines -> lines.sumOf { it.qty } }
        .stateIn(scope, SharingStarted.Eagerly, 0)

    /**
     * Add [qty] cartons of [product] (with optional [variant]). If the line
     * already exists the quantities are merged. The result is floored at the
     * product's MOQ.
     */
    fun add(product: Product, variant: Variant?, qty: Int) {
        val floor = product.moq.coerceAtLeast(1)
        val key = product.id + "#" + (variant?.id ?: "")
        _lines.update { lines ->
            val existing = lines.firstOrNull { it.key == key }
            if (existing == null) {
                lines + CartLine(product, variant, qty.coerceAtLeast(floor))
            } else {
                lines.map {
                    if (it.key == key) it.copy(qty = (it.qty + qty).coerceAtLeast(floor)) else it
                }
            }
        }
    }

    /** Set an absolute quantity for a line, never below its product's MOQ. */
    fun setQty(key: String, qty: Int) {
        _lines.update { lines ->
            lines.map {
                if (it.key == key) it.copy(qty = qty.coerceAtLeast(it.product.moq.coerceAtLeast(1))) else it
            }
        }
    }

    fun remove(key: String) = _lines.update { lines -> lines.filterNot { it.key == key } }

    fun clear() = _lines.update { emptyList() }
}
