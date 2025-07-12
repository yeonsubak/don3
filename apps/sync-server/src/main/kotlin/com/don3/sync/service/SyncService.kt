package com.don3.sync.service

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.entity.OpLog
import com.don3.sync.domain.sync.entity.Snapshot
import com.don3.sync.domain.sync.message.*
import com.don3.sync.domain.sync.message.dto.DeviceSyncState
import com.don3.sync.domain.sync.message.dto.OpLogDTO
import com.don3.sync.domain.sync.message.dto.SnapshotDTO
import com.don3.sync.domain.sync.repository.OpLogRepository
import com.don3.sync.domain.sync.repository.SnapshotRepository
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class SyncService(
    private val snapshotRepository: SnapshotRepository, private val opLogRepository: OpLogRepository
) {
    companion object {
        private val logger: Logger = LoggerFactory.getLogger(SyncService::class.java)
    }

    fun getLatestSnapshot(user: User): Snapshot? {
        val snapshot = snapshotRepository.findFirstByUserEqualsOrderByCreateAtDesc(user)
        return snapshot
    }

    fun insertSnapshot(request: Message<Command<SnapshotDTO>>, user: User): Event<SnapshotDTO> {
        val snapshot = Snapshot.fromMessage(request, user)
        try {
            val createdSnapshot = this.snapshotRepository.save<Snapshot>(snapshot)
            return createdSnapshot.toEvent(true, request.requestInfo?.requestId)
        } catch (e: DataIntegrityViolationException) {
            logger.warn("DataIntegrityViolationException: possibly attempting to insert a duplicated Snapshot entity. ${e.message}")
            val storedSnapshot = this.snapshotRepository.findFirstByUserAndLocalId(user, snapshot.localId)
                ?: throw IllegalStateException("DataIntegrityViolationException triggered but the matched snapshot does not exist in the DB. (user.id=${user.id}, snapshot.localId=${snapshot.localId})")
            return storedSnapshot.toEvent(true, request.requestInfo?.requestId)
        }
    }

    fun getOpLogsAfterDate(date: Instant, user: User): List<Document<OpLogDTO>> {
        val opLogs = this.opLogRepository.findAllByUserAndCreateAtAfter(user, date)
        val sorted = this.sortOpLogsByDeviceIdAndSeq(opLogs)
        return sorted.map {
            it.toDocument()
        }
    }

    fun getAllOpLogsByDeviceIdsAndGreaterThanSequence(
        request: Message<Query<List<DeviceSyncState>>>,
        user: User,
    ): List<Document<OpLogDTO>> {
        val (requestInfo, body) = request
        if (requestInfo == null) {
            throw IllegalArgumentException("RequestInfo is null.")
        }

        // Get OpLogs based on the request
        val logs = body.parameters.flatMap {
            this.opLogRepository.findAllByUserAndDeviceIdAndSequenceGreaterThan(
                user, it.deviceId, it.seq
            )
        }

        // Get OpLogs of omitted deviceIds in the request
        val excludingDeviceIds = body.parameters.map { it.deviceId }.toMutableList()
        // Add request's deviceId for exclusion
        excludingDeviceIds.add(requestInfo.deviceId)
        val omittedLogs = this.opLogRepository.findAllByUserAndDeviceIdNotIn(user, excludingDeviceIds)

        return (logs + omittedLogs).map {
            it.toDocument(requestInfo.requestId)
        }
    }

    fun insertOpLog(request: Message<Command<OpLogDTO>>, user: User): Event<OpLogDTO> {
        val opLog = OpLog.fromMessage(request, user)
        try {
            val createResult = this.opLogRepository.save<OpLog>(opLog)
            return createResult.toEvent(request.requestInfo?.requestId)
        } catch (e: DataIntegrityViolationException) {
            logger.warn("DataIntegrityViolationException: possibly attempting to insert a duplicated OpLog entity. ${e.message}")
            val storedOpLog = this.opLogRepository.findByUserAndDeviceIdAndSequence(
                user,
                request.requestInfo?.deviceId!!,
                request.body.data.sequence
            )
            return storedOpLog.toEvent(request.requestInfo.requestId)
        }
    }

    private fun sortOpLogsByDeviceIdAndSeq(opLogs: List<OpLog>): List<OpLog> {
        val deviceIdOrder = opLogs.distinctBy { it.deviceId }.sortedBy { it.createAt }.map { it.deviceId }
        return opLogs.sortedWith(compareBy<OpLog> { deviceIdOrder.indexOf(it.deviceId) }.thenBy { it.sequence })
    }
}