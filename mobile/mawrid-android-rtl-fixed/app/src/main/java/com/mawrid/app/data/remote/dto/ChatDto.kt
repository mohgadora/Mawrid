package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

/** GET /v1/conversations → { data: ConversationSummary[] }. */
@Serializable
data class ConversationDto(
    val id: String,
    val type: String? = null,
    val orderId: String? = null,
    val lastMessageAt: String? = null,
    val lastMessage: String? = null,
    val unread: Int = 0,
    val otherName: String = "مستخدم",
)

@Serializable
data class ChatMessageDto(
    val id: String,
    val conversationId: String? = null,
    val senderId: String? = null,
    val body: String = "",
    val createdAt: String? = null,
    val readAt: String? = null,
)

/** GET /v1/conversations/{id}/messages → { data: { items, nextCursor } }. */
@Serializable
data class MessagesPageDto(
    val items: List<ChatMessageDto> = emptyList(),
    val nextCursor: String? = null,
)

/** POST /v1/conversations/{id}/messages { body }. */
@Serializable
data class SendMessageRequest(val body: String)

/** POST /v1/conversations/start { orderId }. */
@Serializable
data class StartConversationRequest(val orderId: String)

/** GET /v1/conversations/unread-count → { data: { count } }. */
@Serializable
data class UnreadCountDto(val count: Int = 0)

/** POST /v1/account/buyer-type { role, company? }. */
@Serializable
data class BuyerTypeRequest(val role: String, val company: String? = null)
