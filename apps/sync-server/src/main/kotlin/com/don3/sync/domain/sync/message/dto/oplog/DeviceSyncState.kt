package com.don3.sync.domain.sync.message.dto.oplog

data class DeviceSyncState(
    val deviceId: String,
    val seq: Long
)