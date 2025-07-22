package com.don3.sync.controller

import com.don3.sync.domain.sync.message.*
import com.don3.sync.domain.sync.message.dto.oplog.DeviceSyncState
import com.don3.sync.domain.sync.message.dto.oplog.OpLogChunkDTO
import com.don3.sync.domain.sync.message.dto.snapshot.SnapshotDTO
import com.don3.sync.domain.sync.message.enums.MessageType
import com.don3.sync.exception.DuplicateEntityExistException
import com.don3.sync.service.AuthenticationService
import com.don3.sync.service.SyncService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.annotation.SendToUser
import org.springframework.stereotype.Controller
import java.security.Principal

@Controller
@MessageMapping("/sync")
class SyncWebSocketController(
    private val syncService: SyncService,
    private val authenticationService: AuthenticationService
) {

    companion object {
        private val logger: Logger = LoggerFactory.getLogger(SyncWebSocketController::class.java)
    }

    @MessageMapping("/snapshot/latest")
    @SendToUser("/queue/snapshot/latest")
    fun getLatestSnapshot(
        @Payload request: Message<Query<Nothing>>,
        principal: Principal,
    ): Message<Document<SnapshotDTO>?> {
        val user = authenticationService.findUserByPrincipal(principal)
        val snapshot = syncService.getLatestSnapshot(user)
        val requestInfo = request.requestInfo
        return Message.create(requestInfo, MessageType.DOCUMENT, snapshot?.toDocument(requestInfo?.requestId))
    }

    @MessageMapping("/snapshot/insert")
    @SendToUser("/queue/snapshot/insert")
    fun insertSnapshot(
        @Payload request: Message<Command<SnapshotDTO>>,
        principal: Principal
    ): Message<Event<SnapshotDTO>> {
        val user = authenticationService.findUserByPrincipal(principal)
        val snapshot = try {
            syncService.insertSnapshot(request, user)
        } catch (e: DuplicateEntityExistException) {
            logger.warn(e.message)
            syncService.findExistingSnapshot(request, user)
        }

        return Message.create(request.requestInfo, MessageType.EVENT, snapshot)
    }

    @MessageMapping("/opLog/insert")
    @SendToUser("/queue/opLog/insert")
    fun insertOpLog(
        @Payload request: Message<Command<OpLogChunkDTO>>,
        principal: Principal
    ): Message<Event<List<OpLogChunkDTO>>> {
        val user = authenticationService.findUserByPrincipal(principal)
        val opLog = try {
            syncService.insertOpLogs(request, user)
        } catch (e: DuplicateEntityExistException) {
            logger.warn(e.message)
            syncService.findExistingOpLogs(request, user)
        }
        return Message.create(request.requestInfo, MessageType.EVENT, opLog)
    }

    @MessageMapping("/opLog/get")
    @SendToUser("/queue/opLog/get")
    fun getOpLogByDeviceIdsAndGreaterThanSequence(
        @Payload request: Message<Query<List<DeviceSyncState>>>,
        principal: Principal
    ): Message<Document<List<OpLogChunkDTO>>> {
        val user = authenticationService.findUserByPrincipal(principal)
        val requestInfo = request.requestInfo
        val opLogs = syncService.getAllOpLogsByDeviceIdsAndGreaterThanSequence(
            request,
            user
        )
        return Message.create(requestInfo, MessageType.DOCUMENT, opLogs)
    }
}