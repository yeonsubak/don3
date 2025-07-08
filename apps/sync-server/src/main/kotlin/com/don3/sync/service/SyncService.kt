package com.don3.sync.service

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.dto.*
import com.don3.sync.domain.sync.entity.OpLog
import com.don3.sync.domain.sync.entity.Snapshot
import com.don3.sync.domain.sync.repository.OpLogRepository
import com.don3.sync.domain.sync.repository.SnapshotRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.*

@Service
class SyncService(
    private val snapshotRepository: SnapshotRepository, private val opLogRepository: OpLogRepository
) {
    companion object {
        private val logger: Logger = LoggerFactory.getLogger(SyncService::class.java)
    }

    fun getLatestSnapshot(user: User): Snapshot? {
        val snapshot = snapshotRepository.findFirstByUserEqualsOrderByCreateAtDesc(user)

        if (snapshot == null) {
            return null
        }

        return snapshot
    }

    fun insertSnapshot(request: WebSocketRequest<InsertSnapshotRequest>, user: User): Snapshot? {
        val snapshot = Snapshot.fromRequest(request, user)
        try {
            return this.snapshotRepository.save<Snapshot>(snapshot)
        } catch (e: DataIntegrityViolationException) {
            logger.warn("DataIntegrityViolationException: possibly attempting to insert a duplicated Snapshot entity. ${e.message}")
            return snapshot
        }
    }

    fun getOpLogsAfterDate(date: Instant, user: User): List<OpLogResponse> {
        val opLogs = this.opLogRepository.findAllByUserAndCreateAtAfter(user, date)
        val sorted = this.sortOpLogsByDeviceIdAndSeq(opLogs)
        return sorted.map {
            it.toResponse()
        }
    }

    fun getAllOpLogsByDeviceIdsAndGreaterThanSequence(list: List<DeviceIdAndSeq>, user: User): List<OpLogResponse> {
        val logs = list.fold(mutableListOf<OpLog>()) { acc, cur ->
            val opLogs = this.opLogRepository.findAllByUserAndDeviceIdAndSequenceGreaterThan(
                user, UUID.fromString(cur.deviceId), cur.seq.toLong()
            )
            acc.addAll(opLogs)
            acc
        }

        return logs.map { it.toResponse() }.sortedBy { it.createAt }
    }

    fun insertOpLog(request: WebSocketRequest<InsertOpLogRequest>, user: User): OpLog {
        val opLog = OpLog.fromRequest(request, user)
        try {
            return this.opLogRepository.save<OpLog>(opLog)
        } catch (e: DataIntegrityViolationException) {
            logger.warn("DataIntegrityViolationException: possibly attempting to insert a duplicated OpLog entity. ${e.message}")
            if (request.payload == null) throw IllegalArgumentException("Payload not found.")
            return this.opLogRepository.findByUserAndDeviceIdAndSequence(
                user,
                UUID.fromString(request.deviceId),
                request.payload.sequence.toLong()
            )
        }
    }

    private fun sortOpLogsByDeviceIdAndSeq(opLogs: List<OpLog>): List<OpLog> {
        val deviceIdSet = opLogs.map { it.deviceId }.toMutableSet()
        val deviceIdEarliestOplog: MutableList<Pair<UUID, OpLog>> = mutableListOf()

        opLogs.sortedBy { it.sequence }.forEach {
            if (deviceIdSet.contains(it.deviceId)) {
                deviceIdEarliestOplog.add(Pair(it.deviceId, it))
                deviceIdSet.remove(it.deviceId)
            }
        }

        val deviceIdOrder = deviceIdEarliestOplog.sortedBy { it.second.createAt }.map { it.first }

        return opLogs.sortedWith(compareBy<OpLog> { deviceIdOrder.indexOf(it.deviceId) }.thenBy { it.sequence })
    }
}