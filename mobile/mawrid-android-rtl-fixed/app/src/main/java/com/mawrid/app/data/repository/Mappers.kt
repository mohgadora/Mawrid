package com.mawrid.app.data.repository

import com.mawrid.app.data.remote.dto.AddressDto
import com.mawrid.app.data.remote.dto.CategoryDto
import com.mawrid.app.data.remote.dto.NotificationDto
import com.mawrid.app.data.remote.dto.NotificationsResponseDto
import com.mawrid.app.data.remote.dto.OrderDto
import com.mawrid.app.data.remote.dto.ProductDto
import com.mawrid.app.data.remote.dto.ProfileDto
import com.mawrid.app.data.remote.dto.RatingBucketDto
import com.mawrid.app.data.remote.dto.ReviewDto
import com.mawrid.app.data.remote.dto.ReviewsResponseDto
import com.mawrid.app.data.remote.dto.SupplierDto
import com.mawrid.app.data.remote.dto.VariantDto
import com.mawrid.app.domain.model.Address
import com.mawrid.app.domain.model.AppNotification
import com.mawrid.app.domain.model.Category
import com.mawrid.app.domain.model.NotificationsFeed
import com.mawrid.app.domain.model.Order
import com.mawrid.app.domain.model.OrderAddress
import com.mawrid.app.domain.model.OrderEvent
import com.mawrid.app.domain.model.OrderLine
import com.mawrid.app.domain.model.OrderStatus
import com.mawrid.app.domain.model.PriceTier
import com.mawrid.app.domain.model.Product
import com.mawrid.app.domain.model.ProductReviews
import com.mawrid.app.domain.model.RatingBucket
import com.mawrid.app.domain.model.Review
import com.mawrid.app.domain.model.Supplier
import com.mawrid.app.domain.model.UserProfile
import com.mawrid.app.domain.model.Variant

/**
 * DTO → domain mappers, shared across repositories. `origin` is the API base
 * origin used to resolve relative image paths to absolute URLs.
 */

/** Resolve a possibly-relative image path (e.g. "/products/rice.png") to an absolute URL. */
internal fun resolveImage(path: String?, origin: String): String? = when {
    path.isNullOrBlank() -> null
    path.startsWith("http://") || path.startsWith("https://") -> path
    path.startsWith("/") -> "$origin$path"
    else -> "$origin/$path"
}

internal fun ProductDto.toDomain(origin: String): Product = Product(
    id = id,
    nameAr = nameAr ?: name ?: "",
    nameEn = nameEn ?: name ?: "",
    supplierAr = supplierAr ?: "",
    supplierEn = supplierEn ?: "",
    supplierId = supplierId,
    imageUrl = resolveImage(imageUrl ?: image, origin),
    // basePrice is the card's "from" price = the cheapest (highest-qty) tier.
    // Derive it from tiers so it's consistent no matter which endpoint returned
    // the product: the list endpoint reports basePrice=18 for white-sugar while
    // /account/favorites reports 20 for the same tiers — trusting the server field
    // makes the same product show two different prices. Fall back to it only when
    // there are no tiers.
    basePriceUsd = tiers.minOfOrNull { it.pricePerCarton } ?: basePrice ?: 0.0,
    oldPriceUsd = oldPrice,
    marketPriceUsd = marketPrice,
    rating = rating ?: 0.0,
    moq = moq ?: tiers.minOfOrNull { it.minQty } ?: 1,
    verified = verified ?: false,
    categorySlug = categorySlug,
    tiers = tiers.map { PriceTier(minQty = it.minQty, pricePerCartonUsd = it.pricePerCarton) }
        .sortedBy { it.minQty },
    unitsPerCarton = unitsPerCarton,
    descriptionAr = descriptionAr ?: "",
    descriptionEn = descriptionEn ?: "",
)

internal fun SupplierDto.toDomain(origin: String): Supplier = Supplier(
    id = id,
    nameAr = nameAr ?: "",
    nameEn = nameEn ?: "",
    verified = verified ?: false,
    rating = rating ?: 0.0,
    logoUrl = resolveImage(logo, origin),
    descriptionAr = descriptionAr ?: "",
    descriptionEn = descriptionEn ?: "",
    cityAr = cityAr ?: "",
    cityEn = cityEn ?: "",
    since = since,
    followerCount = followerCount ?: 0,
)

internal fun NotificationDto.toDomain(): AppNotification = AppNotification(
    id = id,
    type = type ?: "",
    title = title ?: "",
    body = body ?: "",
    link = link,
    read = read,
    createdAtIso = createdAt ?: "",
)

internal fun NotificationsResponseDto.toDomain(): NotificationsFeed = NotificationsFeed(
    notifications = notifications.map { it.toDomain() },
    unreadCount = unreadCount,
)

internal fun ReviewDto.toDomain(): Review = Review(
    id = id,
    authorName = authorName ?: "",
    rating = rating,
    title = title ?: "",
    body = body ?: "",
    helpfulCount = helpfulCount,
    verified = verified,
    createdAtIso = createdAt ?: "",
)

internal fun RatingBucketDto.toDomain(): RatingBucket = RatingBucket(stars = stars, count = count, pct = pct)

internal fun ReviewsResponseDto.toDomain(): ProductReviews = ProductReviews(
    averageRating = averageRating,
    totalCount = totalCount,
    distribution = distribution.map { it.toDomain() },
    reviews = reviews.map { it.toDomain() },
)

internal fun VariantDto.toDomain(): Variant = Variant(
    id = id,
    nameAr = nameAr ?: name ?: "",
    nameEn = nameEn ?: name ?: "",
    priceDeltaUsd = priceDelta ?: 0.0,
    inStock = inStock ?: true,
)

internal fun CategoryDto.toDomain(origin: String): Category = Category(
    slug = slug,
    nameAr = nameAr ?: name ?: "",
    nameEn = nameEn ?: name ?: "",
    imageUrl = resolveImage(imageUrl ?: image, origin),
    productCount = productCount ?: count,
    parentSlug = parentSlug,
)

internal fun ProfileDto.toDomain(id: String = ""): UserProfile = UserProfile(
    id = id,
    name = name.orEmpty(),
    email = email.orEmpty(),
    phone = phone.orEmpty(),
    company = company.orEmpty(),
    country = country ?: "SA",
    role = role ?: "consumer",
)

internal fun AddressDto.toDomain(): Address = Address(
    id = id.orEmpty(),
    label = label.orEmpty(),
    line1 = line1.orEmpty(),
    city = city.orEmpty(),
    phone = phone.orEmpty(),
    isDefault = isDefault,
)

internal fun OrderDto.toDomain(origin: String): Order = Order(
    id = id,
    ref = ref ?: id,
    createdAtIso = createdAt,
    status = OrderStatus.from(status),
    timeline = timeline.map { OrderEvent(OrderStatus.from(it.status), it.at) },
    lines = lines.map {
        OrderLine(
            productId = it.productId.orEmpty(),
            name = it.productName.orEmpty(),
            imageUrl = resolveImage(it.productImage, origin),
            qty = it.qty,
            unitPriceUsd = it.unitPrice,
        )
    },
    subtotalUsd = subtotalUsd,
    shippingUsd = shippingUsd,
    savingsUsd = savingsUsd,
    totalUsd = totalUsd,
    address = address?.let {
        OrderAddress(it.label.orEmpty(), it.line1.orEmpty(), it.city.orEmpty(), it.phone.orEmpty())
    },
    deliverySlotAr = deliverySlotAr.orEmpty(),
    deliverySlotEn = deliverySlotEn.orEmpty(),
    paymentMethod = paymentMethod ?: "cod",
    paymentStatus = paymentStatus ?: "unpaid",
)
