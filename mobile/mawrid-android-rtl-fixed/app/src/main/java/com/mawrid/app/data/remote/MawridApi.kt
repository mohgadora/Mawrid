package com.mawrid.app.data.remote

import com.mawrid.app.data.remote.dto.AddAddressRequest
import com.mawrid.app.data.remote.dto.AddressDto
import com.mawrid.app.data.remote.dto.AdminApprovalDto
import com.mawrid.app.data.remote.dto.AdminBuyerDto
import com.mawrid.app.data.remote.dto.AdminKpiDto
import com.mawrid.app.data.remote.dto.AdminOrderDto
import com.mawrid.app.data.remote.dto.AdminProductDto
import com.mawrid.app.data.remote.dto.AdminSupplierDto
import com.mawrid.app.data.remote.dto.ApiEnvelope
import com.mawrid.app.data.remote.dto.BlogListItemDto
import com.mawrid.app.data.remote.dto.BlogPostDto
import com.mawrid.app.data.remote.dto.BuyerTypeRequest
import com.mawrid.app.data.remote.dto.ChatMessageDto
import com.mawrid.app.data.remote.dto.ClearanceDto
import com.mawrid.app.data.remote.dto.ConversationDto
import com.mawrid.app.data.remote.dto.DealDto
import com.mawrid.app.data.remote.dto.FlashSaleDto
import com.mawrid.app.data.remote.dto.MessagesPageDto
import com.mawrid.app.data.remote.dto.SendMessageRequest
import com.mawrid.app.data.remote.dto.StartConversationRequest
import com.mawrid.app.data.remote.dto.UnreadCountDto
import com.mawrid.app.data.remote.dto.CancelResultDto
import com.mawrid.app.data.remote.dto.CashbackPreviewRequest
import com.mawrid.app.data.remote.dto.CashbackResultDto
import com.mawrid.app.data.remote.dto.CategoryDto
import com.mawrid.app.data.remote.dto.CategoryProductsResponse
import com.mawrid.app.data.remote.dto.CouponDto
import com.mawrid.app.data.remote.dto.CouponValidateRequest
import com.mawrid.app.data.remote.dto.CouponValidateResultDto
import com.mawrid.app.data.remote.dto.CreateRefundRequest
import com.mawrid.app.data.remote.dto.KycStatusDto
import com.mawrid.app.data.remote.dto.RefundDto
import com.mawrid.app.data.remote.dto.ReorderTemplateDto
import com.mawrid.app.data.remote.dto.SaveTemplateRequest
import com.mawrid.app.data.remote.dto.SubmitKycRequest
import com.mawrid.app.data.remote.dto.CreateOrderRequest
import com.mawrid.app.data.remote.dto.EmptyBody
import com.mawrid.app.data.remote.dto.FollowStateDto
import com.mawrid.app.data.remote.dto.LoyaltyResponseDto
import com.mawrid.app.data.remote.dto.NotificationsResponseDto
import com.mawrid.app.data.remote.dto.OtpSendRequest
import com.mawrid.app.data.remote.dto.OtpVerifyRequest
import com.mawrid.app.data.remote.dto.OtpVerifyResult
import com.mawrid.app.data.remote.dto.RedeemPointsRequest
import com.mawrid.app.data.remote.dto.RedeemResultDto
import com.mawrid.app.data.remote.dto.ReferralResponseDto
import com.mawrid.app.data.remote.dto.TopupRequest
import com.mawrid.app.data.remote.dto.TopupResultDto
import com.mawrid.app.data.remote.dto.WalletDto
import com.mawrid.app.data.remote.dto.WalletTransactionsDto
import com.mawrid.app.data.remote.dto.OrderDto
import com.mawrid.app.data.remote.dto.ProductDto
import com.mawrid.app.data.remote.dto.ProductSearchResponse
import com.mawrid.app.data.remote.dto.ProfileDto
import com.mawrid.app.data.remote.dto.ReviewDto
import com.mawrid.app.data.remote.dto.ReviewsResponseDto
import com.mawrid.app.data.remote.dto.SubmitReviewRequest
import com.mawrid.app.data.remote.dto.SupplierDetailDto
import com.mawrid.app.data.remote.dto.SupplierDto
import com.mawrid.app.data.remote.dto.UpdateProfileRequest
import com.mawrid.app.data.remote.dto.VariantDto
import kotlinx.serialization.json.JsonObject
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Buyer API surface. Paths confirmed against the real route handlers in
 * the app/api/v1 route handlers. All responses are wrapped in { data: ... }.
 */
interface MawridApi {

    /**
     * GET /api/v1/products  ->  { data: Product[] }
     * With ?q= it runs a text search; without, it returns the featured list.
     * NOTE: this endpoint returns a flat ARRAY, not the paginated object.
     */
    @GET("api/v1/products")
    suspend fun getProducts(
        @Query("q") query: String? = null,
    ): ApiEnvelope<List<ProductDto>>

    /**
     * GET /api/v1/products/search  ->  { data: { products, total, page, totalPages } }
     * The rich, filterable endpoint for the search screen.
     */
    @GET("api/v1/products/search")
    suspend fun searchProducts(
        @Query("q") query: String? = null,
        @Query("category") category: String? = null,
        @Query("supplier") supplier: String? = null,
        @Query("sortBy") sortBy: String? = null,
        @Query("minPrice") minPrice: Double? = null,
        @Query("maxPrice") maxPrice: Double? = null,
        @Query("minRating") minRating: Double? = null,
        @Query("inStock") inStock: Boolean? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 24,
    ): ApiEnvelope<ProductSearchResponse>

    /** GET /api/v1/products/{id}  ->  { data: Product } */
    @GET("api/v1/products/{id}")
    suspend fun getProduct(@Path("id") id: String): ApiEnvelope<ProductDto>

    /** GET /api/v1/products/{id}/variants  ->  { data: Variant[] } */
    @GET("api/v1/products/{id}/variants")
    suspend fun getVariants(@Path("id") id: String): ApiEnvelope<List<VariantDto>>

    /** GET /api/v1/products/{id}/reviews  ->  { data: { averageRating, reviews, ... } } */
    @GET("api/v1/products/{id}/reviews")
    suspend fun getReviews(@Path("id") id: String): ApiEnvelope<ReviewsResponseDto>

    /** POST a review (requires auth). rating 1–5, body ≥10 chars. */
    @POST("api/v1/products/{id}/reviews")
    suspend fun postReview(@Path("id") id: String, @Body body: SubmitReviewRequest): ApiEnvelope<ReviewDto>

    /** GET /api/v1/categories  ->  { data: Category[] } */
    @GET("api/v1/categories")
    suspend fun getCategories(): ApiEnvelope<List<CategoryDto>>

    /**
     * GET /api/v1/categories?slug={slug}  ->  { data: { category, products } }.
     * Rolls up descendant categories, so a parent slug (e.g. food) returns its
     * subcategories' products. Preferred over products/search?category= for
     * category browsing (which is exact-slug and misses parents).
     */
    @GET("api/v1/categories")
    suspend fun getCategoryProducts(@Query("slug") slug: String): ApiEnvelope<CategoryProductsResponse>

    /** GET /api/v1/suppliers?slug={id}  ->  { data: { supplier, products } } */
    @GET("api/v1/suppliers")
    suspend fun getSupplier(@Query("slug") id: String): ApiEnvelope<SupplierDetailDto>

    // ── Follow a supplier/store (require the session cookie) ─────────────
    @GET("api/v1/shops/{id}/follow")
    suspend fun followState(@Path("id") id: String): ApiEnvelope<FollowStateDto>

    @POST("api/v1/shops/{id}/follow")
    suspend fun followShop(@Path("id") id: String, @Body body: EmptyBody = EmptyBody()): ApiEnvelope<FollowStateDto>

    @DELETE("api/v1/shops/{id}/follow")
    suspend fun unfollowShop(@Path("id") id: String): ApiEnvelope<FollowStateDto>

    // ── Orders (require the session cookie) ──────────────────────────────

    @GET("api/v1/orders")
    suspend fun getOrders(): ApiEnvelope<List<OrderDto>>

    @POST("api/v1/orders")
    suspend fun createOrder(@Body body: CreateOrderRequest): ApiEnvelope<OrderDto>

    @GET("api/v1/orders/{id}")
    suspend fun getOrder(@Path("id") id: String): ApiEnvelope<OrderDto>

    /** Returns `{ data: { cancelled: true } }` — NOT the order; re-fetch after. */
    @POST("api/v1/orders/{id}/cancel")
    suspend fun cancelOrder(@Path("id") id: String): ApiEnvelope<CancelResultDto>

    // ── Account (require the session cookie) ─────────────────────────────

    @GET("api/v1/account/profile")
    suspend fun getProfile(): ApiEnvelope<ProfileDto>

    @PATCH("api/v1/account/profile")
    suspend fun updateProfile(@Body body: UpdateProfileRequest): ApiEnvelope<ProfileDto>

    @GET("api/v1/account/addresses")
    suspend fun getAddresses(): ApiEnvelope<List<AddressDto>>

    @POST("api/v1/account/addresses")
    suspend fun addAddress(@Body body: AddAddressRequest): ApiEnvelope<AddressDto>

    /** Favorites list is full product objects. */
    @GET("api/v1/account/favorites")
    suspend fun getFavorites(): ApiEnvelope<List<ProductDto>>

    /** Toggle a favorite. NOTE: path has NO `/toggle` suffix (that variant 404s). */
    @POST("api/v1/account/favorites/{id}")
    suspend fun toggleFavorite(@Path("id") id: String)

    // ── Notifications ────────────────────────────────────────────────────
    @GET("api/v1/account/notifications")
    suspend fun getNotifications(): ApiEnvelope<NotificationsResponseDto>

    @POST("api/v1/account/notifications/read-all")
    suspend fun markAllNotificationsRead(@Body body: EmptyBody = EmptyBody())

    @POST("api/v1/account/notifications/{id}")
    suspend fun markNotificationRead(@Path("id") id: String, @Body body: EmptyBody = EmptyBody())

    // ── Following (followed suppliers/shops) ─────────────────────────────
    @GET("api/v1/account/following")
    suspend fun getFollowing(): ApiEnvelope<List<SupplierDto>>

    // ── Loyalty points ───────────────────────────────────────────────────
    @GET("api/v1/account/loyalty")
    suspend fun getLoyalty(): ApiEnvelope<LoyaltyResponseDto>

    /** Redeem points (requires auth). points ≥ 1; server rejects if balance is short. */
    @POST("api/v1/account/loyalty/redeem")
    suspend fun redeemPoints(@Body body: RedeemPointsRequest): ApiEnvelope<RedeemResultDto>

    // ── Referral ─────────────────────────────────────────────────────────
    @GET("api/v1/account/referral")
    suspend fun getReferral(): ApiEnvelope<ReferralResponseDto>

    // ── Wallet ───────────────────────────────────────────────────────────
    @GET("api/v1/wallet")
    suspend fun getWallet(): ApiEnvelope<WalletDto>

    @GET("api/v1/wallet/transactions")
    suspend fun getWalletTransactions(@Query("page") page: Int = 1): ApiEnvelope<WalletTransactionsDto>

    @POST("api/v1/wallet/topup")
    suspend fun topupWallet(@Body body: TopupRequest): ApiEnvelope<TopupResultDto>

    // ── Coupons & cashback (checkout) ────────────────────────────────────
    @GET("api/v1/coupons")
    suspend fun getCoupons(): ApiEnvelope<List<CouponDto>>

    @POST("api/v1/coupons/validate")
    suspend fun validateCoupon(@Body body: CouponValidateRequest): ApiEnvelope<CouponValidateResultDto>

    @POST("api/v1/cashback/preview")
    suspend fun cashbackPreview(@Body body: CashbackPreviewRequest): ApiEnvelope<CashbackResultDto>

    // ── KYC (merchant verification) ──────────────────────────────────────
    @GET("api/v1/account/kyc")
    suspend fun getKyc(): ApiEnvelope<KycStatusDto>

    @POST("api/v1/account/kyc")
    suspend fun submitKyc(@Body body: SubmitKycRequest): ApiEnvelope<KycStatusDto>

    // ── Reorder templates ────────────────────────────────────────────────
    @GET("api/v1/account/templates")
    suspend fun getTemplates(): ApiEnvelope<List<ReorderTemplateDto>>

    @POST("api/v1/account/templates")
    suspend fun saveTemplate(@Body body: SaveTemplateRequest): ApiEnvelope<ReorderTemplateDto>

    // ── Refunds / returns ────────────────────────────────────────────────
    @GET("api/v1/account/refunds")
    suspend fun getRefunds(): ApiEnvelope<List<RefundDto>>

    @POST("api/v1/account/refunds")
    suspend fun createRefund(@Body body: CreateRefundRequest): ApiEnvelope<RefundDto>

    // ── OTP phone verification ───────────────────────────────────────────
    @POST("api/v1/auth/otp/send")
    suspend fun sendOtp(@Body body: OtpSendRequest)

    @POST("api/v1/auth/otp/verify")
    suspend fun verifyOtp(@Body body: OtpVerifyRequest): ApiEnvelope<OtpVerifyResult>

    // ── Content: blog / clearance / deals / flash ────────────────────────
    @GET("api/v1/blog")
    suspend fun getBlog(@Query("page") page: Int = 1): ApiEnvelope<List<BlogListItemDto>>

    @GET("api/v1/blog/{slug}")
    suspend fun getBlogPost(@Path("slug") slug: String): ApiEnvelope<BlogPostDto>

    @GET("api/v1/clearance")
    suspend fun getClearance(): ApiEnvelope<List<ClearanceDto>>

    /** Deal of the day — data may be null when none is active. */
    @GET("api/v1/deals/today")
    suspend fun getDealToday(): ApiEnvelope<DealDto?>

    @GET("api/v1/flash-sales/active")
    suspend fun getFlashSales(): ApiEnvelope<List<FlashSaleDto>>

    // ── Supplier chat ────────────────────────────────────────────────────
    @GET("api/v1/conversations")
    suspend fun getConversations(): ApiEnvelope<List<ConversationDto>>

    @GET("api/v1/conversations/unread-count")
    suspend fun getUnreadCount(): ApiEnvelope<UnreadCountDto>

    @GET("api/v1/conversations/{id}/messages")
    suspend fun getMessages(@Path("id") id: String): ApiEnvelope<MessagesPageDto>

    @POST("api/v1/conversations/{id}/messages")
    suspend fun sendMessage(@Path("id") id: String, @Body body: SendMessageRequest): ApiEnvelope<ChatMessageDto>

    @POST("api/v1/conversations/{id}/read")
    suspend fun markConversationRead(@Path("id") id: String, @Body body: EmptyBody = EmptyBody())

    @POST("api/v1/conversations/start")
    suspend fun startConversation(@Body body: StartConversationRequest): ApiEnvelope<ConversationDto>

    // ── Buyer type (consumer ↔ merchant pricing) ─────────────────────────
    @POST("api/v1/account/buyer-type")
    suspend fun setBuyerType(@Body body: BuyerTypeRequest): ApiEnvelope<ProfileDto>

    // ── Admin (require role=admin; 403 otherwise) ────────────────────────
    @GET("api/v1/admin/kpi")
    suspend fun getAdminKpi(): ApiEnvelope<AdminKpiDto>

    @GET("api/v1/admin/orders")
    suspend fun getAdminOrders(): ApiEnvelope<List<AdminOrderDto>>

    @GET("api/v1/admin/products")
    suspend fun getAdminProducts(): ApiEnvelope<List<AdminProductDto>>

    @GET("api/v1/admin/buyers")
    suspend fun getAdminBuyers(): ApiEnvelope<List<AdminBuyerDto>>

    @GET("api/v1/admin/suppliers")
    suspend fun getAdminSuppliers(): ApiEnvelope<List<AdminSupplierDto>>

    @GET("api/v1/admin/approvals")
    suspend fun getAdminApprovals(): ApiEnvelope<List<AdminApprovalDto>>

    /** Generic admin list — [path] is an encoded sub-path (e.g. "coupons", "finance/withdrawals"). */
    @GET("api/v1/admin/{path}")
    suspend fun getAdminList(@Path(value = "path", encoded = true) path: String): ApiEnvelope<List<JsonObject>>

    /** Generic admin write action POST (e.g. "products/{id}/approve"). Empty JSON body. */
    @POST("api/v1/admin/{path}")
    suspend fun postAdminAction(@Path(value = "path", encoded = true) path: String, @Body body: EmptyBody = EmptyBody())

    // ── Partner / supplier portal (require role=supplier; 403 otherwise) ─
    @GET("api/v1/partner/{path}")
    suspend fun getPartnerList(@Path(value = "path", encoded = true) path: String): ApiEnvelope<List<JsonObject>>

    @GET("api/v1/partner/dashboard")
    suspend fun getPartnerDashboard(): ApiEnvelope<JsonObject>
}
