package com.mawrid.app.ui.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.AuthRepository
import com.mawrid.app.domain.model.AppNotification
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NotificationsUiState(
    val loading: Boolean = true,
    val notifications: List<AppNotification> = emptyList(),
    val unreadCount: Int = 0,
    val error: String? = null,
    val isLoggedIn: Boolean = false,
)

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val account: AccountRepository,
    auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(NotificationsUiState(isLoggedIn = auth.isLoggedIn.value))
    val state: StateFlow<NotificationsUiState> = _state.asStateFlow()

    init { if (_state.value.isLoggedIn) load() else _state.update { it.copy(loading = false) } }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            account.notifications()
                .onSuccess { feed ->
                    _state.update { it.copy(loading = false, notifications = feed.notifications, unreadCount = feed.unreadCount) }
                }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }

    fun markAllRead() {
        // Optimistic: flip everything read + clear the badge.
        _state.update { s ->
            s.copy(notifications = s.notifications.map { it.copy(read = true) }, unreadCount = 0)
        }
        viewModelScope.launch { account.markAllNotificationsRead() }
    }

    fun markRead(id: String) {
        if (_state.value.notifications.firstOrNull { it.id == id }?.read == true) return
        _state.update { s ->
            s.copy(
                notifications = s.notifications.map { if (it.id == id) it.copy(read = true) else it },
                unreadCount = (s.unreadCount - 1).coerceAtLeast(0),
            )
        }
        viewModelScope.launch { account.markNotificationRead(id) }
    }
}
