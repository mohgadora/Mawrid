package com.mawrid.app.data.remote

import com.mawrid.app.data.remote.dto.AuthResponse
import com.mawrid.app.data.remote.dto.EmptyBody
import com.mawrid.app.data.remote.dto.RequestResetRequest
import com.mawrid.app.data.remote.dto.RequestResetResponse
import com.mawrid.app.data.remote.dto.SessionResponse
import com.mawrid.app.data.remote.dto.SignInRequest
import com.mawrid.app.data.remote.dto.SignUpRequest
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/**
 * better-auth surface (email/password). Paths are under /api/auth and return
 * raw JSON (no { data } envelope). The session cookie set on sign-in/up is
 * captured by SessionCookieJar and replayed automatically.
 */
interface AuthApi {

    @POST("api/auth/sign-in/email")
    suspend fun signIn(@Body body: SignInRequest): AuthResponse

    @POST("api/auth/sign-up/email")
    suspend fun signUp(@Body body: SignUpRequest): AuthResponse

    /** Body must be `{}` with application/json, or better-auth returns 415. */
    @POST("api/auth/sign-out")
    suspend fun signOut(@Body body: EmptyBody = EmptyBody())

    /** Returns the current session, or a null body when unauthenticated. */
    @GET("api/auth/get-session")
    suspend fun session(): SessionResponse?

    /** Request a password-reset email. Always returns 200 (no account enumeration). */
    @POST("api/auth/request-password-reset")
    suspend fun requestPasswordReset(@Body body: RequestResetRequest): RequestResetResponse
}
