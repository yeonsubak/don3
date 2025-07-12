package com.don3.sync.domain.sync.message.dto

import java.util.UUID

data class DeviceSyncState(
    val deviceId: UUID,
    val seq: Long
)
