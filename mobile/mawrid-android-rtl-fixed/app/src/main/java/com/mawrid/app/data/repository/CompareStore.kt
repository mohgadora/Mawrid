package com.mawrid.app.data.repository

import com.mawrid.app.domain.model.Product
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
 * In-memory product comparison set (app-process lifetime), capped at [MAX].
 * A single source of truth shared across screens via StateFlow, like the cart.
 */
@Singleton
class CompareStore @Inject constructor() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private val _products = MutableStateFlow<List<Product>>(emptyList())
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    val count: StateFlow<Int> = _products
        .map { it.size }
        .stateIn(scope, SharingStarted.Eagerly, 0)

    fun contains(productId: String): Boolean = _products.value.any { it.id == productId }

    /** Add or remove [product]; no-op add once [MAX] is reached. Returns the new membership. */
    fun toggle(product: Product): Boolean {
        val present = contains(product.id)
        _products.update { list ->
            when {
                present -> list.filterNot { it.id == product.id }
                list.size >= MAX -> list
                else -> list + product
            }
        }
        return !present && contains(product.id)
    }

    fun remove(productId: String) = _products.update { list -> list.filterNot { it.id == productId } }

    fun clear() = _products.update { emptyList() }

    companion object {
        const val MAX = 4
    }
}
