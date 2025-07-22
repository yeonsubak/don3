package com.don3.sync.domain.sync.message.dto.oplog

import com.don3.sync.domain.sync.entity.OpLog

data class OpLogChunkDTO(
    val chunkId: String,
    val opLogs: List<OpLogDTO>
) {
    companion object {
        fun groupOpLogDTOs(opLogs: List<OpLogDTO>): List<OpLogChunkDTO> {
            return opLogs
                .groupBy { it.chunkId }
                .map { (chunkId, opLogs) -> OpLogChunkDTO(chunkId, opLogs) }
        }

        fun groupOpLog(opLogs: List<OpLog>): List<OpLogChunkDTO> {
            val sorted = opLogs.sortedWith(opLogSorter(opLogs))
            val dto = sorted.map { it.toDTO() }
            return groupOpLogDTOs(dto)
        }

        fun opLogSorter(opLogs: List<OpLog>): Comparator<OpLog> {
            val chunkIdOrder = opLogs
                .sortedBy { it.createAt }
                .map { it.chunkId }
                .distinct()
                .withIndex()
                .associate { it.value to it.index }

            return compareBy<OpLog> {
                chunkIdOrder[it.chunkId] ?: Int.MAX_VALUE
            }.thenBy { it.sequence }
        }
    }
}
