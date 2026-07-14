package com.mawrid.app.ui.content

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.ContentRepository
import com.mawrid.app.domain.model.BlogPost
import com.mawrid.app.domain.model.BlogSummary
import com.mawrid.app.ui.navigation.Routes
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BlogUiState(
    val loading: Boolean = true,
    val posts: List<BlogSummary> = emptyList(),
    val error: String? = null,
)

@HiltViewModel
class BlogViewModel @Inject constructor(
    private val content: ContentRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(BlogUiState())
    val state: StateFlow<BlogUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            content.blog()
                .onSuccess { list -> _state.update { it.copy(loading = false, posts = list) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }
}

data class BlogPostUiState(
    val loading: Boolean = true,
    val post: BlogPost? = null,
    val error: String? = null,
)

@HiltViewModel
class BlogPostViewModel @Inject constructor(
    private val content: ContentRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val slug: String = checkNotNull(savedStateHandle[Routes.ARG_SLUG])

    private val _state = MutableStateFlow(BlogPostUiState())
    val state: StateFlow<BlogPostUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            content.blogPost(slug)
                .onSuccess { p -> _state.update { it.copy(loading = false, post = p) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message ?: "Error") } }
        }
    }
}
