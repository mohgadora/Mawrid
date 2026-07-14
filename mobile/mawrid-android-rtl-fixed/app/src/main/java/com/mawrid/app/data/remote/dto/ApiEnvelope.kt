package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

/**
 * Every /api/v1 success response is wrapped as { "data": T }.
 * Errors come back as { "error": string } with a non-2xx status.
 */
@Serializable
data class ApiEnvelope<T>(val data: T)
