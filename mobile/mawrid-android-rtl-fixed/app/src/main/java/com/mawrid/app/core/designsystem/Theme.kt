package com.mawrid.app.core.designsystem

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

// Full brand palette mapping. Every role is set so no Material3 default
// (notably the baseline purple secondary/tertiary) can leak into chips,
// containers, or tiles. Warm "accent" peach doubles as the container tone.
private val LightColors = lightColorScheme(
    primary = MawridColors.Primary,
    onPrimary = MawridColors.PrimaryForeground,
    primaryContainer = MawridColors.Accent,
    onPrimaryContainer = MawridColors.AccentForeground,
    secondary = MawridColors.Secondary,
    onSecondary = MawridColors.SecondaryForeground,
    secondaryContainer = MawridColors.Accent,
    onSecondaryContainer = MawridColors.AccentForeground,
    tertiary = MawridColors.Primary,
    onTertiary = MawridColors.PrimaryForeground,
    background = MawridColors.Background,
    onBackground = MawridColors.Foreground,
    surface = MawridColors.Card,
    onSurface = MawridColors.CardForeground,
    surfaceVariant = MawridColors.Muted,
    onSurfaceVariant = MawridColors.MutedForeground,
    outline = MawridColors.Border,
    error = MawridColors.Destructive,
)

private val DarkColors = darkColorScheme(
    primary = MawridColors.PrimaryDark,
    onPrimary = MawridColors.PrimaryForeground,
    primaryContainer = MawridColors.SecondaryDark,
    onPrimaryContainer = MawridColors.ForegroundDark,
    secondary = MawridColors.SecondaryDark,
    onSecondary = MawridColors.ForegroundDark,
    secondaryContainer = MawridColors.SecondaryDark,
    onSecondaryContainer = MawridColors.ForegroundDark,
    tertiary = MawridColors.PrimaryDark,
    onTertiary = MawridColors.PrimaryForeground,
    background = MawridColors.BackgroundDark,
    onBackground = MawridColors.ForegroundDark,
    surface = MawridColors.CardDark,
    onSurface = MawridColors.ForegroundDark,
    surfaceVariant = MawridColors.MutedDark,
    onSurfaceVariant = MawridColors.MutedForegroundDark,
    outline = MawridColors.BorderDark,
    error = MawridColors.Destructive,
)

@Composable
fun MawridTheme(
    // The website ships a dark-first design (with an unused light toggle), so the
    // app forces dark for visual parity rather than following the system setting.
    darkTheme: Boolean = true,
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = MawridTypography,
        content = content,
    )
}
