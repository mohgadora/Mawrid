package com.mawrid.app.ui.partner

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.PartnerRepository
import com.mawrid.app.domain.model.AdminSection
import com.mawrid.app.domain.model.AdminSimpleRow
import com.mawrid.app.ui.navigation.Routes
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PartnerListState(
    val loading: Boolean = true,
    val rows: List<AdminSimpleRow> = emptyList(),
    val error: String? = null,
)

@HiltViewModel
class PartnerGenericViewModel @Inject constructor(
    private val partner: PartnerRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val key: String = (savedStateHandle.get<String>(Routes.ARG_SECTION_KEY) ?: "").replace("~", "/")
    val section: AdminSection = PartnerSections.section(key)

    private val _state = MutableStateFlow(PartnerListState())
    val state: StateFlow<PartnerListState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            partner.list(section.key)
                .onSuccess { rows -> _state.update { it.copy(loading = false, rows = rows) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }
}
