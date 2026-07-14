package com.mawrid.app.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AdminRepository
import com.mawrid.app.domain.model.AdminApprovalRow
import com.mawrid.app.domain.model.AdminKpi
import com.mawrid.app.domain.model.AdminOrderRow
import com.mawrid.app.domain.model.AdminProductRow
import com.mawrid.app.domain.model.AdminSupplierRow
import com.mawrid.app.domain.model.AdminUserRow
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/** Generic admin list state (loading / data / error). */
data class AdminListState<T>(
    val loading: Boolean = true,
    val items: List<T> = emptyList(),
    val error: String? = null,
)

data class AdminDashboardState(
    val loading: Boolean = true,
    val kpi: AdminKpi? = null,
    val error: String? = null,
)

@HiltViewModel
class AdminDashboardViewModel @Inject constructor(private val admin: AdminRepository) : ViewModel() {
    private val _state = MutableStateFlow(AdminDashboardState())
    val state: StateFlow<AdminDashboardState> = _state.asStateFlow()
    init { load() }
    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            admin.kpi()
                .onSuccess { k -> _state.update { it.copy(loading = false, kpi = k) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }
}

@HiltViewModel
class AdminOrdersViewModel @Inject constructor(private val admin: AdminRepository) : ViewModel() {
    private val _state = MutableStateFlow(AdminListState<AdminOrderRow>())
    val state: StateFlow<AdminListState<AdminOrderRow>> = _state.asStateFlow()
    init { load() }
    fun load() = reload(_state) { admin.orders() }
}

@HiltViewModel
class AdminProductsViewModel @Inject constructor(private val admin: AdminRepository) : ViewModel() {
    private val _state = MutableStateFlow(AdminListState<AdminProductRow>())
    val state: StateFlow<AdminListState<AdminProductRow>> = _state.asStateFlow()
    init { load() }
    fun load() = reload(_state) { admin.products() }
}

@HiltViewModel
class AdminBuyersViewModel @Inject constructor(private val admin: AdminRepository) : ViewModel() {
    private val _state = MutableStateFlow(AdminListState<AdminUserRow>())
    val state: StateFlow<AdminListState<AdminUserRow>> = _state.asStateFlow()
    init { load() }
    fun load() = reload(_state) { admin.buyers() }
}

@HiltViewModel
class AdminSuppliersViewModel @Inject constructor(private val admin: AdminRepository) : ViewModel() {
    private val _state = MutableStateFlow(AdminListState<AdminSupplierRow>())
    val state: StateFlow<AdminListState<AdminSupplierRow>> = _state.asStateFlow()
    init { load() }
    fun load() = reload(_state) { admin.suppliers() }
}

@HiltViewModel
class AdminApprovalsViewModel @Inject constructor(private val admin: AdminRepository) : ViewModel() {
    private val _state = MutableStateFlow(AdminListState<AdminApprovalRow>())
    val state: StateFlow<AdminListState<AdminApprovalRow>> = _state.asStateFlow()
    init { load() }
    fun load() = reload(_state) { admin.approvals() }
}

/** Shared load helper: flips loading, runs [block], stores items or error. */
private fun <T> ViewModel.reload(
    state: MutableStateFlow<AdminListState<T>>,
    block: suspend () -> Result<List<T>>,
) {
    state.update { it.copy(loading = true, error = null) }
    viewModelScope.launch {
        block()
            .onSuccess { list -> state.update { it.copy(loading = false, items = list) } }
            .onFailure { e -> state.update { it.copy(loading = false, error = e.message ?: "Error") } }
    }
}
