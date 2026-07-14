package com.mawrid.app.ui.orders

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mawrid.app.core.designsystem.MawridColors
import com.mawrid.app.domain.model.OrderStatus

/** Colored status pill. Green when delivered, red when cancelled, brand otherwise. */
@Composable
fun OrderStatusChip(status: OrderStatus) {
    val color = when (status) {
        OrderStatus.DELIVERED -> MawridColors.Success
        OrderStatus.CANCELLED -> MaterialTheme.colorScheme.error
        else -> MaterialTheme.colorScheme.primary
    }
    Surface(color = color.copy(alpha = 0.12f), shape = RoundedCornerShape(6.dp)) {
        Text(
            status.labelAr,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = color,
            modifier = androidx.compose.ui.Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
        )
    }
}

/** Trim an ISO timestamp to just the date (yyyy-MM-dd). */
fun shortDate(iso: String?): String = iso?.take(10).orEmpty()
