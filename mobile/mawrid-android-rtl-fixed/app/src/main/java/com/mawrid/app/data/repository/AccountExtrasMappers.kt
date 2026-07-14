package com.mawrid.app.data.repository

import com.mawrid.app.data.remote.dto.KycStatusDto
import com.mawrid.app.data.remote.dto.RefundDto
import com.mawrid.app.data.remote.dto.ReorderTemplateDto
import com.mawrid.app.data.remote.dto.TemplateItemDto
import com.mawrid.app.domain.model.KycStatus
import com.mawrid.app.domain.model.RefundRequest
import com.mawrid.app.domain.model.ReorderTemplate
import com.mawrid.app.domain.model.TemplateItem

internal fun KycStatusDto.toDomain(): KycStatus = KycStatus(
    status = status,
    crNumber = crNumber,
    vatNumber = vatNumber,
)

internal fun TemplateItemDto.toDomain(origin: String): TemplateItem = TemplateItem(
    productId = productId,
    qty = qty,
    name = product?.nameAr ?: product?.nameEn ?: productId,
    imageUrl = resolveImage(product?.image, origin),
)

internal fun ReorderTemplateDto.toDomain(origin: String): ReorderTemplate = ReorderTemplate(
    id = id,
    name = name,
    items = items.map { it.toDomain(origin) },
)

internal fun RefundDto.toDomain(): RefundRequest = RefundRequest(
    id = id,
    ref = ref,
    orderRef = orderRef,
    reason = reason,
    notes = notes,
    status = status,
    createdAtIso = createdAt,
)
