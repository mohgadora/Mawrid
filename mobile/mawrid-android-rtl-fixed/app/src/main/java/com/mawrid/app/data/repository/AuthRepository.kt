package com.mawrid.app.data.repository

import com.mawrid.app.core.network.ApiConfig
import com.mawrid.app.core.network.SessionStore
import com.mawrid.app.data.remote.AuthApi
import com.mawrid.app.data.remote.dto.RequestResetRequest
import com.mawrid.app.data.remote.dto.SignInRequest
import com.mawrid.app.data.remote.dto.SignUpRequest
import com.mawrid.app.data.remote.dto.UserDto
import com.mawrid.app.domain.model.UserProfile
import kotlinx.coroutines.flow.StateFlow
import kotlinx.serialization.json.Json
import retrofit2.HttpException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: AuthApi,
    private val sessionStore: SessionStore,
    private val apiConfig: ApiConfig,
    private val json: Json,
) {
    /** True while a session cookie is stored. Survives restarts. */
    val isLoggedIn: StateFlow<Boolean> = sessionStore.isLoggedIn

    /** Sign in with email/password. The session cookie is captured by the jar. */
    suspend fun signIn(email: String, password: String): Result<Unit> = runCatching {
        api.signIn(SignInRequest(email = email.trim(), password = password))
        // Belt-and-suspenders: if the server returned a token but no cookie was
        // captured for some reason, the jar handles the Set-Cookie either way.
        Unit
    }.recoverAuthError()

    /** Register a new consumer account, then treat as signed in. */
    suspend fun signUp(
        email: String,
        password: String,
        name: String,
        phone: String?,
        company: String?,
    ): Result<Unit> = runCatching {
        api.signUp(
            SignUpRequest(
                email = email.trim(),
                password = password,
                name = name.trim(),
                phone = phone?.trim()?.ifBlank { null },
                company = company?.trim()?.ifBlank { null },
            )
        )
        Unit
    }.recoverAuthError()

    /**
     * Request a password-reset email. The reset link points at the web reset
     * page (better-auth emails a tokenized URL); the app only kicks it off.
     */
    suspend fun requestPasswordReset(email: String): Result<Unit> = runCatching {
        val origin = apiConfig.baseUrl().trimEnd('/')
        api.requestPasswordReset(
            RequestResetRequest(email = email.trim(), redirectTo = "$origin/reset-password")
        )
        Unit
    }.recoverAuthError()

    /** Sign out on the server (clears the cookie) and locally. */
    suspend fun signOut() {
        runCatching { api.signOut() }
        sessionStore.clear()
    }

    /** Current user from the session, or null when not signed in. */
    suspend fun currentUser(): UserProfile? =
        runCatching { api.session()?.user?.toDomain() }.getOrNull()

    /**
     * Convert a better-auth error (401 `{ message, code }`) into a Result.failure
     * carrying a human-readable message, leaving other results untouched.
     */
    private fun Result<Unit>.recoverAuthError(): Result<Unit> = recoverCatching { e ->
        val message = (e as? HttpException)?.let { http ->
            runCatching {
                val body = http.response()?.errorBody()?.string().orEmpty()
                json.decodeFromString(AuthError.serializer(), body).message
            }.getOrNull()
        } ?: e.message
        throw AuthException(message ?: "تعذّر تسجيل الدخول")
    }
}

/** Auth failure with a display message (already localized where possible). */
class AuthException(message: String) : Exception(message)

@kotlinx.serialization.Serializable
private data class AuthError(val message: String? = null, val code: String? = null)

private fun UserDto.toDomain(): UserProfile = UserProfile(
    id = id,
    name = name.orEmpty(),
    email = email.orEmpty(),
    phone = phone.orEmpty(),
    company = company.orEmpty(),
    country = country ?: "SA",
    role = role ?: "consumer",
)
