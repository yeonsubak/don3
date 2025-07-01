package com.don3.sync.domain.sync.dto

import java.math.BigInteger

data class InsertLogRequest(
    val userId: String,
    val deviceId: String,
    val sequence: BigInteger,
    val method: String,
    val methodHash: String,
    val opData: String,
    val iv: String
)