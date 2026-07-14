package com.mawrid.app.ui.product

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mawrid.app.data.repository.AccountRepository
import com.mawrid.app.data.repository.AuthRepository
import com.mawrid.app.data.repository.CartRepository
import com.mawrid.app.data.repository.CatalogRepository
import com.mawrid.app.data.repository.CompareStore
import com.mawrid.app.domain.model.Product
import com.mawrid.app.domain.model.ProductReviews
import com.mawrid.app.domain.model.Variant
import com.mawrid.app.ui.navigation.Routes
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProductDetailUiState(
    val loading: Boolean = true,
    val product: Product? = null,
    val variants: List<Variant> = emptyList(),
    val selectedVariantId: String? = null,
    val quantity: Int = 1,
    val error: String? = null,
    val isLoggedIn: Boolean = false,
    val isFavorite: Boolean = false,
    val reviews: ProductReviews = ProductReviews.EMPTY,
    val submittingReview: Boolean = false,
    val reviewError: String? = null,
    val reviewJustSubmitted: Boolean = false,
    val isInCompare: Boolean = false,
)

@HiltViewModel
class ProductDetailViewModel @Inject constructor(
    private val repo: CatalogRepository,
    private val cart: CartRepository,
    private val account: AccountRepository,
    private val compare: CompareStore,
    auth: AuthRepository,
    savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val productId: String = checkNotNull(savedStateHandle[Routes.ARG_PRODUCT_ID]) {
        "ProductDetail requires a ${Routes.ARG_PRODUCT_ID} argument"
    }

    private val _state = MutableStateFlow(ProductDetailUiState(isLoggedIn = auth.isLoggedIn.value))
    val state: StateFlow<ProductDetailUiState> = _state.asStateFlow()

    init {
        load()
        refreshFavoriteStatus()
        loadReviews()
        viewModelScope.launch {
            compare.products.collect { list ->
                _state.update { it.copy(isInCompare = list.any { p -> p.id == productId }) }
            }
        }
    }

    /** Add/remove this product from the comparison set (max reached → no-op). */
    fun toggleCompare() {
        _state.value.product?.let { compare.toggle(it) }
    }

    private fun loadReviews() {
        viewModelScope.launch {
            repo.reviews(productId).onSuccess { r -> _state.update { it.copy(reviews = r) } }
        }
    }

    /** Submit a review, then refresh the list. Errors surface in [ProductDetailUiState.reviewError]. */
    fun submitReview(rating: Int, body: String, title: String?) {
        _state.update { it.copy(submittingReview = true, reviewError = null) }
        viewModelScope.launch {
            repo.submitReview(productId, rating, body, title)
                .onSuccess {
                    _state.update { it.copy(submittingReview = false, reviewJustSubmitted = true) }
                    loadReviews()
                }
                .onFailure { e ->
                    _state.update { it.copy(submittingReview = false, reviewError = e.message ?: "تعذّر إرسال التقييم") }
                }
        }
    }

    /** Reset the one-shot "review submitted" signal after the UI consumes it. */
    fun consumeReviewSubmitted() = _state.update { it.copy(reviewJustSubmitted = false) }

    /** There's no per-product favorite flag on the API, so derive it from the list. */
    private fun refreshFavoriteStatus() {
        if (!_state.value.isLoggedIn) return
        viewModelScope.launch {
            account.favorites().onSuccess { favorites ->
                _state.update { it.copy(isFavorite = favorites.any { p -> p.id == productId }) }
            }
        }
    }

    /**
     * Optimistically flip the favorite state, then POST. The endpoint is a plain
     * toggle (no request/response body), so on failure we revert the UI.
     */
    fun toggleFavorite() {
        if (!_state.value.isLoggedIn) return
        val target = !_state.value.isFavorite
        _state.update { it.copy(isFavorite = target) }
        viewModelScope.launch {
            account.toggleFavorite(productId).onFailure {
                _state.update { it.copy(isFavorite = !target) }
            }
        }
    }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            // Fetch product and variants in parallel; variants are optional so a
            // failure there shouldn't block showing the product.
            val productDeferred = async { repo.product(productId) }
            val variantsDeferred = async { repo.variants(productId) }

            productDeferred.await()
                .onSuccess { product ->
                    val variants = variantsDeferred.await().getOrDefault(emptyList())
                    _state.update {
                        it.copy(
                            loading = false,
                            product = product,
                            variants = variants,
                            // Default quantity to the minimum order quantity.
                            quantity = product.moq.coerceAtLeast(1),
                            selectedVariantId = variants.firstOrNull { v -> v.inStock }?.id,
                        )
                    }
                }
                .onFailure { e ->
                    _state.update { it.copy(loading = false, error = e.message ?: "Error") }
                }
        }
    }

    fun selectVariant(id: String) = _state.update { it.copy(selectedVariantId = id) }

    /** Add the current product + selected variant + quantity to the cart. */
    fun addToCart() {
        val s = _state.value
        val product = s.product ?: return
        val variant = s.variants.firstOrNull { it.id == s.selectedVariantId }
        cart.add(product, variant, s.quantity)
    }

    /** Increase quantity by one carton. */
    fun increaseQty() = _state.update { it.copy(quantity = it.quantity + 1) }

    /** Decrease quantity, never below the product's MOQ. */
    fun decreaseQty() = _state.update {
        val floor = it.product?.moq?.coerceAtLeast(1) ?: 1
        it.copy(quantity = (it.quantity - 1).coerceAtLeast(floor))
    }
}
