package com.mawrid.app.ui.compare

import androidx.lifecycle.ViewModel
import com.mawrid.app.data.repository.CompareStore
import com.mawrid.app.domain.model.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject

@HiltViewModel
class CompareViewModel @Inject constructor(
    private val store: CompareStore,
) : ViewModel() {

    val products: StateFlow<List<Product>> = store.products

    fun remove(productId: String) = store.remove(productId)
    fun clear() = store.clear()
}
