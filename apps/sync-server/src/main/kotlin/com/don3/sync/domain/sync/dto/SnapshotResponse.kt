package com.don3.sync.domain.sync.dto

import java.time.Instant
import java.util.UUID

data class SnapshotResponse(
    val localId: UUID,
    val schemaVersion: String,
    val iv: String,
    val meta: String,
    val dump: String,
    val createAt: Instant,
    val updateAt: Instant?
)