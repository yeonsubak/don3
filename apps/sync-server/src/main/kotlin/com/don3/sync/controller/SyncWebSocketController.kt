package com.don3.sync.controller

import com.don3.sync.domain.sync.message.*
import com.don3.sync.domain.sync.message.dto.DeviceSyncState
import com.don3.sync.domain.sync.message.dto.OpLogDTO
import com.don3.sync.domain.sync.message.dto.SnapshotDTO
import com.don3.sync.domain.sync.message.enums.MessageType
import com.don3.sync.service.AuthenticationService
import com.don3.sync.service.SyncService
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
        val snapshot = syncService.insertSnapshot(request, user)
        return Message.create(request.requestInfo, MessageType.EVENT, snapshot)
    }

    @MessageMapping("/opLog/insert")
    @SendToUser("/queue/opLog/insert")
    fun insertOpLog(
        @Payload request: Message<Command<OpLogDTO>>,
        principal: Principal
    ): Message<Event<OpLogDTO>> {
        val user = authenticationService.findUserByPrincipal(principal)
        val opLog = syncService.insertOpLog(request, user)
        return Message.create(request.requestInfo, MessageType.EVENT, opLog)
    }

    @MessageMapping("/opLog/get")
    @SendToUser("/queue/opLog/get")
    fun getOpLogByDeviceIdsAndGreaterThanSequence(
        @Payload request: Message<Query<List<DeviceSyncState>>>,
        principal: Principal
    ): Message<List<Document<OpLogDTO>>> {
        val user = authenticationService.findUserByPrincipal(principal)
        val requestInfo = request.requestInfo
        val opLogs = syncService.getAllOpLogsByDeviceIdsAndGreaterThanSequence(
            request,
            user
        )

        return Message.create(requestInfo, MessageType.DOCUMENT, opLogs)
    }
}