package com.mawrid.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.mawrid.app.core.designsystem.MawridColors
import com.mawrid.app.core.money.Money
import com.mawrid.app.domain.model.Product
import com.mawrid.app.ui.UiDefaults.DISPLAY_CURRENCY
import com.mawrid.app.ui.UiDefaults.IS_ARABIC

/**
 * Storefront product card — ported from the website's `product-card.tsx`:
 * bordered `bg-card`, square image on `bg-muted` with a wishlist heart in a circle
 * at the top-trailing corner and an optional discount/verified badge at the
 * top-leading corner; body = name, supplier, consumer price (`× 1.15`) with the
 * "سعر التجزئة · للكرتون" label, and a star-rating / MOQ row.
 *
 * The heart reads/toggles a per-screen [FavoritesViewModel] (shared by all cards
 * on the screen), so it works wherever this card is used.
 */
@Composable
fun ProductCard(
    product: Product,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    favVm: FavoritesViewModel = hiltViewModel(),
) {
    val cs = MaterialTheme.colorScheme
    val favIds by favVm.ids.collectAsStateWithLifecycle()
    val isFavorite = product.id in favIds

    val retail = Money.format(Money.retailUsd(product.basePriceUsd), DISPLAY_CURRENCY, IS_ARABIC)
    val discount = product.oldPriceUsd
        ?.takeIf { it > product.basePriceUsd }
        ?.let { ((1 - product.basePriceUsd / it) * 100).toInt() }
        ?: 0

    Column(
        modifier
            .clip(RoundedCornerShape(12.dp))
            .border(1.dp, cs.outline, RoundedCornerShape(12.dp))
            .background(cs.surface)
            .clickable(onClick = onClick),
    ) {
        // Image area
        Box(Modifier.fillMaxWidth().aspectRatio(1f).background(cs.surfaceVariant)) {
            AsyncImage(
                model = product.imageUrl,
                contentDescription = product.displayName(IS_ARABIC),
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxWidth().aspectRatio(1f),
            )

            // Top-leading badge: discount takes precedence, else verified.
            if (discount > 0) {
                Badge(
                    text = "-$discount%",
                    bg = cs.primary,
                    fg = cs.onPrimary,
                    modifier = Modifier.align(Alignment.TopStart).padding(8.dp),
                )
            } else if (product.verified) {
                Badge(
                    text = "مورد موثّق",
                    bg = MawridColors.Success,
                    fg = MawridColors.SuccessForeground,
                    icon = Icons.Filled.Verified,
                    modifier = Modifier.align(Alignment.TopStart).padding(8.dp),
                )
            }

            // Wishlist heart (top-trailing, in a circle)
            Box(
                Modifier
                    .align(Alignment.TopEnd)
                    .padding(8.dp)
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(cs.surface.copy(alpha = 0.9f))
                    .clickable { favVm.toggle(product.id) },
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                    contentDescription = if (isFavorite) "إزالة من المفضلة" else "إضافة إلى المفضلة",
                    tint = if (isFavorite) cs.primary else cs.onSurfaceVariant,
                    modifier = Modifier.size(18.dp),
                )
            }
        }

        // Body
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                product.displayName(IS_ARABIC),
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            if (product.displaySupplier(IS_ARABIC).isNotBlank()) {
                Text(
                    product.displaySupplier(IS_ARABIC),
                    style = MaterialTheme.typography.labelSmall,
                    color = cs.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }

            Text(
                retail,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Black,
                color = cs.primary,
            )
            Text(
                "سعر التجزئة · للكرتون",
                style = MaterialTheme.typography.labelSmall,
                color = cs.onSurfaceVariant,
            )

            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                    Icon(Icons.Filled.Star, contentDescription = null, tint = MawridColors.StarAmber, modifier = Modifier.size(12.dp))
                    Text(
                        product.rating.toString(),
                        style = MaterialTheme.typography.labelSmall,
                        color = cs.onSurfaceVariant,
                    )
                }
                Text(
                    "أقل كمية: ${product.moq} كرتون",
                    style = MaterialTheme.typography.labelSmall.copy(
                        textDirection = TextDirection.Content,
                    ),
                    color = cs.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun Badge(
    text: String,
    bg: androidx.compose.ui.graphics.Color,
    fg: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier,
    icon: androidx.compose.ui.graphics.vector.ImageVector? = null,
) {
    Row(
        modifier.clip(RoundedCornerShape(6.dp)).background(bg).padding(horizontal = 6.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        if (icon != null) Icon(icon, contentDescription = null, tint = fg, modifier = Modifier.size(12.dp))
        Text(text, color = fg, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
    }
}
