package com.mawrid.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.mawrid.app.ui.account.AccountScreen
import com.mawrid.app.ui.account.AddressesScreen
import com.mawrid.app.ui.account.BuyerTypeScreen
import com.mawrid.app.ui.account.KycScreen
import com.mawrid.app.ui.account.ProfileEditScreen
import com.mawrid.app.ui.account.RefundsScreen
import com.mawrid.app.ui.account.TemplatesScreen
import com.mawrid.app.ui.account.VerifyPhoneScreen
import com.mawrid.app.ui.admin.AdminApprovalsScreen
import com.mawrid.app.ui.admin.AdminBuyersScreen
import com.mawrid.app.ui.admin.AdminGenericListScreen
import com.mawrid.app.ui.admin.AdminHubScreen
import com.mawrid.app.ui.admin.AdminOrdersScreen
import com.mawrid.app.ui.admin.AdminProductsScreen
import com.mawrid.app.ui.admin.AdminSuppliersScreen
import com.mawrid.app.ui.auth.AuthScreen
import com.mawrid.app.ui.auth.ForgotPasswordScreen
import com.mawrid.app.ui.auth.PortalLoginScreen
import com.mawrid.app.ui.partner.PartnerGenericListScreen
import com.mawrid.app.ui.partner.PartnerHubScreen
import com.mawrid.app.ui.chat.ChatScreen
import com.mawrid.app.ui.chat.ConversationsScreen
import com.mawrid.app.ui.content.BlogPostScreen
import com.mawrid.app.ui.content.BlogScreen
import com.mawrid.app.ui.content.OffersScreen
import com.mawrid.app.ui.cart.CartBadgeViewModel
import com.mawrid.app.ui.cart.CartScreen
import com.mawrid.app.ui.categories.CategoriesScreen
import com.mawrid.app.ui.checkout.CheckoutScreen
import com.mawrid.app.ui.compare.CompareScreen
import com.mawrid.app.ui.following.FollowingScreen
import com.mawrid.app.ui.home.HomeScreen
import com.mawrid.app.ui.notifications.NotificationsScreen
import com.mawrid.app.ui.orders.OrderDetailScreen
import com.mawrid.app.ui.orders.OrdersScreen
import com.mawrid.app.ui.product.ProductDetailScreen
import com.mawrid.app.ui.rewards.LoyaltyScreen
import com.mawrid.app.ui.rewards.ReferralScreen
import com.mawrid.app.ui.rewards.WalletScreen
import com.mawrid.app.ui.search.SearchScreen
import com.mawrid.app.ui.supplier.SupplierScreen
import com.mawrid.app.ui.wishlist.WishlistScreen

/**
 * Single-activity navigation host. The bottom bar is shown only on the five
 * top-level tabs; pushed screens (product detail, checkout, orders, auth, …)
 * get the full height.
 */
@Composable
fun MawridNavHost(navController: NavHostController = rememberNavController()) {
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val showBottomBar = BottomTab.entries.any { it.route == currentRoute }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                MawridBottomBar(navController = navController, currentRoute = currentRoute)
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.HOME,
            modifier = Modifier.padding(padding),
        ) {
            composable(Routes.HOME) {
                HomeScreen(
                    onProductClick = { id -> navController.navigate(Routes.product(id)) },
                    onSearchClick = { navController.navigate(Routes.search()) },
                    onWishlistClick = { navController.navigate(Routes.WISHLIST) },
                )
            }

            composable(Routes.CATEGORIES) {
                CategoriesScreen(
                    onCategoryClick = { slug -> navController.navigate(Routes.search(category = slug)) },
                )
            }

            composable(
                route = Routes.SEARCH_PATTERN,
                arguments = listOf(
                    navArgument(Routes.ARG_CATEGORY) { type = NavType.StringType; nullable = true; defaultValue = null },
                    navArgument(Routes.ARG_QUERY) { type = NavType.StringType; nullable = true; defaultValue = null },
                ),
            ) {
                SearchScreen(
                    onProductClick = { id -> navController.navigate(Routes.product(id)) },
                )
            }

            composable(Routes.CART) {
                CartScreen(
                    onCheckout = { navController.navigate(Routes.CHECKOUT) },
                    onBrowse = { navController.navigate(Routes.HOME) { launchSingleTop = true } },
                )
            }

            composable(Routes.ACCOUNT) {
                AccountScreen(
                    onLogin = { navController.navigate(Routes.AUTH) },
                    onOrders = { navController.navigate(Routes.ORDERS) },
                    onAddresses = { navController.navigate(Routes.ADDRESSES) },
                    onWishlist = { navController.navigate(Routes.WISHLIST) },
                    onNotifications = { navController.navigate(Routes.NOTIFICATIONS) },
                    onFollowing = { navController.navigate(Routes.FOLLOWING) },
                    onEditProfile = { navController.navigate(Routes.PROFILE_EDIT) },
                    onCompare = { navController.navigate(Routes.COMPARE) },
                    onLoyalty = { navController.navigate(Routes.LOYALTY) },
                    onReferral = { navController.navigate(Routes.REFERRAL) },
                    onWallet = { navController.navigate(Routes.WALLET) },
                    onKyc = { navController.navigate(Routes.KYC) },
                    onTemplates = { navController.navigate(Routes.TEMPLATES) },
                    onRefunds = { navController.navigate(Routes.REFUNDS) },
                    onConversations = { navController.navigate(Routes.CONVERSATIONS) },
                    onOffers = { navController.navigate(Routes.OFFERS) },
                    onBlog = { navController.navigate(Routes.BLOG) },
                    onBuyerType = { navController.navigate(Routes.BUYER_TYPE) },
                    onAdmin = { navController.navigate(Routes.ADMIN) },
                )
            }

            composable(
                route = Routes.PRODUCT_PATTERN,
                arguments = listOf(navArgument(Routes.ARG_PRODUCT_ID) { type = NavType.StringType }),
            ) {
                ProductDetailScreen(
                    onBack = { navController.popBackStack() },
                    onSupplierClick = { supplierId -> navController.navigate(Routes.supplier(supplierId)) },
                    onRequireLogin = { navController.navigate(Routes.AUTH) },
                )
            }

            composable(
                route = Routes.SUPPLIER_PATTERN,
                arguments = listOf(navArgument(Routes.ARG_SUPPLIER_ID) { type = NavType.StringType }),
            ) {
                SupplierScreen(
                    onBack = { navController.popBackStack() },
                    onProductClick = { id -> navController.navigate(Routes.product(id)) },
                )
            }

            composable(Routes.CHECKOUT) {
                CheckoutScreen(
                    onBack = { navController.popBackStack() },
                    onLogin = { navController.navigate(Routes.AUTH) },
                    onOrderPlaced = { orderId ->
                        // Replace checkout with the order detail; clear the cart tab back-stack.
                        navController.navigate(Routes.orderDetail(orderId)) {
                            popUpTo(Routes.CART) { inclusive = false }
                        }
                    },
                )
            }

            composable(Routes.AUTH) {
                AuthScreen(
                    onAuthenticated = { navController.popBackStack() },
                    onBack = { navController.popBackStack() },
                    onForgotPassword = { navController.navigate(Routes.FORGOT_PASSWORD) },
                    onPortalLogin = { navController.navigate(Routes.PORTAL_LOGIN) },
                )
            }

            composable(Routes.FORGOT_PASSWORD) {
                ForgotPasswordScreen(onBack = { navController.popBackStack() })
            }

            composable(Routes.VERIFY_PHONE) {
                VerifyPhoneScreen(onBack = { navController.popBackStack() })
            }

            composable(Routes.BLOG) {
                BlogScreen(
                    onBack = { navController.popBackStack() },
                    onPostClick = { slug -> navController.navigate(Routes.blogPost(slug)) },
                )
            }

            composable(
                route = Routes.BLOG_POST_PATTERN,
                arguments = listOf(navArgument(Routes.ARG_SLUG) { type = NavType.StringType }),
            ) {
                BlogPostScreen(onBack = { navController.popBackStack() })
            }

            composable(Routes.OFFERS) {
                OffersScreen(
                    onBack = { navController.popBackStack() },
                    onProductClick = { id -> navController.navigate(Routes.product(id)) },
                )
            }

            composable(Routes.CONVERSATIONS) {
                ConversationsScreen(
                    onBack = { navController.popBackStack() },
                    onConversationClick = { id -> navController.navigate(Routes.chat(id)) },
                )
            }

            composable(
                route = Routes.CHAT_PATTERN,
                arguments = listOf(navArgument(Routes.ARG_CONVERSATION_ID) { type = NavType.StringType }),
            ) {
                ChatScreen(onBack = { navController.popBackStack() })
            }

            composable(Routes.BUYER_TYPE) {
                BuyerTypeScreen(onBack = { navController.popBackStack() })
            }

            // ── Admin portal (role=admin only) ──────────────────────────
            composable(Routes.ADMIN) {
                AdminHubScreen(
                    onBack = { navController.popBackStack() },
                    onOrders = { navController.navigate(Routes.ADMIN_ORDERS) },
                    onProducts = { navController.navigate(Routes.ADMIN_PRODUCTS) },
                    onBuyers = { navController.navigate(Routes.ADMIN_BUYERS) },
                    onSuppliers = { navController.navigate(Routes.ADMIN_SUPPLIERS) },
                    onApprovals = { navController.navigate(Routes.ADMIN_APPROVALS) },
                    onSection = { key -> navController.navigate(Routes.adminList(key)) },
                )
            }
            composable(Routes.ADMIN_ORDERS) { AdminOrdersScreen(onBack = { navController.popBackStack() }) }
            composable(Routes.ADMIN_PRODUCTS) { AdminProductsScreen(onBack = { navController.popBackStack() }) }
            composable(Routes.ADMIN_BUYERS) { AdminBuyersScreen(onBack = { navController.popBackStack() }) }
            composable(Routes.ADMIN_SUPPLIERS) { AdminSuppliersScreen(onBack = { navController.popBackStack() }) }
            composable(Routes.ADMIN_APPROVALS) { AdminApprovalsScreen(onBack = { navController.popBackStack() }) }
            composable(
                route = Routes.ADMIN_LIST_PATTERN,
                arguments = listOf(navArgument(Routes.ARG_SECTION_KEY) { type = NavType.StringType }),
            ) {
                AdminGenericListScreen(onBack = { navController.popBackStack() })
            }

            // ── Staff portal login + partner portal ─────────────────────
            composable(Routes.PORTAL_LOGIN) {
                PortalLoginScreen(
                    onBack = { navController.popBackStack() },
                    onAdmin = {
                        navController.navigate(Routes.ADMIN) { popUpTo(Routes.PORTAL_LOGIN) { inclusive = true } }
                    },
                    onPartner = {
                        navController.navigate(Routes.PARTNER) { popUpTo(Routes.PORTAL_LOGIN) { inclusive = true } }
                    },
                )
            }
            composable(Routes.PARTNER) {
                PartnerHubScreen(
                    onBack = { navController.popBackStack() },
                    onSection = { key -> navController.navigate(Routes.partnerList(key)) },
                )
            }
            composable(
                route = Routes.PARTNER_LIST_PATTERN,
                arguments = listOf(navArgument(Routes.ARG_SECTION_KEY) { type = NavType.StringType }),
            ) {
                PartnerGenericListScreen(onBack = { navController.popBackStack() })
            }

            composable(Routes.ORDERS) {
                OrdersScreen(
                    onBack = { navController.popBackStack() },
                    onOrderClick = { id -> navController.navigate(Routes.orderDetail(id)) },
                )
            }

            composable(
                route = Routes.ORDER_DETAIL_PATTERN,
                arguments = listOf(navArgument(Routes.ARG_ORDER_ID) { type = NavType.StringType }),
            ) {
                OrderDetailScreen(onBack = { navController.popBackStack() })
            }

            composable(Routes.ADDRESSES) {
                AddressesScreen(onBack = { navController.popBackStack() })
            }

            composable(Routes.WISHLIST) {
                WishlistScreen(
                    onBack = { navController.popBackStack() },
                    onProductClick = { id -> navController.navigate(Routes.product(id)) },
                )
            }

            composable(Routes.NOTIFICATIONS) {
                NotificationsScreen(onBack = { navController.popBackStack() })
            }

            composable(Routes.FOLLOWING) {
                FollowingScreen(
                    onBack = { navController.popBackStack() },
                    onSupplierClick = { id -> navController.navigate(Routes.supplier(id)) },
                )
            }

            composable(Routes.PROFILE_EDIT) {
                ProfileEditScreen(
                    onBack = { navController.popBackStack() },
                    onVerifyPhone = { navController.navigate(Routes.VERIFY_PHONE) },
                )
            }

            composable(Routes.COMPARE) {
                CompareScreen(
                    onBack = { navController.popBackStack() },
                    onProductClick = { id -> navController.navigate(Routes.product(id)) },
                )
            }

            composable(Routes.LOYALTY) {
                LoyaltyScreen(onBack = { navController.popBackStack() })
            }

            composable(Routes.REFERRAL) {
                ReferralScreen(onBack = { navController.popBackStack() })
            }

            composable(Routes.WALLET) {
                WalletScreen(onBack = { navController.popBackStack() })
            }

            composable(Routes.KYC) {
                KycScreen(onBack = { navController.popBackStack() })
            }

            composable(Routes.TEMPLATES) {
                TemplatesScreen(onBack = { navController.popBackStack() })
            }

            composable(Routes.REFUNDS) {
                RefundsScreen(onBack = { navController.popBackStack() })
            }
        }
    }
}

@Composable
private fun MawridBottomBar(
    navController: NavHostController,
    currentRoute: String?,
    cartBadgeVm: CartBadgeViewModel = hiltViewModel(),
) {
    val cartCount by cartBadgeVm.itemCount.collectAsStateWithLifecycle()

    NavigationBar {
        BottomTab.entries.forEach { tab ->
            val selected = currentRoute == tab.route
            NavigationBarItem(
                selected = selected,
                onClick = {
                    if (!selected) {
                        navController.navigate(tab.route) {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                icon = {
                    if (tab == BottomTab.CART && cartCount > 0) {
                        BadgedBox(badge = { Badge { Text("$cartCount") } }) {
                            Icon(tab.icon, contentDescription = tab.labelAr)
                        }
                    } else {
                        Icon(tab.icon, contentDescription = tab.labelAr)
                    }
                },
                label = { Text(tab.labelAr) },
            )
        }
    }
}
