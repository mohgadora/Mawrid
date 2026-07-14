package com.mawrid.app.data.repository

import com.mawrid.app.core.network.ApiConfig
import com.mawrid.app.data.remote.MawridApi
import com.mawrid.app.domain.model.BlogPost
import com.mawrid.app.domain.model.BlogSummary
import com.mawrid.app.domain.model.ClearanceItem
import com.mawrid.app.domain.model.Deal
import com.mawrid.app.domain.model.FlashSale
import javax.inject.Inject
import javax.inject.Singleton

/** Content surfaces: blog, clearance, deal-of-day, flash-sales. */
@Singleton
class ContentRepository @Inject constructor(
    private val api: MawridApi,
    private val apiConfig: ApiConfig,
) {
    private suspend fun origin(): String = apiConfig.baseUrl().trimEnd('/')

    suspend fun blog(): Result<List<BlogSummary>> = runCatching {
        val o = origin()
        api.getBlog().data.map { it.toDomain(o) }
    }

    suspend fun blogPost(slug: String): Result<BlogPost> = runCatching {
        api.getBlogPost(slug).data.toDomain(origin())
    }

    suspend fun clearance(): Result<List<ClearanceItem>> = runCatching {
        api.getClearance().data.toClearanceItems(origin())
    }

    /** Deal of the day, or null when none is active. */
    suspend fun dealToday(): Result<Deal?> = runCatching {
        api.getDealToday().data?.toDomain(origin())
    }

    suspend fun flashSales(): Result<List<FlashSale>> = runCatching {
        api.getFlashSales().data.map { it.toDomain() }
    }
}
