package com.mawrid.app.ui.product

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.CompareArrows
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.mawrid.app.core.money.Money
import com.mawrid.app.domain.model.PriceTier
import com.mawrid.app.domain.model.Product
import com.mawrid.app.domain.model.Variant
import com.mawrid.app.domain.pricing.Pricing
import com.mawrid.app.ui.UiDefaults.DISPLAY_CURRENCY
import com.mawrid.app.ui.UiDefaults.IS_ARABIC
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductDetailScreen(
    onBack: () -> Unit,
    onSupplierClick: (String) -> Unit,
    onRequireLogin: () -> Unit,
    vm: ProductDetailViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    var showReviewDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.product?.displayName(IS_ARABIC) ?: "المنتج", maxLines = 1) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                },
                actions = {
                    if (state.product != null) {
                        IconButton(onClick = {
                            // Capture intent BEFORE toggling — reading state.isInCompare after
                            // toggleCompare() races the StateFlow update and inverts the message
                            // (mirrors the favorite handler below).
                            val added = !state.isInCompare
                            vm.toggleCompare()
                            scope.launch {
                                snackbar.showSnackbar(if (added) "أُضيف إلى المقارنة" else "أُزيل من المقارنة")
                            }
                        }) {
                            Icon(
                                Icons.Outlined.CompareArrows,
                                contentDescription = "المقارنة",
                                tint = if (state.isInCompare) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        IconButton(onClick = {
                            // Signed out → route to login; the API needs a session.
                            if (!state.isLoggedIn) {
                                onRequireLogin()
                            } else {
                                val added = !state.isFavorite
                                vm.toggleFavorite()
                                scope.launch {
                                    snackbar.showSnackbar(
                                        if (added) "أُضيف إلى المفضلة" else "أُزيل من المفضلة"
                                    )
                                }
                            }
                        }) {
                            Icon(
                                if (state.isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                                contentDescription = if (state.isFavorite) "إزالة من المفضلة" else "إضافة إلى المفضلة",
                                tint = MaterialTheme.colorScheme.primary,
                            )
                        }
                    }
                },
            )
        },
        bottomBar = {
            val product = state.product
            if (product != null) {
                AddToCartBar(
                    product = product,
                    quantity = state.quantity,
                    selectedVariant = state.variants.firstOrNull { it.id == state.selectedVariantId },
                    onAddToCart = {
                        vm.addToCart()
                        scope.launch { snackbar.showSnackbar("تمت الإضافة إلى السلة") }
                    },
                )
            }
        },
        snackbarHost = { SnackbarHost(snackbar) },
    ) { padding ->
        Box(Modifier.padding(padding)) {
            when {
                state.loading -> LoadingState()
                state.error != null -> ErrorState(
                    message = state.error,
                    onRetry = vm::load,
                    title = "تعذّر تحميل المنتج",
                )
                state.product != null -> ProductDetailContent(
                    product = state.product!!,
                    variants = state.variants,
                    selectedVariantId = state.selectedVariantId,
                    quantity = state.quantity,
                    reviews = state.reviews,
                    isLoggedIn = state.isLoggedIn,
                    onWriteReview = { if (state.isLoggedIn) showReviewDialog = true else onRequireLogin() },
                    onSelectVariant = vm::selectVariant,
                    onIncrease = vm::increaseQty,
                    onDecrease = vm::decreaseQty,
                    onSupplierClick = onSupplierClick,
                )
            }
        }
    }

    if (showReviewDialog) {
        ReviewDialog(
            submitting = state.submittingReview,
            error = state.reviewError,
            onSubmit = { rating, body -> vm.submitReview(rating, body, null) },
            onDismiss = { showReviewDialog = false },
        )
    }
    // Dismiss the dialog + toast once a submit succeeds.
    LaunchedEffect(state.reviewJustSubmitted) {
        if (state.reviewJustSubmitted) {
            showReviewDialog = false
            vm.consumeReviewSubmitted()
            snackbar.showSnackbar("شكراً! تم نشر تقييمك")
        }
    }
}

@Composable
private fun ProductDetailContent(
    product: Product,
    variants: List<Variant>,
    selectedVariantId: String?,
    quantity: Int,
    reviews: com.mawrid.app.domain.model.ProductReviews,
    isLoggedIn: Boolean,
    onWriteReview: () -> Unit,
    onSelectVariant: (String) -> Unit,
    onIncrease: () -> Unit,
    onDecrease: () -> Unit,
    onSupplierClick: (String) -> Unit,
) {
    Column(Modifier.verticalScroll(rememberScrollState())) {
        AsyncImage(
            model = product.imageUrl,
            contentDescription = product.displayName(IS_ARABIC),
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxWidth().aspectRatio(1f),
        )

        Column(Modifier.padding(16.dp)) {
            Text(product.displayName(IS_ARABIC), style = MaterialTheme.typography.titleLarge)

            // Product list responses often omit the supplier name (only the id),
            // so link to the storefront whenever we have a supplierId — showing the
            // name if present, else a "visit store" label. The storefront itself
            // carries the supplier's real name/rating/city.
            product.supplierId?.let { supplierId ->
                val supplierLabel = product.displaySupplier(IS_ARABIC).ifBlank { "زيارة متجر المورّد" }
                Text(
                    supplierLabel,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier
                        .padding(top = 4.dp)
                        .clickableSupplier(supplierId, onSupplierClick),
                )
            }

            if (product.rating > 0) {
                RatingRow(product.rating)
            }

            Spacer(Modifier.height(16.dp))
            PriceBlock(product = product, quantity = quantity)

            Spacer(Modifier.height(16.dp))
            if (variants.isNotEmpty()) {
                VariantSelector(variants, selectedVariantId, onSelectVariant)
                Spacer(Modifier.height(16.dp))
            }

            QuantityStepper(quantity = quantity, moq = product.moq, onIncrease = onIncrease, onDecrease = onDecrease)

            if (product.tiers.size > 1) {
                Spacer(Modifier.height(20.dp))
                TierTable(tiers = product.tiers, currentQty = quantity)
            }

            val description = product.displayDescription(IS_ARABIC)
            if (description.isNotBlank()) {
                Spacer(Modifier.height(20.dp))
                SectionTitle("الوصف")
                Text(
                    description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 6.dp),
                )
            }

            Spacer(Modifier.height(20.dp))
            ReviewsSection(reviews = reviews, onWriteReview = onWriteReview)
            Spacer(Modifier.height(24.dp))
        }
    }
}

/** Price + market-savings block. Consumer retail price for the current quantity's tier. */
@Composable
private fun PriceBlock(product: Product, quantity: Int) {
    val wholesaleUsd = Pricing.unitPriceUsd(product, quantity)
    val retail = Money.format(Money.retailUsd(wholesaleUsd), DISPLAY_CURRENCY, IS_ARABIC)
    val savingsPct = Pricing.savingsPercent(product, quantity)
    val marketRetail = product.marketPriceUsd?.let {
        Money.format(Money.retailUsd(it), DISPLAY_CURRENCY, IS_ARABIC)
    }

    Row(verticalAlignment = Alignment.Bottom) {
        Text(
            retail,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Black,
            color = MaterialTheme.colorScheme.primary,
        )
        Text(
            " / كرتون",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 3.dp),
        )
    }

    if (savingsPct > 0 && marketRetail != null) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(top = 6.dp),
        ) {
            Text(
                marketRetail,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textDecoration = TextDecoration.LineThrough,
            )
            Spacer(Modifier.width(8.dp))
            SavingsBadge(percent = savingsPct)
        }
    }
}

@Composable
private fun SavingsBadge(percent: Int) {
    Surface(
        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
        shape = RoundedCornerShape(6.dp),
    ) {
        Text(
            "توفير $percent%",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
        )
    }
}

@Composable
private fun RatingRow(rating: Double) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(top = 6.dp),
    ) {
        Icon(
            Icons.Filled.Star,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(16.dp),
        )
        Text(
            String.format("%.1f", rating),
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(start = 4.dp),
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun VariantSelector(
    variants: List<Variant>,
    selectedVariantId: String?,
    onSelect: (String) -> Unit,
) {
    SectionTitle("الخيارات")
    Row(
        Modifier.padding(top = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        variants.forEach { variant ->
            FilterChip(
                selected = variant.id == selectedVariantId,
                onClick = { onSelect(variant.id) },
                enabled = variant.inStock,
                label = { Text(variant.displayName(IS_ARABIC)) },
            )
        }
    }
}

@Composable
private fun QuantityStepper(
    quantity: Int,
    moq: Int,
    onIncrease: () -> Unit,
    onDecrease: () -> Unit,
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text("الكمية", style = MaterialTheme.typography.titleMedium)
            Text(
                "الحد الأدنى للطلب: $moq كرتون",
                style = MaterialTheme.typography.labelSmall.copy(
                    textDirection = TextDirection.Content,
                ),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        FilledTonalIconButton(onClick = onDecrease, enabled = quantity > moq) {
            Icon(Icons.Filled.Remove, contentDescription = "إنقاص")
        }
        Text(
            "$quantity",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.width(48.dp),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
        FilledTonalIconButton(onClick = onIncrease) {
            Icon(Icons.Filled.Add, contentDescription = "زيادة")
        }
    }
}

/** Quantity-break table. The row matching the current quantity is highlighted. */
@Composable
private fun TierTable(tiers: List<PriceTier>, currentQty: Int) {
    SectionTitle("أسعار الجملة")
    // The active tier = highest minQty the current quantity satisfies.
    val activeMinQty = tiers.filter { currentQty >= it.minQty }.maxOfOrNull { it.minQty }

    Column(
        Modifier
            .padding(top = 8.dp)
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(10.dp)),
    ) {
        tiers.forEach { tier ->
            val active = tier.minQty == activeMinQty
            val retail = Money.format(Money.retailUsd(tier.pricePerCartonUsd), DISPLAY_CURRENCY, IS_ARABIC)
            Row(
                Modifier
                    .fillMaxWidth()
                    .background(
                        if (active) MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)
                        else androidx.compose.ui.graphics.Color.Transparent
                    )
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    "${tier.minQty}+ كرتون",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        textDirection = TextDirection.Content,
                    ),
                    fontWeight = if (active) FontWeight.Bold else FontWeight.Normal,
                )
                Text(
                    retail,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = if (active) FontWeight.Bold else FontWeight.Normal,
                    color = if (active) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                )
            }
        }
    }
}

@Composable
private fun ReviewsSection(reviews: com.mawrid.app.domain.model.ProductReviews, onWriteReview: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        SectionTitle("التقييمات (${reviews.totalCount})")
        Text(
            "أضف تقييماً",
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            color = cs.primary,
            modifier = Modifier.clickable(onClick = onWriteReview).padding(4.dp),
        )
    }

    if (reviews.totalCount > 0) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 6.dp)) {
            Icon(Icons.Filled.Star, null, tint = com.mawrid.app.core.designsystem.MawridColors.StarAmber, modifier = Modifier.size(18.dp))
            Text(
                String.format("%.1f", reviews.averageRating),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(start = 4.dp),
            )
            Text(
                "من ${reviews.totalCount} تقييم",
                style = MaterialTheme.typography.labelSmall,
                color = cs.onSurfaceVariant,
                modifier = Modifier.padding(start = 8.dp),
            )
        }
    }

    if (reviews.reviews.isEmpty()) {
        Text(
            "لا توجد مراجعات بعد — كن أول من يقيّم",
            style = MaterialTheme.typography.bodySmall,
            color = cs.onSurfaceVariant,
            modifier = Modifier.padding(top = 6.dp),
        )
    } else {
        reviews.reviews.forEach { r ->
            Column(Modifier.fillMaxWidth().padding(top = 12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(r.authorName.ifBlank { "مستخدم" }, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                    StarsRow(r.rating)
                    if (r.verified) {
                        Text("مشترٍ موثّق", style = MaterialTheme.typography.labelSmall, color = com.mawrid.app.core.designsystem.MawridColors.Success)
                    }
                }
                if (r.title.isNotBlank()) {
                    Text(r.title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 2.dp))
                }
                if (r.body.isNotBlank()) {
                    Text(r.body, style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant, modifier = Modifier.padding(top = 2.dp))
                }
            }
        }
    }
}

/** Row of five filled/outlined stars for a fixed rating value. */
@Composable
private fun StarsRow(rating: Int) {
    Row {
        repeat(5) { i ->
            Icon(
                Icons.Filled.Star,
                contentDescription = null,
                tint = if (i < rating) com.mawrid.app.core.designsystem.MawridColors.StarAmber else MaterialTheme.colorScheme.surfaceVariant,
                modifier = Modifier.size(14.dp),
            )
        }
    }
}

/** Write-review dialog: 1–5 star picker + body text (≥10 chars, matching the API). */
@Composable
private fun ReviewDialog(
    submitting: Boolean,
    error: String?,
    onSubmit: (rating: Int, body: String) -> Unit,
    onDismiss: () -> Unit,
) {
    var rating by remember { mutableIntStateOf(5) }
    var body by remember { mutableStateOf("") }
    val cs = MaterialTheme.colorScheme

    androidx.compose.material3.AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("أضف تقييمك") },
        text = {
            Column {
                Row {
                    repeat(5) { i ->
                        Icon(
                            Icons.Filled.Star,
                            contentDescription = "نجمة ${i + 1}",
                            tint = if (i < rating) com.mawrid.app.core.designsystem.MawridColors.StarAmber else cs.surfaceVariant,
                            modifier = Modifier.size(32.dp).clickable { rating = i + 1 }.padding(2.dp),
                        )
                    }
                }
                androidx.compose.material3.OutlinedTextField(
                    value = body,
                    onValueChange = { body = it },
                    label = { Text("رأيك في المنتج (10 أحرف على الأقل)") },
                    minLines = 3,
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                )
                if (error != null) {
                    Text(error, color = cs.error, style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(top = 6.dp))
                }
            }
        },
        confirmButton = {
            Button(onClick = { onSubmit(rating, body) }, enabled = !submitting && body.trim().length >= 10) {
                Text(if (submitting) "جارٍ الإرسال…" else "إرسال")
            }
        },
        dismissButton = {
            androidx.compose.material3.TextButton(onClick = onDismiss) { Text("إلغاء") }
        },
    )
}

@Composable
private fun SectionTitle(text: String) {
    Text(text, style = MaterialTheme.typography.titleMedium)
}

/** Sticky bottom bar: total for the current quantity + add-to-cart CTA. */
@Composable
private fun AddToCartBar(
    product: Product,
    quantity: Int,
    selectedVariant: Variant?,
    onAddToCart: () -> Unit,
) {
    // Line total (USD) = tier unit price + variant delta, all times quantity.
    val unitUsd = Pricing.unitPriceUsd(product, quantity) + (selectedVariant?.priceDeltaUsd ?: 0.0)
    val totalUsd = unitUsd * quantity
    val total = Money.format(Money.retailUsd(totalUsd), DISPLAY_CURRENCY, IS_ARABIC)

    Surface(shadowElevation = 8.dp, color = MaterialTheme.colorScheme.surface) {
        Row(
            Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(
                    "الإجمالي",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    total,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
            Button(onClick = onAddToCart) { Text("أضف إلى السلة") }
        }
    }
}

/** Helper to make the supplier name clickable only when we have a supplierId. */
private fun Modifier.clickableSupplier(supplierId: String, onClick: (String) -> Unit): Modifier =
    this.clickable { onClick(supplierId) }
