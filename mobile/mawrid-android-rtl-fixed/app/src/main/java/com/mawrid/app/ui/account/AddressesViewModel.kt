package com.mawrid.app.ui.account

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.domain.model.Address
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AddressesUiState(
    val loading: Boolean = true,
    val addresses: List<Address> = emptyList(),
    val error: String? = null,
    val showForm: Boolean = false,
    val label: String = "",
    val line1: String = "",
    val city: String = "",
    val phone: String = "",
    val saving: Boolean = false,
) {
    val formValid: Boolean
        get() = label.isNotBlank() && line1.isNotBlank() && city.isNotBlank() && phone.isNotBlank()
}

@HiltViewModel
class AddressesViewModel @Inject constructor(
    private val account: AccountRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(AddressesUiState())
    val state: StateFlow<AddressesUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            account.addresses()
                .onSuccess { list -> _state.update { it.copy(loading = false, addresses = list) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }

    fun toggleForm() = _state.update { it.copy(showForm = !it.showForm) }
    fun onLabel(v: String) = _state.update { it.copy(label = v) }
    fun onLine1(v: String) = _state.update { it.copy(line1 = v) }
    fun onCity(v: String) = _state.update { it.copy(city = v) }
    fun onPhone(v: String) = _state.update { it.copy(phone = v) }

    fun save() {
        val s = _state.value
        if (!s.formValid || s.saving) return
        _state.update { it.copy(saving = true) }
        viewModelScope.launch {
            account.addAddress(s.label, s.line1, s.city, s.phone)
                .onSuccess { added ->
                    _state.update {
                        it.copy(
                            saving = false,
                            showForm = false,
                            label = "", line1 = "", city = "", phone = "",
                            addresses = it.addresses + added,
                        )
                    }
                }
                .onFailure { e -> _state.update { it.copy(saving = false, error = e.message ?: "تعذّر الحفظ") } }
        }
    }
}
