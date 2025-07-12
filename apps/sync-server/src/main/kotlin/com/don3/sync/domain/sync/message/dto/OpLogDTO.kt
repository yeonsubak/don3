package com.don3.sync.domain.sync.message.dto

import java.util.UUID

data class OpLogDTO(
    val deviceId: UUID,
    val localId: UUID,
    val version: String,
    val schemaVersion: String,
    val sequence: Long,
    val iv: String,
    val data: String,
    val queryKeys: List<String>,
)