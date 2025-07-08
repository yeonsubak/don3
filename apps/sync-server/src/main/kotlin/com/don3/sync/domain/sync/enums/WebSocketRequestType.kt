package com.don3.sync.domain.sync.enums

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue

enum class WebSocketRequestType(@get:JsonValue val value: String) {
    INIT("init"),
    CLOSE("close"),
    GET_LATEST_SNAPSHOT("getLatestSnapshot"),
    INSERT_SNAPSHOT("insertSnapshot"),
    INSERT_OP_LOG("insertOpLog");

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): WebSocketRequestType {
            return entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown WebSocketRequestType: $value")
        }
    }
}