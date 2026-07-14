package com.mawrid.app.ui.account

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.AuthRepository
import com.mawrid.app.data.repository.CompareStore
import com.mawrid.app.domain.model.UserProfile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AccountUiState(
    val isLoggedIn: Boolean = false,
    val profile: UserProfile? = null,
    val loading: Boolean = false,
    val unreadNotifications: Int = 0,
    val compareCount: Int = 0,
)

@HiltViewModel
class AccountViewModel @Inject constructor(
    private val account: AccountRepository,
    private val auth: AuthRepository,
    compare: CompareStore,
) : ViewModel() {

    private val _state = MutableStateFlow(AccountUiState())
    val state: StateFlow<AccountUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            auth.isLoggedIn.collect { loggedIn ->
                _state.update { it.copy(isLoggedIn = loggedIn) }
                if (loggedIn) {
                    loadProfile()
                    loadNotificationCount()
                } else {
                    _state.update { it.copy(profile = null, unreadNotifications = 0) }
                }
            }
        }
        viewModelScope.launch {
            compare.count.collect { c -> _state.update { it.copy(compareCount = c) } }
        }
    }

    private fun loadProfile() {
        _state.update { it.copy(loading = true) }
        viewModelScope.launch {
            account.profile()
                .onSuccess { p -> _state.update { it.copy(loading = false, profile = p) } }
                .onFailure { _state.update { it.copy(loading = false) } }
        }
    }

    private fun loadNotificationCount() {
        viewModelScope.launch {
            account.notifications().onSuccess { feed ->
                _state.update { it.copy(unreadNotifications = feed.unreadCount) }
            }
        }
    }

    fun signOut() {
        viewModelScope.launch { auth.signOut() }
    }
}
