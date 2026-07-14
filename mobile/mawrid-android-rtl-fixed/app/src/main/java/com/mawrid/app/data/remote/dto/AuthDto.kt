package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

/**
 * better-auth request/response shapes. These endpoints live under /api/auth
 * (NOT /api/v1) and are NOT wrapped in the { data } envelope. `returnSessionToken`
 * asks the server to also return the token in the body; the session cookie it
 * sets is what actually authenticates subsequent requests (captured by the jar).
 */
/**
 * Empty JSON body (`{}`). better-auth's `/sign-out` rejects a body-less POST with
 * 415 Unsupported Media Type — Retrofit only sets `Content-Type: application/json`
 * when there's a `@Body`, so we send this to satisfy the content-type check.
 */
@Serializable
class EmptyBody

@Serializable
data class SignInRequest(
    val email: String,
    val password: String,
    val returnSessionToken: Boolean = true,
)

@Serializable
data class SignUpRequest(
    val email: String,
    val password: String,
    val name: String,
    val phone: String? = null,
    val company: String? = null,
    val country: String? = null,
    val returnSessionToken: Boolean = true,
)

/** Response of sign-in/sign-up: `{ token, user }` (token also set as a cookie). */
@Serializable
data class AuthResponse(
    val token: String? = null,
    val user: UserDto? = null,
)

/** better-auth user record. */
@Serializable
data class UserDto(
    val id: String,
    val name: String? = null,
    val email: String? = null,
    val role: String? = null,
    val phone: String? = null,
    val company: String? = null,
    val country: String? = null,
    val vatNumber: String? = null,
)

/** Response of GET /api/auth/get-session: `{ user, session }` or `null`. */
@Serializable
data class SessionResponse(
    val user: UserDto? = null,
)
