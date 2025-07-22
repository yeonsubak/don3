package com.don3.sync.domain.sync.message

import com.don3.sync.domain.sync.message.enums.QueryType
import java.time.Instant

data class Query<Parameter>(
    val timestamp: Instant,
    val type: QueryType,
    val parameters: Parameter
)
