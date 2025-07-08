package com.don3.sync.domain.sync.dto

import com.don3.sync.domain.sync.enums.WebSocketResponseType

data class WebSocketResponse<P>(
    val requestId: String,
    val userId: String,
    val deviceId: String,
    val type: WebSocketResponseType,
    val payload: P?,
    val message: String?
)
