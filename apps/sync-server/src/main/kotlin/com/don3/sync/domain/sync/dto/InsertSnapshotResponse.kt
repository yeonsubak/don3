package com.don3.sync.domain.sync.dto

import java.time.Instant
import java.util.UUID

data class InsertSnapshotResponse(
    val id: UUID,
    val userId: UUID,
    val deviceId: UUID,
    val dump: String,
    val createdAt: Instant,
    val updatedAt: Instant
)