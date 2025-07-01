package com.don3.sync.domain.sync.dto

import java.time.Instant

data class GetSnapshotResponse(
    val userId: String?,
    val deviceId: String?,
    val schemaVersion: String?,
    val dump: String?,
    val meta: String?,
    val iv: String?,
    val createAt: Instant?,
    val updateAt: Instant?
)