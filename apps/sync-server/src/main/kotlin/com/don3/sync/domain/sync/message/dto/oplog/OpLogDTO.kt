package com.don3.sync.domain.sync.message.dto.oplog

data class OpLogDTO(
    val localId: String?,
    val deviceId: String,
    val chunkId: String,
    val version: String,
    val schemaVersion: String,
    val sequence: Long,
    val iv: String,
    val data: String,
    val queryKeys: List<String>,
)