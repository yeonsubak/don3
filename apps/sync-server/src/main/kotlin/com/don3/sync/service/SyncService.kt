package com.don3.sync.service

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.dto.GetSnapshotResponse
import com.don3.sync.domain.sync.dto.InsertSnapshotRequest
import com.don3.sync.domain.sync.entity.Snapshot
import com.don3.sync.domain.sync.repository.SnapshotRepository
import org.springframework.http.HttpStatus
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.util.*

@Service
class SyncService(
    private val snapshotRepository: SnapshotRepository, private val messagingTemplate: SimpMessagingTemplate
) {
    fun getLatestSnapshot(user: User): GetSnapshotResponse {
        val snapshot =
            snapshotRepository.findFirstByUserEqualsOrderByCreatedAtDesc(user) ?: throw ResponseStatusException(
                HttpStatus.NOT_FOUND, "No snapshot found for user ${user.id}"
            )

        return GetSnapshotResponse(
            userId = snapshot.user?.id,
            deviceId = snapshot.deviceId.toString(),
            schemaVersion = snapshot.schemaVersion,
            dump = snapshot.dump,
            iv = snapshot.iv,
            meta = snapshot.meta,
            createAt = snapshot.createdAt,
            updateAt = snapshot.updatedAt
        )
    }

    fun insertSnapshot(request: InsertSnapshotRequest, user: User): Snapshot {
        val snapshot = Snapshot().apply {
            this.id = UUID.randomUUID()
            this.user = user
            this.schemaVersion = request.schemaVersion
            this.deviceId = UUID.fromString(request.deviceId)
            this.dump = request.dump
            this.iv = request.iv
            this.meta = request.meta
        }
        return snapshotRepository.save<Snapshot>(snapshot)
    }
}