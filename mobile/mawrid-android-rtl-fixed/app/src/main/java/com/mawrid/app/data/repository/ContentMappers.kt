package com.mawrid.app.data.repository

import com.mawrid.app.data.remote.dto.BlogListItemDto
import com.mawrid.app.data.remote.dto.BlogPostDto
import com.mawrid.app.data.remote.dto.ChatMessageDto
import com.mawrid.app.data.remote.dto.ClearanceDto
import com.mawrid.app.data.remote.dto.ConversationDto
import com.mawrid.app.data.remote.dto.DealDto
import com.mawrid.app.data.remote.dto.FlashSaleDto
import com.mawrid.app.domain.model.BlogPost
import com.mawrid.app.domain.model.BlogSummary
import com.mawrid.app.domain.model.ChatMessage
import com.mawrid.app.domain.model.ClearanceItem
import com.mawrid.app.domain.model.Conversation
import com.mawrid.app.domain.model.Deal
import com.mawrid.app.domain.model.FlashSale

internal fun BlogListItemDto.toDomain(origin: String): BlogSummary = BlogSummary(
    slug = slug,
    title = titleAr ?: titleEn ?: "مقال",
    excerpt = excerptAr,
    imageUrl = resolveImage(coverImage, origin),
    publishedAtIso = publishedAt,
)

internal fun BlogPostDto.toDomain(origin: String): BlogPost = BlogPost(
    slug = slug,
    title = titleAr ?: titleEn ?: "مقال",
    body = bodyAr ?: bodyEn ?: "",
    imageUrl = resolveImage(coverImage, origin),
    publishedAtIso = publishedAt,
)

internal fun DealDto.toDomain(origin: String): Deal = Deal(
    id = id,
    title = titleAr ?: titleEn ?: "عرض اليوم",
    productId = productId,
    productName = productName ?: "منتج",
    imageUrl = resolveImage(image, origin),
    basePriceUsd = basePrice,
    salePriceUsd = salePrice,
)

/** Flatten clearance groups into a single item list for a simple grid. */
internal fun List<ClearanceDto>.toClearanceItems(origin: String): List<ClearanceItem> =
    flatMap { group ->
        group.products.map { p ->
            ClearanceItem(
                productId = p.productId,
                name = p.name,
                imageUrl = resolveImage(p.image, origin),
                discountPercent = p.discountPercent.toInt(),
                salePriceUsd = p.salePrice,
            )
        }
    }

internal fun FlashSaleDto.toDomain(): FlashSale = FlashSale(
    id = id,
    title = titleAr ?: titleEn ?: "تخفيضات سريعة",
    endsAtIso = endsAt,
)

internal fun ConversationDto.toDomain(): Conversation = Conversation(
    id = id,
    otherName = otherName,
    lastMessage = lastMessage,
    lastMessageAtIso = lastMessageAt,
    unread = unread,
)

internal fun ChatMessageDto.toDomain(currentUserId: String?): ChatMessage = ChatMessage(
    id = id,
    body = body,
    mine = senderId != null && senderId == currentUserId,
    createdAtIso = createdAt,
)
