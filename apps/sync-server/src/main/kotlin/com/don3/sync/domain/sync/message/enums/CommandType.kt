package com.don3.sync.domain.sync.message.enums

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue

enum class CommandType(@get:JsonValue val value: String) {
    CREATE_SNAPSHOT("createSnapshot"),
    CREATE_OP_LOG("createOpLog");

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): CommandType {
            return CommandType.entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown CommandType: $value")
        }
    }
}