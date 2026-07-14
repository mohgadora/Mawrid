package com.mawrid.app.ui.cart

import androidx.lifecycle.ViewModel
import com.mawrid.app.data.repository.CartRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject

/** Exposes the cart item count for the bottom-nav badge. */
@HiltViewModel
class CartBadgeViewModel @Inject constructor(
    cart: CartRepository,
) : ViewModel() {
    val itemCount: StateFlow<Int> = cart.itemCount
}
