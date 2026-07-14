package com.mawrid.app.ui.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AuthRepository
import com.mawrid.app.data.repository.ChatRepository
import com.mawrid.app.domain.model.Conversation
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ConversationsUiState(
    val loading: Boolean = true,
    val conversations: List<Conversation> = emptyList(),
    val error: String? = null,
    val isLoggedIn: Boolean = false,
)

@HiltViewModel
class ConversationsViewModel @Inject constructor(
    private val chat: ChatRepository,
    auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(ConversationsUiState(isLoggedIn = auth.isLoggedIn.value))
    val state: StateFlow<ConversationsUiState> = _state.asStateFlow()

    init { if (_state.value.isLoggedIn) load() else _state.update { it.copy(loading = false) } }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            chat.conversations()
                .onSuccess { list -> _state.update { it.copy(loading = false, conversations = list) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }
}
