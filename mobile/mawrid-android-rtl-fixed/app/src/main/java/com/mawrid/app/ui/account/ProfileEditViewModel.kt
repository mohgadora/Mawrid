package com.mawrid.app.ui.account

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileEditUiState(
    val loading: Boolean = true,
    val name: String = "",
    val phone: String = "",
    val email: String = "",
    val saving: Boolean = false,
    val error: String? = null,
    val saved: Boolean = false,
) {
    val canSave: Boolean get() = name.isNotBlank() && !saving
}

@HiltViewModel
class ProfileEditViewModel @Inject constructor(
    private val account: AccountRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(ProfileEditUiState())
    val state: StateFlow<ProfileEditUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            account.profile()
                .onSuccess { p ->
                    _state.update { it.copy(loading = false, name = p.name, phone = p.phone, email = p.email) }
                }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }

    fun onName(v: String) = _state.update { it.copy(name = v) }
    fun onPhone(v: String) = _state.update { it.copy(phone = v) }

    /** Persist name/phone (email is read-only server-side). */
    fun save() {
        val s = _state.value
        if (!s.canSave) return
        _state.update { it.copy(saving = true, error = null) }
        viewModelScope.launch {
            account.updateProfile(s.name, s.phone)
                .onSuccess { _state.update { it.copy(saving = false, saved = true) } }
                .onFailure { e -> _state.update { it.copy(saving = false, error = e.message ?: "تعذّر الحفظ") } }
        }
    }
}
