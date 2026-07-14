package com.mawrid.app.core.network

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.mawrid.app.data.remote.AuthApi
import com.mawrid.app.data.remote.MawridApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun json(): Json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        explicitNulls = false
    }

    @Provides
    @Singleton
    fun okHttp(cookieJar: SessionCookieJar): OkHttpClient =
        OkHttpClient.Builder()
            // Auth is cookie-based (better-auth session cookie), not Bearer — the
            // jar captures the session on sign-in and replays it on every call.
            .cookieJar(cookieJar)
            // better-auth enforces a same-origin CSRF check on some auth routes
            // (e.g. sign-out → 403 "Missing or null Origin" without it). Native
            // OkHttp sends no Origin, so we set it to the request's own origin —
            // which is the API base, exactly the origin the server trusts.
            .addInterceptor { chain ->
                val url = chain.request().url
                val isDefaultPort = (url.scheme == "http" && url.port == 80) ||
                    (url.scheme == "https" && url.port == 443)
                val origin = "${url.scheme}://${url.host}" + if (isDefaultPort) "" else ":${url.port}"
                chain.proceed(
                    chain.request().newBuilder().header("Origin", origin).build()
                )
            }
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            })
            .build()

    @Provides
    @Singleton
    fun retrofit(client: OkHttpClient, json: Json, config: ApiConfig): Retrofit {
        // Base URL is resolved once at graph creation. A settings screen that
        // changes it should recreate the Retrofit instance (or use a scoped
        // component); kept simple here.
        val base = kotlinx.coroutines.runBlocking { config.baseUrl() }
        return Retrofit.Builder()
            .baseUrl(base)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    @Provides
    @Singleton
    fun mawridApi(retrofit: Retrofit): MawridApi = retrofit.create(MawridApi::class.java)

    @Provides
    @Singleton
    fun authApi(retrofit: Retrofit): AuthApi = retrofit.create(AuthApi::class.java)
}
