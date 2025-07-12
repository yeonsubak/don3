package com.don3.sync.domain.sync.message

import com.don3.sync.domain.sync.message.enums.DocumentType
import java.time.Instant
import java.util.UUID

data class Document<DTO>(
    val type: DocumentType,
    val timestamp: Instant,
    val correlationId: UUID?,
    val data: DTO
)
