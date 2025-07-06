package com.don3.sync.domain.sync.dto

import com.don3.sync.domain.sync.enums.WebSocketRequestType

data class WebSocketRequest<T>(
    val requestId: String,
    val type: WebSocketRequestType,
    val payload: T?
)
