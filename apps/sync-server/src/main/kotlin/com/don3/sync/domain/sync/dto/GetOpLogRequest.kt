package com.don3.sync.domain.sync.dto

import java.math.BigInteger

data class DeviceIdAndSeq(
    val deviceId: String,
    val seq: BigInteger
)

data class GetOpLogRequest(
    val deviceIdAndSeq: List<DeviceIdAndSeq>
)