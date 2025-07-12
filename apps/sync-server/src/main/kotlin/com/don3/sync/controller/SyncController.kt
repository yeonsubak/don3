package com.don3.sync.controller

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.message.Document
import com.don3.sync.domain.sync.message.Message
import com.don3.sync.domain.sync.message.dto.OpLogDTO
import com.don3.sync.domain.sync.message.dto.SnapshotDTO
import com.don3.sync.domain.sync.message.enums.MessageType
import com.don3.sync.service.SyncService
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
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

    @GetMapping("/opLogs")
    fun getOpLogsAfterDate(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        date: Instant,
        @AuthenticationPrincipal user: User
    ): ResponseEntity<Message<List<Document<OpLogDTO>>>> {
        val opLogs = syncService.getOpLogsAfterDate(date, user)
        return Message.create(null, MessageType.DOCUMENT, opLogs).toApiResponse(HttpStatus.OK)
    }
}