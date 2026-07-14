package com.mawrid.app.ui.chat

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.ChatRepository
import com.mawrid.app.domain.model.ChatMessage
import com.mawrid.app.ui.navigation.Routes
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ChatUiState(
    val loading: Boolean = true,
    val messages: List<ChatMessage> = emptyList(),
    val draft: String = "",
    val sending: Boolean = false,
    val error: String? = null,
) {
    val canSend: Boolean get() = draft.isNotBlank() && !sending
}

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chat: ChatRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val conversationId: String = checkNotNull(savedStateHandle[Routes.ARG_CONVERSATION_ID])

    private val _state = MutableStateFlow(ChatUiState())
    val state: StateFlow<ChatUiState> = _state.asStateFlow()

    init {
        load()
        viewModelScope.launch { chat.markRead(conversationId) }
    }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            chat.messages(conversationId)
                .onSuccess { list -> _state.update { it.copy(loading = false, messages = list) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }

    fun onDraft(v: String) = _state.update { it.copy(draft = v) }

    fun send() {
        val s = _state.value
        if (!s.canSend) return
        val body = s.draft
        _state.update { it.copy(sending = true, draft = "") }
        viewModelScope.launch {
            chat.send(conversationId, body)
                .onSuccess { msg -> _state.update { it.copy(sending = false, messages = it.messages + msg) } }
                .onFailure { e -> _state.update { it.copy(sending = false, draft = body, error = e.message ?: "تعذّر الإرسال") } }
        }
    }
}
