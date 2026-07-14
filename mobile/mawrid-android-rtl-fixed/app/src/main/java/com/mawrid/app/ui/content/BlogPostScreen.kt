package com.mawrid.app.ui.content

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.mawrid.app.ui.components.ErrorState
import com.mawrid.app.ui.components.LoadingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BlogPostScreen(
    onBack: () -> Unit,
    vm: BlogPostViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.post?.title ?: "مقال", maxLines = 1) },
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
                state.loading -> LoadingState()
                state.error != null && state.post == null ->
                    ErrorState(state.error, vm::load, title = "تعذّر تحميل المقال")
                state.post != null -> {
                    val post = state.post!!
                    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
                        if (post.imageUrl != null) {
                            AsyncImage(
                                model = post.imageUrl,
                                contentDescription = post.title,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxWidth().height(200.dp).clip(RoundedCornerShape(0.dp)),
                            )
                        }
                        Column(Modifier.padding(16.dp)) {
                            Text(post.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                            Text(
                                post.body,
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 12.dp),
                            )
                        }
                    }
                }
            }
        }
    }
}
