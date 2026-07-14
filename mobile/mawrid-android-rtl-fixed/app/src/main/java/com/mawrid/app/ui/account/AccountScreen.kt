package com.mawrid.app.ui.account

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Article
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.outlined.ReceiptLong
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.AssignmentReturn
import androidx.compose.material.icons.outlined.Bookmarks
import androidx.compose.material.icons.outlined.CardGiftcard
import androidx.compose.material.icons.outlined.CompareArrows
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.material.icons.outlined.Logout
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Stars
import androidx.compose.material.icons.outlined.Storefront
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material3.Badge
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.material3.Button

@Composable
fun AccountScreen(
    onLogin: () -> Unit,
    onOrders: () -> Unit,
    onAddresses: () -> Unit,
    onWishlist: () -> Unit,
    onNotifications: () -> Unit,
    onFollowing: () -> Unit,
    onEditProfile: () -> Unit,
    onCompare: () -> Unit,
    onLoyalty: () -> Unit,
    onReferral: () -> Unit,
    onWallet: () -> Unit,
    onKyc: () -> Unit,
    onTemplates: () -> Unit,
    onRefunds: () -> Unit,
    onConversations: () -> Unit,
    onOffers: () -> Unit,
    onBlog: () -> Unit,
    onBuyerType: () -> Unit,
    onAdmin: () -> Unit,
    vm: AccountViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Column(Modifier.fillMaxSize()) {
        Header(state.profile?.name)
        if (!state.isLoggedIn) {
            Column(
                Modifier.fillMaxSize().padding(24.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text("سجّل الدخول للوصول إلى حسابك", style = MaterialTheme.typography.titleMedium)
                Button(onClick = onLogin, modifier = Modifier.padding(top = 12.dp)) { Text("تسجيل الدخول") }
            }
        } else {
            // The menu now has enough entries to overflow shorter screens — make it scroll.
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            Spacer(Modifier.height(8.dp))
            MenuItem(Icons.Outlined.Person, "تعديل الملف الشخصي", onEditProfile)
            HorizontalDivider()
            MenuItem(Icons.AutoMirrored.Outlined.ReceiptLong, "طلباتي", onOrders)
            HorizontalDivider()
            MenuItem(Icons.AutoMirrored.Outlined.Chat, "المحادثات", onConversations)
            HorizontalDivider()
            MenuItem(Icons.Outlined.LocalOffer, "عروض وتخفيضات", onOffers)
            HorizontalDivider()
            MenuItem(Icons.AutoMirrored.Outlined.Article, "المدونة", onBlog)
            HorizontalDivider()
            MenuItem(Icons.Outlined.AssignmentReturn, "طلبات الاسترجاع", onRefunds)
            HorizontalDivider()
            MenuItem(Icons.Outlined.Bookmarks, "قوالب إعادة الطلب", onTemplates)
            HorizontalDivider()
            MenuItem(Icons.Outlined.Notifications, "الإشعارات", onNotifications, badge = state.unreadNotifications)
            HorizontalDivider()
            MenuItem(Icons.Outlined.LocationOn, "العناوين", onAddresses)
            HorizontalDivider()
            MenuItem(Icons.Outlined.FavoriteBorder, "المفضلة", onWishlist)
            HorizontalDivider()
            MenuItem(Icons.Outlined.Storefront, "المتاجر المتابَعة", onFollowing)
            HorizontalDivider()
            MenuItem(Icons.Outlined.CompareArrows, "مقارنة المنتجات", onCompare, badge = state.compareCount)
            HorizontalDivider()
            MenuItem(Icons.Outlined.AccountBalanceWallet, "محفظتي", onWallet)
            HorizontalDivider()
            MenuItem(Icons.Outlined.Stars, "نقاط الولاء", onLoyalty)
            HorizontalDivider()
            MenuItem(Icons.Outlined.CardGiftcard, "ادعُ أصدقاءك", onReferral)
            HorizontalDivider()
            MenuItem(Icons.Outlined.VerifiedUser, "توثيق المنشأة", onKyc)
            HorizontalDivider()
            MenuItem(Icons.Outlined.SwapHoriz, "نوع الحساب", onBuyerType)
            HorizontalDivider()
            // Admin portal — only for admins.
            if (state.profile?.role == "admin") {
                MenuItem(Icons.Outlined.Dashboard, "لوحة الإدارة", onAdmin, tint = MaterialTheme.colorScheme.primary)
                HorizontalDivider()
            }
            MenuItem(Icons.Outlined.Logout, "تسجيل الخروج", vm::signOut, tint = MaterialTheme.colorScheme.error)
            Spacer(Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun Header(name: String?) {
    Surface(color = MaterialTheme.colorScheme.primary) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp)) {
            Text("حسابي", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onPrimary)
            if (!name.isNullOrBlank()) {
                Text(
                    name,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimary,
                    modifier = Modifier.padding(top = 2.dp),
                )
            }
        }
    }
}

@Composable
private fun MenuItem(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    tint: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurface,
    badge: Int = 0,
) {
    Row(
        Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 16.dp, vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = tint)
        Text(
            label,
            style = MaterialTheme.typography.bodyLarge,
            color = tint,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.weight(1f).padding(start = 14.dp),
        )
        if (badge > 0) {
            Badge(modifier = Modifier.padding(end = 8.dp)) { Text("$badge") }
        }
        Icon(
            Icons.AutoMirrored.Outlined.KeyboardArrowRight,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
