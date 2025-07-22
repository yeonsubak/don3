package com.don3.sync.domain.sync.message

data class RequestInfo(
    val requestId: String,
    val userId: String,
    val deviceId: String
)
