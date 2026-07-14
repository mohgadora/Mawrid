package com.mawrid.app.core.network

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.mawrid.app.BuildConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.settingsDataStore by preferencesDataStore(name = "mawrid_settings")

/**
 * Resolves the API base URL. Defaults to the BuildConfig value (10.0.2.2 for the
 * emulator in debug), but can be overridden at runtime — useful because the
 * backend is "sometimes local, sometimes deployed". A physical device on the
 * same LAN needs the host machine's IP here instead of 10.0.2.2.
 */
@Singleton
class ApiConfig @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val key = stringPreferencesKey("api_base_url")

    val baseUrlFlow = context.settingsDataStore.data.map { it[key] ?: BuildConfig.API_BASE_URL }

    suspend fun baseUrl(): String =
        context.settingsDataStore.data.map { it[key] ?: BuildConfig.API_BASE_URL }.first()

    suspend fun setBaseUrl(url: String) {
        context.settingsDataStore.edit { it[key] = url }
    }
}
