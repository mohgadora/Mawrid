package com.mawrid.app.core.network

import kotlinx.coroutines.runBlocking
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import javax.inject.Inject
import javax.inject.Singleton

/** Name of the better-auth session cookie the backend sets on sign-in/up. */
const val SESSION_COOKIE_NAME = "better-auth.session_token"

/**
 * OkHttp CookieJar that captures and replays the better-auth session cookie.
 *
 * On sign-in/up the server sends `Set-Cookie: better-auth.session_token=…`; we
 * persist its value via [SessionStore]. On every request we attach it back so
 * authed `/api/v1` calls carry the session. A sign-out (Max-Age=0 / expired
 * cookie) clears it. Only this one cookie is tracked — nothing else is stored.
 */
@Singleton
class SessionCookieJar @Inject constructor(
    private val store: SessionStore,
) : CookieJar {

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val cookie = cookies.firstOrNull { it.name == SESSION_COOKIE_NAME } ?: return
        runBlocking {
            if (cookie.value.isBlank() || cookie.expiresAt < System.currentTimeMillis()) {
                store.clear()
            } else {
                store.save(cookie.value)
            }
        }
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val value = store.cookieValue() ?: return emptyList()
        return listOf(
            Cookie.Builder()
                .name(SESSION_COOKIE_NAME)
                .value(value)
                .domain(url.host)
                .path("/")
                .build()
        )
    }
}
