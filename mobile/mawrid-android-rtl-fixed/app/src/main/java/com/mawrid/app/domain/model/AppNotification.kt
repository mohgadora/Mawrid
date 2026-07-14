package com.mawrid.app.domain.model

/** A user notification (orders, offers, follows, …). */
data class AppNotification(
    val id: String,
    val type: String,
    val title: String,
    val body: String,
    val link: String?,
    val read: Boolean,
    val createdAtIso: String,
)

/** Notifications list + unread count. */
data class NotificationsFeed(
    val notifications: List<AppNotification>,
    val unreadCount: Int,
) {
    companion object {
        val EMPTY = NotificationsFeed(emptyList(), 0)
    }
}
