package com.don3.sync.domain.sync.message

import com.don3.sync.domain.sync.message.enums.CommandType
import java.time.Instant
import java.util.UUID

data class Command<DTO>(
    val commandId: UUID,
    val timestamp: Instant,
    val correlationId: UUID?,
    val type: CommandType,
    val data: DTO
)
