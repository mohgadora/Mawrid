package com.mawrid.app.ui.following

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
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.mawrid.app.core.designsystem.MawridColors
import com.mawrid.app.domain.model.Supplier
import com.mawrid.app.ui.UiDefaults.IS_ARABIC
import com.mawrid.app.ui.components.EmptyState
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FollowingScreen(
    onBack: () -> Unit,
    onSupplierClick: (String) -> Unit,
    vm: FollowingViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("المتاجر المتابَعة") },
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
                !state.isLoggedIn -> EmptyState("سجّل الدخول لعرض المتاجر المتابَعة")
                state.loading -> LoadingState()
                state.error != null -> ErrorState(state.error, vm::load, title = "تعذّر تحميل المتاجر")
                state.suppliers.isEmpty() -> EmptyState("لا تتابع أي متجر بعد")
                else -> LazyColumn(contentPadding = PaddingValues(12.dp)) {
                    items(state.suppliers, key = { it.id }) { s ->
                        SupplierRow(s, onClick = { onSupplierClick(s.id) })
                        Spacer(Modifier.height(10.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun SupplierRow(supplier: Supplier, onClick: () -> Unit) {
    val cs = MaterialTheme.colorScheme
    Card(Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            AsyncImage(
                model = supplier.logoUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.size(48.dp).clip(CircleShape).background(cs.surfaceVariant),
            )
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(supplier.displayName(IS_ARABIC), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                    if (supplier.verified) {
                        Icon(Icons.Filled.Verified, null, tint = MawridColors.Success, modifier = Modifier.size(14.dp))
                    }
                }
                if (supplier.displayCity(IS_ARABIC).isNotBlank()) {
                    Text(supplier.displayCity(IS_ARABIC), style = MaterialTheme.typography.labelSmall, color = cs.onSurfaceVariant)
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                Icon(Icons.Filled.Star, null, tint = MawridColors.StarAmber, modifier = Modifier.size(14.dp))
                Text(supplier.rating.toString(), style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}
