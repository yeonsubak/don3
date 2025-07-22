package com.don3.sync.domain.sync.message.enums

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue

enum class QueryType(@get:JsonValue val value: String) {
    GET_LATEST_SNAPSHOT("getLatestSnapshot"),
    GET_OP_LOGS("getOpLogs");

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): QueryType {
            return QueryType.entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown QueryType: $value")
        }
    }
}
