package com.mawrid.app.data.remote.dto

import kotlinx.serialization.Serializable

/** GET /api/v1/admin/kpi (or /analytics/summary) — dashboard headline numbers. */
@Serializable
data class AdminKpiDto(
    val gmv: Double = 0.0,
    val revenue: Double = 0.0,
    val revenueGrowth: Double = 0.0,
    val orders: Int = 0,
    val pendingOrders: Int = 0,
    val suppliers: Int = 0,
    val buyers: Int = 0,
    val pendingApprovals: Int = 0,
    val openTickets: Int = 0,
)

/** GET /api/v1/admin/orders. */
@Serializable
data class AdminOrderDto(
    val id: String = "",         // order ref
    val buyer: String = "",
    val supplier: String = "",
    val amount: Double = 0.0,
    val items: Int = 0,
    val status: String = "",
    val date: String = "",
)

/** GET /api/v1/admin/products (product rows). Extra columns are ignored. */
@Serializable
data class AdminProductDto(
    val id: String = "",
    val nameAr: String? = null,
    val name: String? = null,
    val status: String? = null,   // active | pending_approval | rejected | …
    val active: Boolean = true,
)

/** GET /api/v1/admin/buyers. */
@Serializable
data class AdminBuyerDto(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val type: String = "",        // تاجر | مستهلك
    val orders: Int = 0,
    val spend: Double = 0.0,
)

/** GET /api/v1/admin/suppliers. */
@Serializable
data class AdminSupplierDto(
    val id: String = "",
    val name: String = "",
    val nameEn: String = "",
    val products: Int = 0,
    val rating: Double = 0.0,
    val status: String = "",      // active | pending
    val verified: Boolean = false,
    val city: String = "",
    val joined: String = "",
)

/** GET /api/v1/admin/approvals (KYC + pending products). */
@Serializable
data class AdminApprovalDto(
    val id: String = "",
    val type: String = "",        // kyc | supplier
    val title: String = "",
    val subtitle: String = "",
    val status: String = "",      // pending | approved | rejected
    val submittedAt: String? = null,
)
