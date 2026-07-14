package com.mawrid.app.data.repository

import com.mawrid.app.data.remote.MawridApi
import com.mawrid.app.domain.model.AdminSimpleRow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Partner/supplier portal reads. Endpoints require role=supplier server-side and
 * return 403 otherwise (surfaced as a clean error state). Reuses the generic
 * [AdminSimpleRow] row shape shared with the admin portal.
 */
@Singleton
class PartnerRepository @Inject constructor(
    private val api: MawridApi,
) {
    /** Generic list for a partner section [path] (e.g. "orders", "inventory"). */
    suspend fun list(path: String): Result<List<AdminSimpleRow>> = runCatching {
        api.getPartnerList(path).data.map { it.toSimpleRow() }
    }
}
