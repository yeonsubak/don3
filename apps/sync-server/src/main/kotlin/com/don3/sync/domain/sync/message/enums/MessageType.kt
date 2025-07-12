package com.don3.sync.domain.sync.message.enums

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue

enum class MessageType(@get:JsonValue val value: String) {
    COMMAND("command"),
    EVENT("event"),
    QUERY("query"),
    DOCUMENT("document"),
    ERROR("error"),
    INTERNAL("internal");


    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): MessageType {
            return MessageType.entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown MessageType: $value")
        }
    }
}
