package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

/** GET/PATCH /api/v1/account/profile. Email is read-only. */
@Serializable
data class ProfileDto(
    val name: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val company: String? = null,
    val country: String? = null,
    val vatNumber: String? = null,
    val role: String? = null,
)

@Serializable
data class UpdateProfileRequest(
    val name: String,
    val phone: String,
)

/** GET/POST /api/v1/account/addresses. */
@Serializable
data class AddressDto(
    val id: String? = null,
    val label: String? = null,
    val line1: String? = null,
    val city: String? = null,
    val country: String? = null,
    val phone: String? = null,
    val fullName: String? = null,
    val isDefault: Boolean = false,
)

@Serializable
data class AddAddressRequest(
    val label: String,
    val line1: String,
    val city: String,
    val phone: String,
)
