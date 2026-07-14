package com.mawrid.app.ui.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

/** Centered spinner filling the available space. */
@Composable
fun LoadingState(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() }
}

/** Error message with a retry button. [message] is the technical detail (small, muted). */
@Composable
fun ErrorState(
    message: String?,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
    title: String = "حدث خطأ",
    retryLabel: String = "إعادة المحاولة",
) {
    Box(modifier.fillMaxSize(), Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            if (!message.isNullOrBlank()) {
                Text(
                    message,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 4.dp, start = 24.dp, end = 24.dp),
                )
            }
            Button(onClick = onRetry, modifier = Modifier.padding(top = 12.dp)) { Text(retryLabel) }
        }
    }
}

/** Simple centered empty-state message. */
@Composable
fun EmptyState(message: String, modifier: Modifier = Modifier) {
    Box(modifier.fillMaxSize(), Alignment.Center) {
        Text(message, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
