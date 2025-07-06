package com.don3.sync.domain.sync.dto

import java.math.BigInteger
import java.time.Instant
import java.util.*

data class OpLogResponse(
    val id: UUID?,
    val userId: String?,
    val deviceId: UUID?,
    val localId: UUID?,
    val version: String?,
    val schemaVersion: String?,
    val sequence: BigInteger?,
    val iv: String?,
    val data: String?,
    val createAt: Instant?,
    val updateAt: Instant?
)
