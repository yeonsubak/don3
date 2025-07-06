package com.don3.sync.domain.sync.dto

import com.don3.sync.domain.sync.enums.WebSocketResponseType

data class WebSocketResponse<T>(
    val requestId: String,
    val type: WebSocketResponseType,
    val payload: T?,
    val message: String?
)
