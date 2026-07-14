package com.mawrid.app.ui.content

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.ContentRepository
import com.mawrid.app.domain.model.ClearanceItem
import com.mawrid.app.domain.model.Deal
import com.mawrid.app.domain.model.FlashSale
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OffersUiState(
    val loading: Boolean = true,
    val deal: Deal? = null,
    val clearance: List<ClearanceItem> = emptyList(),
    val flashSales: List<FlashSale> = emptyList(),
    val error: String? = null,
) {
    val isEmpty: Boolean get() = deal == null && clearance.isEmpty() && flashSales.isEmpty()
}

@HiltViewModel
class OffersViewModel @Inject constructor(
    private val content: ContentRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(OffersUiState())
    val state: StateFlow<OffersUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            // Each source is independent; a 404 on one shouldn't blank the others.
            val deal = content.dealToday().getOrNull()
            val clearance = content.clearance().getOrDefault(emptyList())
            val flash = content.flashSales().getOrDefault(emptyList())
            _state.update {
                it.copy(loading = false, deal = deal, clearance = clearance, flashSales = flash)
            }
        }
    }
}
