package com.mawrid.app.domain.model

/**
 * The signed-in user. `role` drives pricing (merchant sees wholesale, consumer
 * sees retail); for the buyer app we default to the consumer/retail view.
 */
data class UserProfile(
    val id: String,
    val name: String,
    val email: String,
    val phone: String,
    val company: String,
    val country: String,
    val role: String,
) {
    val isMerchant: Boolean get() = role == "merchant"
}
