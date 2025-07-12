package com.don3.sync.domain.sync.message.enums

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue

enum class EventType(@get:JsonValue val value: String) {
    SNAPSHOT_CREATED("snapshotCreated"),
    OP_LOG_CREATED("opLogCreated");

    companion object {
        @JvmStatic
        @JsonCreator
        fun fromValue(value: String): EventType {
            return EventType.entries.firstOrNull { it.value == value }
                ?: throw IllegalArgumentException("Unknown EventType: $value")
        }
    }
}