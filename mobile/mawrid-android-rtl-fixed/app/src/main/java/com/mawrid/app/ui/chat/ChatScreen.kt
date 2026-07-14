package com.mawrid.app.ui.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.mawrid.app.domain.model.ChatMessage
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    onBack: () -> Unit,
    vm: ChatViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()
    val listState = rememberLazyListState()

    // Keep the newest message in view as the thread grows.
    LaunchedEffect(state.messages.size) {
        if (state.messages.isNotEmpty()) listState.animateScrollToItem(state.messages.size - 1)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("المحادثة") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                    }
                },
            )
        },
        bottomBar = {
            Surface(shadowElevation = 8.dp, color = MaterialTheme.colorScheme.surface) {
                Row(Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(
                        value = state.draft,
                        onValueChange = vm::onDraft,
                        placeholder = { Text("اكتب رسالة…") },
                        modifier = Modifier.weight(1f),
                        maxLines = 4,
                    )
                    IconButton(onClick = vm::send, enabled = state.canSend) {
                        Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "إرسال", tint = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        },
    ) { padding ->
        Box(Modifier.fillMaxSize().padding(padding)) {
            when {
                state.loading -> LoadingState()
                state.error != null && state.messages.isEmpty() ->
                    ErrorState(state.error, vm::load, title = "تعذّر تحميل المحادثة")
                else -> LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(12.dp),
                ) {
                    items(state.messages.size) { i ->
                        MessageBubble(state.messages[i])
                        Spacer(Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun MessageBubble(m: ChatMessage) {
    val cs = MaterialTheme.colorScheme
    val bg = if (m.mine) cs.primary else cs.surfaceVariant
    val fg = if (m.mine) cs.onPrimary else cs.onSurface
    Row(
        Modifier.fillMaxWidth(),
        horizontalArrangement = if (m.mine) androidx.compose.foundation.layout.Arrangement.End else androidx.compose.foundation.layout.Arrangement.Start,
    ) {
        Box(
            Modifier
                .widthIn(max = 280.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(bg)
                .padding(horizontal = 12.dp, vertical = 8.dp),
        ) {
            Text(m.body, color = fg, style = MaterialTheme.typography.bodyMedium)
        }
    }
}
