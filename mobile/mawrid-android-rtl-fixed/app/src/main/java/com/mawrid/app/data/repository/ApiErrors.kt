package com.mawrid.app.data.repository

import kotlinx.serialization.json.Json
import retrofit2.HttpException

@kotlinx.serialization.Serializable
private data class ApiErrorBody(val error: String? = null)

/**
 * Extract the server's `{ "error": string }` message from a failed /api/v1 call,
 * falling back to the raw throwable message. Lets screens show the backend's
 * (already-localized) reason instead of a bare "HTTP 400 Bad Request".
 */
internal fun Throwable.apiMessage(json: Json): String? {
    val fromBody = (this as? HttpException)?.let { http ->
        runCatching {
            val body = http.response()?.errorBody()?.string().orEmpty()
            json.decodeFromString(ApiErrorBody.serializer(), body).error
        }.getOrNull()
    }
    return fromBody?.takeIf { it.isNotBlank() } ?: message
}
