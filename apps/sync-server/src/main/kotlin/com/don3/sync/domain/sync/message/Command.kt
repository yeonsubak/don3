package com.don3.sync.domain.sync.message

import com.don3.sync.domain.sync.message.enums.CommandType
import java.time.Instant

data class Command<DTO>(
    val timestamp: Instant,
    val correlationId: String?,
    val type: CommandType,
    val data: DTO
)
