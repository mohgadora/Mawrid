package com.mawrid.app.ui.account

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.core.designsystem.MawridColors
import com.mawrid.app.domain.model.RefundRequest
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RefundsScreen(
    onBack: () -> Unit,
    vm: RefundsViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("طلبات الاسترجاع") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                },
            )
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when {
                !state.isLoggedIn -> EmptyState("سجّل الدخول لعرض طلبات الاسترجاع")
                state.loading -> LoadingState()
                state.error != null -> ErrorState(state.error, vm::load, title = "تعذّر تحميل الطلبات")
                state.refunds.isEmpty() -> EmptyState("لا توجد طلبات استرجاع — يمكنك طلب استرجاع من صفحة الطلب")
                else -> LazyColumn(contentPadding = PaddingValues(16.dp)) {
                    items(state.refunds, key = { it.id }) { r ->
                        RefundRow(r)
                        Spacer(Modifier.height(10.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun RefundRow(r: RefundRequest) {
    val cs = MaterialTheme.colorScheme
    Card {
        Column(Modifier.fillMaxWidth().padding(14.dp)) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    r.orderRef ?: r.ref ?: "طلب استرجاع",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold,
                )
                StatusPill(r.status)
            }
            Text(
                reasonLabel(r.reason),
                style = MaterialTheme.typography.bodyMedium,
                color = cs.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp),
            )
            if (!r.notes.isNullOrBlank()) {
                Text(r.notes, style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun StatusPill(status: String) {
    val (label, color) = when (status) {
        "approved" -> "مقبول" to MawridColors.StarAmber
        "processed" -> "تمت المعالجة" to MaterialTheme.colorScheme.primary
        "rejected" -> "مرفوض" to MaterialTheme.colorScheme.error
        else -> "قيد المراجعة" to MaterialTheme.colorScheme.onSurfaceVariant
    }
    Text(label, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = color)
}

private fun reasonLabel(reason: String): String = when (reason) {
    "damaged" -> "منتج تالف"
    "wrong_item" -> "منتج خاطئ"
    "not_as_described" -> "غير مطابق للوصف"
    "missing" -> "منتج ناقص"
    "other" -> "سبب آخر"
    else -> reason
}
