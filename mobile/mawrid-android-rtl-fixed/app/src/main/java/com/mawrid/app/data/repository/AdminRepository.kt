package com.mawrid.app.data.repository

import com.mawrid.app.data.remote.MawridApi
import com.mawrid.app.domain.model.AdminApprovalRow
import com.mawrid.app.domain.model.AdminKpi
import com.mawrid.app.domain.model.AdminOrderRow
import com.mawrid.app.domain.model.AdminProductRow
import com.mawrid.app.domain.model.AdminSimpleRow
import com.mawrid.app.domain.model.AdminSupplierRow
import com.mawrid.app.domain.model.AdminUserRow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Admin back-office reads. Every endpoint requires role=admin server-side and
 * returns 403 otherwise — the screens surface that as a clean error state.
 */
@Singleton
class AdminRepository @Inject constructor(
    private val api: MawridApi,
) {
    suspend fun kpi(): Result<AdminKpi> = runCatching { api.getAdminKpi().data.toDomain() }

    suspend fun orders(): Result<List<AdminOrderRow>> = runCatching {
        api.getAdminOrders().data.map { it.toDomain() }
    }

    suspend fun products(): Result<List<AdminProductRow>> = runCatching {
        api.getAdminProducts().data.map { it.toDomain() }
    }

    suspend fun buyers(): Result<List<AdminUserRow>> = runCatching {
        api.getAdminBuyers().data.map { it.toDomain() }
    }

    suspend fun suppliers(): Result<List<AdminSupplierRow>> = runCatching {
        api.getAdminSuppliers().data.map { it.toDomain() }
    }

    suspend fun approvals(): Result<List<AdminApprovalRow>> = runCatching {
        api.getAdminApprovals().data.map { it.toDomain() }
    }

    /** Generic list for any admin section [path] (e.g. "coupons", "finance/withdrawals"). */
    suspend fun list(path: String): Result<List<AdminSimpleRow>> = runCatching {
        api.getAdminList(path).data.map { it.toSimpleRow() }
    }

    /** Generic write action, e.g. action("products", id, "approve") → POST products/{id}/approve. */
    suspend fun action(basePath: String, id: String, verb: String): Result<Unit> = runCatching {
        api.postAdminAction("$basePath/$id/$verb")
    }
}
