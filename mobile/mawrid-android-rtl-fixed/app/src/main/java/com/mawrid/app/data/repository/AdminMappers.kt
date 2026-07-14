package com.mawrid.app.data.repository

import com.mawrid.app.data.remote.dto.AdminApprovalDto
import com.mawrid.app.data.remote.dto.AdminBuyerDto
import com.mawrid.app.data.remote.dto.AdminKpiDto
import com.mawrid.app.data.remote.dto.AdminOrderDto
import com.mawrid.app.data.remote.dto.AdminProductDto
import com.mawrid.app.data.remote.dto.AdminSupplierDto
import com.mawrid.app.domain.model.AdminApprovalRow
import com.mawrid.app.domain.model.AdminKpi
import com.mawrid.app.domain.model.AdminSimpleRow
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import com.mawrid.app.domain.model.AdminOrderRow
import com.mawrid.app.domain.model.AdminProductRow
import com.mawrid.app.domain.model.AdminSupplierRow
import com.mawrid.app.domain.model.AdminUserRow

internal fun AdminKpiDto.toDomain(): AdminKpi = AdminKpi(
    gmvUsd = gmv,
    revenueUsd = revenue,
    revenueGrowth = revenueGrowth,
    orders = orders,
    pendingOrders = pendingOrders,
    suppliers = suppliers,
    buyers = buyers,
    pendingApprovals = pendingApprovals,
    openTickets = openTickets,
)

internal fun AdminOrderDto.toDomain(): AdminOrderRow = AdminOrderRow(
    ref = id,
    buyer = buyer,
    supplier = supplier,
    amountUsd = amount,
    items = items,
    status = status,
    date = date,
)

internal fun AdminProductDto.toDomain(): AdminProductRow = AdminProductRow(
    id = id,
    name = nameAr ?: name ?: id,
    status = status ?: if (active) "active" else "inactive",
    active = active,
)

internal fun AdminBuyerDto.toDomain(): AdminUserRow = AdminUserRow(
    id = id,
    name = name,
    email = email,
    type = type,
)

internal fun AdminSupplierDto.toDomain(): AdminSupplierRow = AdminSupplierRow(
    id = id,
    name = name,
    products = products,
    rating = rating,
    verified = verified,
    city = city,
)

internal fun AdminApprovalDto.toDomain(): AdminApprovalRow = AdminApprovalRow(
    id = id,
    type = type,
    title = title,
    subtitle = subtitle,
    status = status,
)

// ─── Generic admin-row extraction ──────────────────────────────────────────
// Admin sections return arbitrary shapes; pull the most useful fields for a
// uniform two-line row + trailing chip, so one screen serves every section.

private fun JsonObject.str(vararg keys: String): String? {
    for (k in keys) {
        val prim = (this[k] as? JsonPrimitive) ?: continue
        val s = prim.contentOrNull
        if (!s.isNullOrBlank() && s != "null") return s
    }
    return null
}

internal fun JsonObject.toSimpleRow(): AdminSimpleRow = AdminSimpleRow(
    id = str("id", "ref", "code", "userId") ?: "",
    title = str("nameAr", "name", "title", "titleAr", "ref", "code", "email", "question", "id") ?: "—",
    subtitle = str("status", "type", "email", "subtitle", "reason", "city", "phone", "createdAt", "submittedAt", "date") ?: "",
    trailing = str("total", "amount", "balance", "count", "products", "value", "rating", "usageCount", "status"),
)
