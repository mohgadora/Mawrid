package com.mawrid.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountCircle
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.ui.graphics.vector.ImageVector

/**
 * Navigation routes. String-based routes are used (rather than 2.8 type-safe
 * routes) to stay approachable and consistent with the rest of the app.
 *
 * Argument keys live here so the NavHost and the navigate() calls can't drift.
 */
object Routes {
    const val HOME = "home"
    const val CATEGORIES = "categories"
    const val CART = "cart"
    const val ACCOUNT = "account"

    // Search accepts optional category/query args, e.g. search?category=rice
    const val SEARCH = "search"
    const val ARG_CATEGORY = "category"
    const val ARG_QUERY = "q"
    const val SEARCH_PATTERN = "$SEARCH?$ARG_CATEGORY={$ARG_CATEGORY}&$ARG_QUERY={$ARG_QUERY}"

    // Product detail, e.g. product/abc123
    const val PRODUCT = "product"
    const val ARG_PRODUCT_ID = "productId"
    const val PRODUCT_PATTERN = "$PRODUCT/{$ARG_PRODUCT_ID}"

    // Supplier storefront, e.g. supplier/east-sugar
    const val SUPPLIER = "supplier"
    const val ARG_SUPPLIER_ID = "supplierId"
    const val SUPPLIER_PATTERN = "$SUPPLIER/{$ARG_SUPPLIER_ID}"

    // Pushed (non-tab) destinations
    const val CHECKOUT = "checkout"
    const val AUTH = "auth"
    const val ORDERS = "orders"
    const val ADDRESSES = "addresses"
    const val WISHLIST = "wishlist"
    const val NOTIFICATIONS = "notifications"
    const val FOLLOWING = "following"
    const val PROFILE_EDIT = "profile_edit"
    const val COMPARE = "compare"
    const val LOYALTY = "loyalty"
    const val REFERRAL = "referral"
    const val WALLET = "wallet"
    const val KYC = "kyc"
    const val TEMPLATES = "templates"
    const val REFUNDS = "refunds"
    const val FORGOT_PASSWORD = "forgot_password"
    const val VERIFY_PHONE = "verify_phone"
    const val OFFERS = "offers"
    const val CONVERSATIONS = "conversations"
    const val BUYER_TYPE = "buyer_type"

    // Admin portal (role=admin only)
    const val ADMIN = "admin"
    const val ADMIN_ORDERS = "admin_orders"
    const val ADMIN_PRODUCTS = "admin_products"
    const val ADMIN_BUYERS = "admin_buyers"
    const val ADMIN_SUPPLIERS = "admin_suppliers"
    const val ADMIN_APPROVALS = "admin_approvals"

    // Generic admin section list. Slashes in the key are swapped to '~' for the arg.
    const val ADMIN_LIST = "admin_list"
    const val ARG_SECTION_KEY = "sectionKey"
    const val ADMIN_LIST_PATTERN = "$ADMIN_LIST/{$ARG_SECTION_KEY}"
    fun adminList(key: String) = "$ADMIN_LIST/${key.replace("/", "~")}"

    // Staff portal login + partner portal
    const val PORTAL_LOGIN = "portal_login"
    const val PARTNER = "partner"
    const val PARTNER_LIST = "partner_list"
    const val PARTNER_LIST_PATTERN = "$PARTNER_LIST/{$ARG_SECTION_KEY}"
    fun partnerList(key: String) = "$PARTNER_LIST/${key.replace("/", "~")}"

    // Blog list + article (blog/{slug})
    const val BLOG = "blog"
    const val ARG_SLUG = "slug"
    const val BLOG_POST_PATTERN = "$BLOG/{$ARG_SLUG}"
    fun blogPost(slug: String) = "$BLOG/$slug"

    // Chat thread (chat/{conversationId})
    const val CHAT = "chat"
    const val ARG_CONVERSATION_ID = "conversationId"
    const val CHAT_PATTERN = "$CHAT/{$ARG_CONVERSATION_ID}"
    fun chat(conversationId: String) = "$CHAT/$conversationId"

    const val ORDER_DETAIL = "order"
    const val ARG_ORDER_ID = "orderId"
    const val ORDER_DETAIL_PATTERN = "$ORDER_DETAIL/{$ARG_ORDER_ID}"

    fun product(productId: String) = "$PRODUCT/$productId"
    fun supplier(supplierId: String) = "$SUPPLIER/$supplierId"
    fun orderDetail(orderId: String) = "$ORDER_DETAIL/$orderId"

    fun search(category: String? = null, query: String? = null): String {
        val params = buildList {
            category?.takeIf { it.isNotBlank() }?.let { add("$ARG_CATEGORY=$it") }
            query?.takeIf { it.isNotBlank() }?.let { add("$ARG_QUERY=$it") }
        }
        return if (params.isEmpty()) SEARCH else "$SEARCH?${params.joinToString("&")}"
    }
}

/** The five bottom-navigation destinations. */
enum class BottomTab(
    val route: String,
    val labelAr: String,
    val icon: ImageVector,
) {
    HOME(Routes.HOME, "الرئيسية", Icons.Outlined.Home),
    CATEGORIES(Routes.CATEGORIES, "الفئات", Icons.Outlined.GridView),
    SEARCH(Routes.SEARCH, "البحث", Icons.Outlined.Search),
    CART(Routes.CART, "السلة", Icons.Outlined.ShoppingCart),
    ACCOUNT(Routes.ACCOUNT, "حسابي", Icons.Outlined.AccountCircle),
}
