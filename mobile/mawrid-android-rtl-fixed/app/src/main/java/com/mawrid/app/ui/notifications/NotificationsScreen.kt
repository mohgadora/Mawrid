package com.mawrid.app.ui.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.domain.model.AppNotification
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    onBack: () -> Unit,
    vm: NotificationsViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("الإشعارات") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                },
                actions = {
                    if (state.unreadCount > 0) {
                        TextButton(onClick = vm::markAllRead) { Text("تعيين الكل كمقروء") }
                    }
                },
            )
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when {
                !state.isLoggedIn -> EmptyState("سجّل الدخول لعرض الإشعارات")
                state.loading -> LoadingState()
                state.error != null -> ErrorState(state.error, vm::load, title = "تعذّر تحميل الإشعارات")
                state.notifications.isEmpty() -> EmptyState("لا توجد إشعارات")
                else -> LazyColumn(contentPadding = PaddingValues(12.dp)) {
                    items(state.notifications, key = { it.id }) { n ->
                        NotificationCard(n, onClick = { vm.markRead(n.id) })
                        Spacer(Modifier.height(10.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationCard(n: AppNotification, onClick: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    Card(Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
            // Unread dot
            Box(
                Modifier.padding(top = 4.dp, end = 10.dp).size(8.dp).clip(CircleShape)
                    .background(if (n.read) cs.surfaceVariant else cs.primary)
            )
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    n.title.ifBlank { "إشعار" },
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = if (n.read) FontWeight.Normal else FontWeight.Bold,
                )
                if (n.body.isNotBlank()) {
                    Text(n.body, style = MaterialTheme.typography.bodySmall, color = cs.onSurfaceVariant)
                }
            }
        }
    }
}
