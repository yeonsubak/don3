package com.don3.sync.domain.sync.message

import com.don3.sync.domain.sync.message.enums.EventType
import java.time.Instant
import java.util.UUID

data class Event<DTO>(
    val eventId: UUID,
    val timestamp: Instant,
    val correlationId: UUID?,
    val type: EventType,
    val data: DTO
)