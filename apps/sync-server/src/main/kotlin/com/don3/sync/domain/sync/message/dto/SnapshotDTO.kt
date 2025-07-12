package com.don3.sync.domain.sync.message.dto

import java.time.Instant
import java.util.UUID

data class SnapshotDTO(
    val localId: UUID,
    val schemaVersion: String,
    val iv: String,
    val meta: String,
    val dump: String?,
    val sequence: Long?,
    val createAt: Instant
)