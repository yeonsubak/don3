package com.don3.sync.controller

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.message.Document
import com.don3.sync.domain.sync.message.Message
import com.don3.sync.domain.sync.message.Query
import com.don3.sync.domain.sync.message.dto.oplog.DeviceSyncState
import com.don3.sync.domain.sync.message.dto.oplog.OpLogChunkDTO
import com.don3.sync.domain.sync.message.dto.snapshot.RefreshSnapshotRequiredDTO
import com.don3.sync.domain.sync.message.dto.snapshot.SnapshotDTO
import com.don3.sync.domain.sync.message.dto.snapshot.SnapshotChecksumDTO
import com.don3.sync.domain.sync.message.enums.DocumentType
import com.don3.sync.domain.sync.message.enums.MessageType
import com.don3.sync.service.SyncService
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.time.Instant

@RestController
@RequestMapping("/api/v1/sync")
class SyncController(
    private val syncService: SyncService
) {
    @GetMapping("/snapshots/latest")
    fun getLatestSnapshot(@AuthenticationPrincipal user: User): ResponseEntity<out Message<out Document<SnapshotDTO>?>> {
        val snapshot = syncService.getLatestSnapshot(user)?.toDocument()
        if (snapshot == null) {
            return Message.createEmpty(MessageType.DOCUMENT).toApiResponse(HttpStatus.NOT_FOUND)
        }

        return Message.create(null, MessageType.DOCUMENT, snapshot).toApiResponse(HttpStatus.OK)
    }

    @GetMapping("/snapshots/latest/checksum")
    fun getLatestSnapshotChecksum(@AuthenticationPrincipal user: User): ResponseEntity<out Message<out Document<SnapshotChecksumDTO>?>> {
        val checksum = syncService.getLatestSnapshotChecksum(user)
        if (checksum == null) {
            return Message.createEmpty(MessageType.DOCUMENT).toApiResponse(HttpStatus.NOT_FOUND)
        }

        val body = Document(
            type = DocumentType.SNAPSHOT,
            timestamp = Instant.now(),
            correlationId = null,
            data = SnapshotChecksumDTO(checksum)
        )

        return Message.create(null, MessageType.DOCUMENT, body).toApiResponse(HttpStatus.OK)
    }

    @GetMapping("/snapshots/refresh-required")
    fun refreshSnapshotRequired(@AuthenticationPrincipal user: User): ResponseEntity<Message<Document<RefreshSnapshotRequiredDTO>>> {
        val isRequired = syncService.requireNewSnapshot(user)
        val dto = RefreshSnapshotRequiredDTO(isRequired)
        val body = Document(
            type = DocumentType.REFRESH_SNAPSHOT_REQUIRED,
            timestamp = Instant.now(),
            correlationId = null,
            data = dto
        )
        return Message.create(null, MessageType.DOCUMENT, body).toApiResponse(HttpStatus.OK)
    }

    @GetMapping("/opLogs")
    fun getOpLogsAfterDate(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        date: Instant,
        @AuthenticationPrincipal user: User
    ): ResponseEntity<Message<Document<List<OpLogChunkDTO>>>> {
        val opLogs = syncService.getOpLogsAfterDate(date, user)
        return Message.create(null, MessageType.DOCUMENT, opLogs).toApiResponse(HttpStatus.OK)
    }

    @PostMapping("/opLogs/query")
    fun getSavedOpLogsAfterSequences(
        @RequestBody request: Message<Query<List<DeviceSyncState>>>,
        @AuthenticationPrincipal user: User
    ): ResponseEntity<Message<Document<List<OpLogChunkDTO>>>> {
        val opLogs = syncService.getAllOpLogsByDeviceIdsAndGreaterThanSequence(request, user)
        return Message.create(null, MessageType.DOCUMENT, opLogs).toApiResponse(HttpStatus.OK)
    }
}