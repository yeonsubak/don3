package com.don3.sync.domain.sync.dto

import java.math.BigInteger
import java.time.Instant
import java.util.*

data class InsertLogResponse(
    val id: UUID,
    val userId: UUID,
    val deviceId: UUID,
    val sequence: BigInteger,
    val method: String,
    val methodHash: String,
    val opData: String,
    val createdAt: Instant,
    val updatedAt: Instant
)
