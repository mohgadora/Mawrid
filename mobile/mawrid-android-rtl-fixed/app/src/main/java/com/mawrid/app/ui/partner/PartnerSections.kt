package com.mawrid.app.ui.partner

import com.mawrid.app.domain.model.AdminSection

/** Partner portal sections (all read via the generic list screen). */
object PartnerSections {

    val groups: List<Pair<String, List<AdminSection>>> = listOf(
        "المتجر" to listOf(
            AdminSection("products", "المنتجات"),
            AdminSection("inventory", "المخزون"),
            AdminSection("orders", "الطلبات"),
            AdminSection("reviews", "التقييمات"),
        ),
        "المالية" to listOf(
            AdminSection("earnings", "الأرباح"),
            AdminSection("withdrawals", "السحوبات"),
            AdminSection("invoices", "الفواتير"),
            AdminSection("coupons", "الكوبونات"),
        ),
        "أخرى" to listOf(
            AdminSection("ads", "الإعلانات"),
            AdminSection("notifications", "الإشعارات"),
            AdminSection("support/tickets", "الدعم"),
        ),
    )

    private val byKey = groups.flatMap { it.second }.associateBy { it.key }
    fun section(key: String): AdminSection = byKey[key] ?: AdminSection(key, key)
}
