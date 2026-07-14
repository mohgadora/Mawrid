package com.mawrid.app.core.money

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.buyerTypeDataStore by preferencesDataStore(name = "mawrid_buyer_type")

/**
 * Persists whether the user shops as a merchant (wholesale pricing). The value
 * mirrors the server-side role and drives [Money.merchantPricing].
 */
@Singleton
class BuyerTypeStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val key = booleanPreferencesKey("is_merchant")

    val isMerchantFlow = context.buyerTypeDataStore.data.map { it[key] ?: false }

    suspend fun isMerchant(): Boolean = isMerchantFlow.first()

    /** Persist the flag and apply it to the shared pricing markup immediately. */
    suspend fun setMerchant(merchant: Boolean) {
        context.buyerTypeDataStore.edit { it[key] = merchant }
        Money.merchantPricing = merchant
    }
}
