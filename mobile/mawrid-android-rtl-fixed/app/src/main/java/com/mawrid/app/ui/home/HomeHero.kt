package com.mawrid.app.ui.home

import androidx.compose.animation.Crossfade
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import kotlinx.coroutines.delay

private val SLIDES = listOf("/banners/hero-warehouse.png", "/banners/bulk-deals.png")

/**
 * Home hero, ported from `hero-carousel.tsx`: a rounded banner that auto-advances
 * every 5s, with a light gradient wash on the RTL start (right) side, a tagline
 * pill, title, subtitle, two CTAs, and dot indicators — followed by the 4-up
 * trust-badge grid. Banner images come from the server (`{origin}/banners/...`).
 */
@Composable
fun HomeHero(baseOrigin: String, onShopNow: () -> Unit, modifier: Modifier = Modifier) {
    val cs = MaterialTheme.colorScheme
    var index by remember { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(5000)
            index = (index + 1) % SLIDES.size
        }
    }

    Column(modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp)) {
        Box(
            Modifier
                .fillMaxWidth()
                .height(224.dp)
                .clip(RoundedCornerShape(16.dp)),
        ) {
            Crossfade(targetState = index, label = "hero") { i ->
                AsyncImage(
                    model = "$baseOrigin${SLIDES[i]}",
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
            }
            // Light wash on the start (right in RTL) side so the dark heading reads.
            // horizontalGradient always draws left→right, so in RTL we flip the stops.
            val isRtl = LocalLayoutDirection.current == LayoutDirection.Rtl
            val gradientColors = if (isRtl)
                listOf(cs.onBackground.copy(alpha = 0.82f), Color.Transparent)
            else
                listOf(Color.Transparent, cs.onBackground.copy(alpha = 0.82f))
            Box(
                Modifier.fillMaxSize().background(Brush.horizontalGradient(gradientColors))
            )
            Column(
                Modifier.fillMaxSize().padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterVertically),
            ) {
                Text(
                    "منصة تجارة الجملة رقم 1",
                    color = cs.onPrimary,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .background(cs.primary)
                        .padding(horizontal = 12.dp, vertical = 5.dp),
                )
                Text(
                    "اشترِ بالجملة، وفّر أكثر",
                    color = cs.background,
                    fontWeight = FontWeight.Black,
                    fontSize = 24.sp,
                )
                Text(
                    "قارن أسعار الجملة بمتوسط السوق واشترِ من موردين موثوقين بأفضل الأسعار",
                    color = cs.background.copy(alpha = 0.85f),
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.fillMaxWidth(0.72f),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(cs.primary)
                            .clickable(onClick = onShopNow)
                            .padding(horizontal = 18.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Text("تسوّق الآن", color = cs.onPrimary, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelMedium)
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = cs.onPrimary, modifier = Modifier.size(16.dp))
                    }
                    Text(
                        "اكتشف العروض",
                        color = cs.onBackground,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.labelMedium,
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(cs.background.copy(alpha = 0.9f))
                            .padding(horizontal = 18.dp, vertical = 12.dp),
                    )
                }
            }
            // Dots
            Row(
                Modifier.align(Alignment.BottomCenter).padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                SLIDES.forEachIndexed { i, _ ->
                    Box(
                        Modifier
                            .height(6.dp)
                            .width(if (i == index) 24.dp else 6.dp)
                            .clip(RoundedCornerShape(50))
                            .background(if (i == index) cs.primary else cs.background.copy(alpha = 0.7f))
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))
        TrustBadges()
    }
}

@Composable
private fun TrustBadges() {
    val items = listOf(
        Icons.Outlined.LocalShipping to "توصيل سريع",
        Icons.Outlined.Shield to "حماية الطلب",
        Icons.Outlined.AccountBalanceWallet to "دفع آمن",
        Icons.Outlined.VerifiedUser to "مورد موثّق",
    )
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                row.forEach { (icon, label) ->
                    TrustBadge(icon, label, Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun TrustBadge(icon: ImageVector, label: String, modifier: Modifier = Modifier) {
    val cs = MaterialTheme.colorScheme
    Row(
        modifier
            .clip(RoundedCornerShape(12.dp))
            .border(1.dp, cs.outline, RoundedCornerShape(12.dp))
            .background(cs.surface)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(
            Modifier.size(36.dp).clip(RoundedCornerShape(8.dp)).background(cs.surfaceVariant),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = cs.primary, modifier = Modifier.size(20.dp))
        }
        Text(label, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
    }
}
