package com.mawrid.app.core.designsystem

import androidx.compose.material3.Typography
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import com.mawrid.app.R

/**
 * Cairo — the website's brand typeface. We ship the single variable font
 * (`cairo_variable.ttf`) and materialize the weights we use via [FontVariation]
 * (the `wght` axis). Variable-font weights need API 26+, which is our minSdk.
 */
@OptIn(ExperimentalTextApi::class)
private fun cairo(weight: Int) = Font(
    resId = R.font.cairo_variable,
    weight = FontWeight(weight),
    variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
)

val CairoFamily = FontFamily(
    cairo(400), // Regular
    cairo(500), // Medium
    cairo(600), // SemiBold
    cairo(700), // Bold
    cairo(900), // Black
)

/** Apply [family] to every role in a Typography, preserving sizes/weights. */
private fun Typography.withFamily(family: FontFamily) = Typography(
    displayLarge = displayLarge.copy(fontFamily = family),
    displayMedium = displayMedium.copy(fontFamily = family),
    displaySmall = displaySmall.copy(fontFamily = family),
    headlineLarge = headlineLarge.copy(fontFamily = family),
    headlineMedium = headlineMedium.copy(fontFamily = family),
    headlineSmall = headlineSmall.copy(fontFamily = family),
    titleLarge = titleLarge.copy(fontFamily = family),
    titleMedium = titleMedium.copy(fontFamily = family),
    titleSmall = titleSmall.copy(fontFamily = family),
    bodyLarge = bodyLarge.copy(fontFamily = family),
    bodyMedium = bodyMedium.copy(fontFamily = family),
    bodySmall = bodySmall.copy(fontFamily = family),
    labelLarge = labelLarge.copy(fontFamily = family),
    labelMedium = labelMedium.copy(fontFamily = family),
    labelSmall = labelSmall.copy(fontFamily = family),
)

/**
 * App type scale: Material3 defaults in Cairo, then a few brand overrides (heavier
 * titles matching the website's bold Arabic headings).
 */
val MawridTypography: Typography = Typography().withFamily(CairoFamily).run {
    copy(
        titleLarge = titleLarge.copy(fontWeight = FontWeight.Black),
        titleMedium = titleMedium.copy(fontWeight = FontWeight.Bold),
        labelSmall = labelSmall.copy(fontWeight = FontWeight.Medium),
    )
}
