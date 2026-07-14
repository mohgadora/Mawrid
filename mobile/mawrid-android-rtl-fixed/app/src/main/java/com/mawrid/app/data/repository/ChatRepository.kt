package com.mawrid.app.data.repository

import com.mawrid.app.data.remote.MawridApi
import com.mawrid.app.data.remote.dto.SendMessageRequest
import com.mawrid.app.data.remote.dto.StartConversationRequest
import com.mawrid.app.domain.model.ChatMessage
import com.mawrid.app.domain.model.Conversation
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Supplier chat. Message ownership ([ChatMessage.mine]) is resolved against the
 * current user id, fetched once from the session and cached.
 */
@Singleton
class ChatRepository @Inject constructor(
    private val api: MawridApi,
    private val auth: AuthRepository,
) {
    private var cachedUserId: String? = null

    private suspend fun currentUserId(): String? {
        cachedUserId?.let { return it }
        return auth.currentUser()?.id?.also { cachedUserId = it }
    }

    suspend fun conversations(): Result<List<Conversation>> = runCatching {
        api.getConversations().data.map { it.toDomain() }
    }

    suspend fun unreadCount(): Result<Int> = runCatching {
        api.getUnreadCount().data.count
    }

    suspend fun messages(conversationId: String): Result<List<ChatMessage>> = runCatching {
        val me = currentUserId()
        // Server returns newest-first; reverse to chronological for the thread view.
        api.getMessages(conversationId).data.items.map { it.toDomain(me) }.reversed()
    }

    suspend fun send(conversationId: String, body: String): Result<ChatMessage> = runCatching {
        val me = currentUserId()
        api.sendMessage(conversationId, SendMessageRequest(body.trim())).data.toDomain(me)
    }

    suspend fun markRead(conversationId: String): Result<Unit> = runCatching {
        api.markConversationRead(conversationId)
    }

    /** Start (or reuse) the conversation with the supplier of [orderId]. */
    suspend fun startForOrder(orderId: String): Result<Conversation> = runCatching {
        api.startConversation(StartConversationRequest(orderId)).data.toDomain()
    }
}
