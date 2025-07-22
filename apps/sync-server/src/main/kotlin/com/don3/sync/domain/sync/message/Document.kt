package com.don3.sync.domain.sync.message

import com.don3.sync.domain.sync.message.enums.DocumentType
import java.time.Instant

data class Document<DTO>(
    val type: DocumentType,
    val timestamp: Instant,
    val correlationId: String?,
    val data: DTO
) {
    companion object {
        fun <T> create(type: DocumentType, data: T, correlationId: String?) = Document(
            type = type,
            timestamp = Instant.now(),
            correlationId = correlationId,
            data = data
        )

        fun <T> create(type: DocumentType, data: T) = Document(
            type = type,
            timestamp = Instant.now(),
            data = data,
            correlationId = null,
        )
    }
}
