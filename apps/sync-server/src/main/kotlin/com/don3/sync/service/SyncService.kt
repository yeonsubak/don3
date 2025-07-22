package com.don3.sync.service

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.entity.OpLog
import com.don3.sync.domain.sync.entity.Snapshot
import com.don3.sync.domain.sync.message.*
import com.don3.sync.domain.sync.message.dto.oplog.DeviceSyncState
import com.don3.sync.domain.sync.message.dto.oplog.OpLogChunkDTO
import com.don3.sync.domain.sync.message.dto.snapshot.SnapshotDTO
import com.don3.sync.domain.sync.message.enums.DocumentType
import com.don3.sync.domain.sync.message.enums.EventType
import com.don3.sync.domain.sync.repository.OpLogRepository
import com.don3.sync.domain.sync.repository.SnapshotRepository
import com.don3.sync.exception.DuplicateEntityExistException
import com.don3.sync.exception.ValueNotFoundException
import jakarta.persistence.EntityNotFoundException
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.support.TransactionTemplate
import java.time.Instant
import java.util.UUID

@Service
class SyncService(
    private val snapshotRepository: SnapshotRepository,
    private val opLogRepository: OpLogRepository,
    platformTransactionManager: PlatformTransactionManager
) {
    private val newTxTemplate: TransactionTemplate = TransactionTemplate(platformTransactionManager).apply {
        propagationBehavior = PROPAGATION_REQUIRES_NEW
    }

    fun getLatestSnapshot(user: User): Snapshot? {
        return snapshotRepository.findFirstByUserEqualsOrderByCreateAtDesc(user)
    }

    fun getLatestSnapshotChecksum(user: User): String? {
        return snapshotRepository.findChecksumByUserId(user.id)
    }

    @Transactional
    fun insertSnapshot(request: Message<Command<SnapshotDTO>>, user: User): Event<SnapshotDTO> {
        val snapshotInsert = Snapshot.fromDTO(request.body.data, user)

        try {
            val createdSnapshot = snapshotRepository.save<Snapshot>(snapshotInsert)

            // Clean previous snapshot and opLogs
            snapshotRepository.clearSnapshots(user.id, createdSnapshot.checksum)
            opLogRepository.clearOpLogs(user.id)

            return createdSnapshot.toEvent(true, request.requestInfo?.requestId)
        } catch (e: DataIntegrityViolationException) {
            throw DuplicateEntityExistException("Snapshot", e)
        }
    }

    fun findExistingSnapshot(request: Message<Command<SnapshotDTO>>, user: User): Event<SnapshotDTO> {
        val checksum = request.body.data.checksum

        val storedSnapshot = newTxTemplate.execute { transactionStatus ->
            snapshotRepository.findFirstByUserAndChecksum(user, checksum)
        }

        if (storedSnapshot == null) {
            throw EntityNotFoundException("Expected Snapshot (checksum=$checksum) to exist after duplicate insertion attempt, but it was not found.${user.id}, checksum=${checksum})")
        }

        return storedSnapshot.toEvent(true, request.requestInfo?.requestId)
    }

    fun getOpLogsAfterDate(date: Instant, user: User): Document<List<OpLogChunkDTO>> {
        val opLogs = opLogRepository.findAllByUserAndCreateAtAfter(user, date)
        val chunks = OpLogChunkDTO.groupOpLog(opLogs)
        return Document.create(DocumentType.OP_LOG, chunks)
    }

    fun getAllOpLogsByDeviceIdsAndGreaterThanSequence(
        request: Message<Query<List<DeviceSyncState>>>,
        user: User,
    ): Document<List<OpLogChunkDTO>> {
        val (requestInfo, body) = request
        if (requestInfo == null) {
            throw ValueNotFoundException("requestInfo")
        }

        // Get OpLogs based on the request
        val logs = body.parameters.flatMap {
            opLogRepository.findAllByUserAndDeviceIdAndSequenceGreaterThan(
                user, UUID.fromString(it.deviceId), it.seq
            )
        }

        // Get OpLogs of omitted deviceIds in the request
        val excludingDeviceIds = body.parameters.map { UUID.fromString(it.deviceId) }.toMutableList()
        // Add request's deviceId for exclusion
        excludingDeviceIds.add(UUID.fromString(requestInfo.deviceId))
        val omittedLogs = opLogRepository.findAllByUserAndDeviceIdNotIn(user, excludingDeviceIds.toList())
        val chunks = OpLogChunkDTO.groupOpLog(logs + omittedLogs)

        return Document.create(DocumentType.OP_LOG, chunks, requestInfo.requestId)
    }

    @Transactional
    fun insertOpLogs(request: Message<Command<OpLogChunkDTO>>, user: User): Event<List<OpLogChunkDTO>> {
        val insertedOpLogs: MutableList<OpLog> = mutableListOf()
        val chunk = request.body.data

        chunk.opLogs.forEach {
            val entity = OpLog.fromDTO(it, user)

            val createdOpLog = try {
                opLogRepository.save<OpLog>(entity)
            } catch (e: DataIntegrityViolationException) {
                throw DuplicateEntityExistException("OpLog", e)
            }

            insertedOpLogs.add(createdOpLog)
        }

        val eventData = OpLogChunkDTO.groupOpLog(insertedOpLogs)

        return Event.create(EventType.OP_LOG_CREATED, eventData, chunk.chunkId)
    }

    fun findExistingOpLogs(request: Message<Command<OpLogChunkDTO>>, user: User): Event<List<OpLogChunkDTO>> {
        val chunkId = request.body.data.chunkId
        val storedOpLogs = newTxTemplate.execute { transactionStatus ->
            opLogRepository.findAllByUserAndChunkId(user, UUID.fromString(chunkId))
        }

        if (storedOpLogs == null) {
            throw EntityNotFoundException("Expected OpLog chunk (chunkId=$chunkId) to exist after duplicate insertion attempt, but it was not found.")
        }

        val eventData = OpLogChunkDTO.groupOpLog(storedOpLogs)

        return Event.create(EventType.OP_LOG_CREATED, eventData, chunkId)
    }


    fun requireNewSnapshot(user: User): Boolean {
        val maxSeq = this.opLogRepository.countOpLogsByUserId(user.id)
        return maxSeq > 500L
    }
}