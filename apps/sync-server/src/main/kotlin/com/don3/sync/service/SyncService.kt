package com.don3.sync.service

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.dto.GetSnapshotResponse
import com.don3.sync.domain.sync.dto.InsertOpLogRequest
import com.don3.sync.domain.sync.dto.InsertSnapshotRequest
import com.don3.sync.domain.sync.dto.OpLogResponse
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
    private val snapshotRepository: SnapshotRepository,
    private val opLogRepository: OpLogRepository
) {
    companion object {
        private val logger: Logger = LoggerFactory.getLogger(SyncService::class.java)
    }

    fun getLatestSnapshot(user: User): GetSnapshotResponse? {
        val snapshot = snapshotRepository.findFirstByUserEqualsOrderByCreateAtDesc(user)

        if (snapshot == null) {
            return null
        }

        return GetSnapshotResponse(
            userId = snapshot.user?.id,
            deviceId = snapshot.deviceId,
            localId = snapshot.localId,
            schemaVersion = snapshot.schemaVersion,
            dump = snapshot.dump,
            iv = snapshot.iv,
            meta = snapshot.meta,
            createAt = snapshot.createAt,
            updateAt = snapshot.updateAt
        )
    }

    fun insertSnapshot(request: InsertSnapshotRequest, user: User): Snapshot {
        val snapshot = Snapshot().apply {
            this.id = UUID.randomUUID()
            this.user = user
            this.deviceId = UUID.fromString(request.deviceId)
            this.localId = UUID.fromString(request.localId)
            this.schemaVersion = request.schemaVersion
            this.dump = request.dump
            this.iv = request.iv
            this.meta = request.meta
        }
        return this.snapshotRepository.save<Snapshot>(snapshot)
    }

    fun getOpLogsAfterDate(date: Instant, user: User): List<OpLogResponse> {
        val opLogs = this.opLogRepository.findAllByUserAndCreateAtAfterOrderBySequence(user, date)
        return opLogs.map {
            OpLogResponse(
                id = it.id,
                userId = it.user?.id,
                deviceId = it.deviceId,
                localId = it.localId,
                version = it.version,
                schemaVersion = it.schemaVersion,
                sequence = it.sequence?.toBigInteger(),
                iv = it.iv,
                data = it.data,
                createAt = it.createAt,
                updateAt = it.updateAt
            )
        }
    }

    fun getOpLogByDeviceIdAndSeq(deviceId: UUID, seq: Long): OpLog {
        return this.opLogRepository.findOpLogByDeviceIdAndSequence(deviceId, seq)
    }

    fun insertOpLog(request: InsertOpLogRequest, user: User): OpLogResponse {
        val localId = UUID.fromString(request.localId)
        val opLog = OpLog().apply {
            this.id = UUID.randomUUID()
            this.user = user
            this.deviceId = UUID.fromString(request.deviceId)
            this.localId = UUID.fromString(request.localId)
            this.version = request.version
            this.schemaVersion = request.schemaVersion
            this.sequence = request.sequence.toLong()
            this.data = request.data
            this.iv = request.iv
        }

        var opLogRes: OpLog
        try {
            opLogRes = this.opLogRepository.save<OpLog>(opLog)
        } catch (e: DataIntegrityViolationException) {
            logger.warn("DataIntegrityViolationException: possibly attempting to insert a duplicated entry. ${e.message}")
            opLogRes = this.opLogRepository.findOpLogByLocalId(localId)!!
        }

        return OpLogResponse(
            id = opLogRes.id,
            userId = opLogRes.user?.id,
            deviceId = opLogRes.deviceId,
            localId = opLogRes.localId,
            version = opLogRes.version,
            schemaVersion = opLogRes.schemaVersion,
            sequence = opLogRes.sequence?.toBigInteger(),
            data = opLogRes.data,
            iv = opLogRes.iv,
            createAt = opLogRes.createAt,
            updateAt = opLogRes.updateAt
        )
    }
}