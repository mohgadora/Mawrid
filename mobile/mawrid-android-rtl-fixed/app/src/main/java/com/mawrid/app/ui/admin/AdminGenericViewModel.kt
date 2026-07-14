package com.mawrid.app.ui.admin

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AdminRepository
import com.mawrid.app.domain.model.AdminAction
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

data class AdminGenericState(
    val loading: Boolean = true,
    val rows: List<AdminSimpleRow> = emptyList(),
    val error: String? = null,
    val busyId: String? = null,
    val message: String? = null,
)

@HiltViewModel
class AdminGenericViewModel @Inject constructor(
    private val admin: AdminRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val key: String = (savedStateHandle.get<String>(Routes.ARG_SECTION_KEY) ?: "").replace("~", "/")
    val section: AdminSection = AdminSections.section(key)
    val canAct: Boolean = section.actionKind == AdminAction.APPROVE_REJECT

    private val _state = MutableStateFlow(AdminGenericState())
    val state: StateFlow<AdminGenericState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            admin.list(section.key)
                .onSuccess { rows -> _state.update { it.copy(loading = false, rows = rows) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }

    fun act(id: String, verb: String) {
        if (id.isBlank() || _state.value.busyId != null) return
        _state.update { it.copy(busyId = id) }
        viewModelScope.launch {
            admin.action(section.actionBase, id, verb)
                .onSuccess {
                    _state.update { it.copy(busyId = null, message = if (verb == "approve") "تمت الموافقة" else "تم الرفض") }
                    load()
                }
                .onFailure { e -> _state.update { it.copy(busyId = null, message = e.message ?: "تعذّر تنفيذ الإجراء") } }
        }
    }

    fun consumeMessage() = _state.update { it.copy(message = null) }
}
