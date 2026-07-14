package com.mawrid.app.domain.model

/** Admin dashboard KPIs. Money fields are final USD (display with FX only). */
data class AdminKpi(
    val gmvUsd: Double,
    val revenueUsd: Double,
    val revenueGrowth: Double,
    val orders: Int,
    val pendingOrders: Int,
    val suppliers: Int,
    val buyers: Int,
    val pendingApprovals: Int,
    val openTickets: Int,
)

data class AdminOrderRow(
    val ref: String,
    val buyer: String,
    val supplier: String,
    val amountUsd: Double,
    val items: Int,
    val status: String,
    val date: String,
)

data class AdminProductRow(
    val id: String,
    val name: String,
    val status: String,
    val active: Boolean,
)

data class AdminUserRow(
    val id: String,
    val name: String,
    val email: String,
    val type: String,
)

data class AdminSupplierRow(
    val id: String,
    val name: String,
    val products: Int,
    val rating: Double,
    val verified: Boolean,
    val city: String,
)

data class AdminApprovalRow(
    val id: String,
    val type: String,
    val title: String,
    val subtitle: String,
    val status: String,
)

/**
 * A generic admin row extracted from an arbitrary admin-list JSON object. Lets
 * the many admin sections share one list screen instead of a bespoke DTO each.
 * [actions] is populated for approval-type sections (approve/reject).
 */
data class AdminSimpleRow(
    val id: String,
    val title: String,
    val subtitle: String,
    val trailing: String?,
)

/** One admin section shown in the hub (label + API path/key). */
data class AdminSection(
    val key: String,        // list path under /api/v1/admin, e.g. "coupons" or "finance/withdrawals"
    val label: String,
    val actionKind: AdminAction = AdminAction.NONE,
    val actionBase: String = key,  // POST base for row actions (may differ, e.g. "products" for "products/pending")
)

/** Row-level write actions available for an approval-type section. */
enum class AdminAction { NONE, APPROVE_REJECT }
