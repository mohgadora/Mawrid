package com.mawrid.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.lifecycle.lifecycleScope
import com.mawrid.app.core.designsystem.MawridTheme
import com.mawrid.app.core.money.BuyerTypeStore
import com.mawrid.app.core.money.Money
import com.mawrid.app.ui.navigation.MawridNavHost
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var buyerTypeStore: BuyerTypeStore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Seed the pricing markup from the persisted buyer type at launch.
        lifecycleScope.launch { Money.merchantPricing = buyerTypeStore.isMerchant() }
        setContent {
            // Force RTL layout regardless of device locale — the app is Arabic-first.
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                MawridTheme {
                    Surface(Modifier.fillMaxSize()) {
                        MawridNavHost()
                    }
                }
            }
        }
    }
}
