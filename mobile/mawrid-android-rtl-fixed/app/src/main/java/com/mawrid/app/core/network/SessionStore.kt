package com.mawrid.app.core.network

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import javax.inject.Inject
import javax.inject.Singleton

private val Context.sessionDataStore by preferencesDataStore(name = "mawrid_session")

/**
 * Persists the better-auth **session cookie** value. Mawrid's `/api/v1` routes
 * authenticate via the signed `better-auth.session_token` cookie (the bearer
 * plugin is NOT enabled server-side), so we store that cookie value and replay
 * it through [SessionCookieJar] on every request.
 *
 * The value is cached in memory (read synchronously by the OkHttp CookieJar) and
 * mirrored to DataStore so the login survives restarts.
 */
@Singleton
class SessionStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val key = stringPreferencesKey("session_cookie")

    // Hydrate once at graph creation. OkHttp's CookieJar is synchronous, so we
    // need the value available without suspending on every request.
    @Volatile
    private var cached: String? = runBlocking { context.sessionDataStore.data.map { it[key] }.first() }

    private val _isLoggedIn = MutableStateFlow(cached != null)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    /** The stored session cookie value, or null when signed out. */
    fun cookieValue(): String? = cached

    suspend fun save(value: String) {
        cached = value
        context.sessionDataStore.edit { it[key] = value }
        _isLoggedIn.value = true
    }

    suspend fun clear() {
        cached = null
        context.sessionDataStore.edit { it.remove(key) }
        _isLoggedIn.value = false
    }
}
