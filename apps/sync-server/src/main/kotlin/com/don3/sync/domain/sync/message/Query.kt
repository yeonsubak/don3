package com.don3.sync.domain.sync.message

import com.don3.sync.domain.sync.message.enums.QueryType
import java.time.Instant
import java.util.UUID

data class Query<Parameter>(
    val queryId: UUID,
    val timestamp: Instant,
    val type: QueryType,
    val parameters: Parameter
)
