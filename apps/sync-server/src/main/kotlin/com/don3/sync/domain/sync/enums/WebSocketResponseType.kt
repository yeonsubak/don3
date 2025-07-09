package com.don3.sync.domain.sync.enums

import com.fasterxml.jackson.annotation.JsonValue

enum class WebSocketResponseType(private val value: String) {
    ERROR("error"),
    GET_SNAPSHOT("getSnapshot"),
    SNAPSHOT_INSERTED("snapshotInserted"),
    OP_LOG_INSERTED("opLogInserted"),
    GET_OP_LOGS("getOpLogsResponse");

    @JsonValue
    fun toValue(): String {
        return value
    }
}