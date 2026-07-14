package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

/** better-auth POST /api/auth/request-password-reset (raw JSON, no envelope). */
@Serializable
data class RequestResetRequest(
    val email: String,
    val redirectTo: String,
)

/** better-auth reset response: { status, message }. */
@Serializable
data class RequestResetResponse(
    val status: Boolean = false,
    val message: String? = null,
)

/** POST /api/v1/auth/otp/send { phone }. */
@Serializable
data class OtpSendRequest(val phone: String)

/** POST /api/v1/auth/otp/verify { phone, code }. */
@Serializable
data class OtpVerifyRequest(val phone: String, val code: String)

/** POST /api/v1/auth/otp/verify → { data: { verified } }. */
@Serializable
data class OtpVerifyResult(val verified: Boolean = false)
