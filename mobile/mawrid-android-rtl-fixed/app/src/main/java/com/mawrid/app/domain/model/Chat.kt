package com.mawrid.app.domain.model

/** A conversation summary (buyer ↔ supplier). */
data class Conversation(
    val id: String,
    val otherName: String,
    val lastMessage: String?,
    val lastMessageAtIso: String?,
    val unread: Int,
)

/** One chat message. [mine] = sent by the current user. */
data class ChatMessage(
    val id: String,
    val body: String,
    val mine: Boolean,
    val createdAtIso: String?,
)
