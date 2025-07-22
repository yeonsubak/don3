package com.don3.sync.domain.sync.message

import com.don3.sync.domain.sync.message.enums.EventType
import java.time.Instant

data class Event<DTO>(
    val timestamp: Instant,
    val correlationId: String?,
    val type: EventType,
    val data: DTO
) {
    companion object {
        fun <T> create(type: EventType, data: T, correlationId: String?) = Event(
            timestamp = Instant.now(),
            correlationId = correlationId,
            type = type,
            data = data
        )
    }
}