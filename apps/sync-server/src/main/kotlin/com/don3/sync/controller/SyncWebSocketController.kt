package com.don3.sync.controller

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.dto.InsertSnapshotRequest
import com.don3.sync.service.SyncService
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.handler.annotation.SendTo
import org.springframework.messaging.simp.SimpMessageHeaderAccessor
import org.springframework.stereotype.Controller

@Controller
@MessageMapping("/sync")
class SyncWebSocketController(private val syncService: SyncService) {

    @MessageMapping("/uploadSnapshot")
    @SendTo("/topic/messages")
    fun uploadSnapshot(
        @Payload request: InsertSnapshotRequest,
        accessor: SimpMessageHeaderAccessor
    ) {
        val user =
            accessor.sessionAttributes?.get("user") as? User ?: throw IllegalStateException("User not in session")
        syncService.insertSnapshot(request, user)
    }
}