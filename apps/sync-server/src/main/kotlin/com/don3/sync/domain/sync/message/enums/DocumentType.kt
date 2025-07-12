package com.don3.sync.domain.sync.message.enums

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue

enum class DocumentType(@get:JsonValue val value: String) {
    SNAPSHOT("snapshot"),
    OP_LOG("opLog");

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): DocumentType {
            return DocumentType.entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown DocumentType: $value")
        }
    }
}