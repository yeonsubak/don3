package com.don3.sync.domain.sync.message.dto.snapshot

import java.time.Instant

data class SnapshotDTO(
    val schemaVersion: String,
    val iv: String,
    val meta: String,
    val dump: String?,
    val checksum: String,
    val createAt: Instant?
)