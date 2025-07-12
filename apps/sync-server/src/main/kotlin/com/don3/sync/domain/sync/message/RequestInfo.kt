package com.don3.sync.domain.sync.message

import java.util.UUID

data class RequestInfo(
    val requestId: UUID,
    val userId: String,
    val deviceId: UUID
)
