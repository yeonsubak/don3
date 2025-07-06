package com.don3.sync.domain.sync.enums

enum class WebSocketResponseType(val value: String) {
    ERROR("error"),
    GET_OP_LOG("getOpLog"),
    GET_SNAPSHOT("getSnapshot"),
    SNAPSHOT_INSERTED("snapshotInserted"),
    OP_LOG_INSERTED("opLogInserted"),
    SEND_MSG_TO_SERVER("sendMsgToServer");
}