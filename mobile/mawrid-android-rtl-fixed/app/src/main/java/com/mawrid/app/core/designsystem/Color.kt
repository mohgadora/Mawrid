package com.mawrid.app.core.designsystem

import androidx.compose.ui.graphics.Color

/**
 * Semantic color tokens converted from the web app's real OKLCH design tokens
 * (app/globals.css). The brand primary is a warm orange — oklch(0.64 0.21 33)
 * in light, oklch(0.68 0.21 33) in dark — matching the website exactly.
 * Regenerate these hex values from globals.css if the tokens change.
 */
object MawridColors {
    // ── Light ──
    val Background = Color(0xFFFCFAF8)
    val Foreground = Color(0xFF1F1917)
    val Card = Color(0xFFFFFFFF)
    val CardForeground = Color(0xFF1F1917)
    val Primary = Color(0xFFF04827)          // brand orange
    val PrimaryForeground = Color(0xFFFFFAF5)
    val Secondary = Color(0xFFFAF4EF)
    val SecondaryForeground = Color(0xFF372B26)
    val Muted = Color(0xFFF4F1EE)
    val MutedForeground = Color(0xFF7C6E69)
    val Accent = Color(0xFFFFEEDE)
    val AccentForeground = Color(0xFF723311)
    val Border = Color(0xFFE4E0DE)
    val Input = Color(0xFFE4E0DE)
    val Ring = Color(0xFFF04827)
    val Destructive = Color(0xFFE7000B)
    val Success = Color(0xFF16A34A)          // verified badge
    val SuccessForeground = Color(0xFFFFFFFF)
    val StarAmber = Color(0xFFF59E0B)        // rating star (chart-3)

    // ── Dark ──
    val BackgroundDark = Color(0xFF100C0B)
    val ForegroundDark = Color(0xFFF8F4F2)
    val CardDark = Color(0xFF1D1715)
    val PrimaryDark = Color(0xFFFF5636)
    val SecondaryDark = Color(0xFF2B2523)
    val MutedDark = Color(0xFF2B2523)
    val MutedForegroundDark = Color(0xFF91827D)
    val BorderDark = Color(0xFF322C2A)
}
