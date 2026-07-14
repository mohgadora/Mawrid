package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

/** One notification from GET /api/v1/account/notifications. */
@Serializable
data class NotificationDto(
    val id: String,
    val type: String? = null,
    val title: String? = null,
    val body: String? = null,
    val link: String? = null,
    val read: Boolean = false,
    val createdAt: String? = null,
)

/** GET /api/v1/account/notifications → { data: { notifications, unreadCount } }. */
@Serializable
data class NotificationsResponseDto(
    val notifications: List<NotificationDto> = emptyList(),
    val unreadCount: Int = 0,
)
