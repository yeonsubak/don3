package com.don3.sync.domain.sync.dto

import java.math.BigInteger

data class InsertOpLogRequest(
    val localId: String,
    val version: String,
    val schemaVersion: String,
    val sequence: BigInteger,
    val iv: String,
    val data: String,
    val queryKeys: List<String>
)