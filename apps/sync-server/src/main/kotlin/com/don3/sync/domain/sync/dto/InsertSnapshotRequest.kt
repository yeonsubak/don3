package com.don3.sync.domain.sync.dto

import com.fasterxml.jackson.annotation.JsonProperty

data class InsertSnapshotRequest(
    @JsonProperty("localId") val localId: String,
    @JsonProperty("schemaVersion") val schemaVersion: String,
    @JsonProperty("dump") val dump: String,
    @JsonProperty("meta") val meta: String,
    @JsonProperty("iv") val iv: String,
)
