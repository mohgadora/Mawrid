package com.mawrid.app.ui.admin

import com.mawrid.app.domain.model.AdminAction
import com.mawrid.app.domain.model.AdminSection

/**
 * Catalog of admin sections reachable from the hub. Read sections use the generic
 * list screen (`admin_list/{key}`); the typed dashboard/orders/products/buyers/
 * suppliers/approvals screens are wired separately. `key` is the API sub-path.
 */
object AdminSections {

    /** Sections that go through the generic list screen, grouped for the hub. */
    val groups: List<Pair<String, List<AdminSection>>> = listOf(
        "الطلبات والمنتجات" to listOf(
            AdminSection("products/pending", "منتجات بانتظار الموافقة", AdminAction.APPROVE_REJECT, actionBase = "products"),
            AdminSection("refunds", "طلبات الاسترجاع", AdminAction.APPROVE_REJECT),
            AdminSection("tickets", "تذاكر الدعم"),
        ),
        "المالية" to listOf(
            AdminSection("finance/withdrawals", "طلبات السحب", AdminAction.APPROVE_REJECT),
            AdminSection("wallets", "المحافظ"),
            AdminSection("wallet-bonuses", "مكافآت الشحن"),
            AdminSection("loyalty", "نقاط الولاء"),
            AdminSection("commissions", "العمولات"),
            AdminSection("referrals", "الإحالات"),
        ),
        "العروض والتسويق" to listOf(
            AdminSection("coupons", "الكوبونات"),
            AdminSection("cashback-rules", "قواعد الاسترجاع النقدي"),
            AdminSection("deals", "عروض اليوم"),
            AdminSection("flash-sales", "التخفيضات السريعة"),
            AdminSection("clearance", "التصفية"),
            AdminSection("ads", "الإعلانات"),
        ),
        "المستخدمون والصلاحيات" to listOf(
            AdminSection("suppliers-list", "الموردون"),
            AdminSection("drivers", "السائقون"),
            AdminSection("roles", "الأدوار"),
            AdminSection("sessions", "الجلسات"),
        ),
        "المحتوى والإعدادات" to listOf(
            AdminSection("blog", "المدونة"),
            AdminSection("seo", "تحسين محركات البحث"),
            AdminSection("email-templates", "قوالب البريد"),
            AdminSection("subscription-plans", "خطط الاشتراك"),
            AdminSection("store-subscriptions", "اشتراكات المتاجر"),
            AdminSection("countries", "الدول"),
            AdminSection("zones", "المناطق"),
            AdminSection("audit", "سجل التدقيق"),
        ),
    )

    private val byKey: Map<String, AdminSection> = groups.flatMap { it.second }.associateBy { it.key }

    fun section(key: String): AdminSection = byKey[key] ?: AdminSection(key, key)
}
