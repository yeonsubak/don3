package com.don3.sync.controller

import com.don3.sync.domain.sync.dto.*
import com.don3.sync.domain.sync.enums.WebSocketResponseType
import com.don3.sync.service.AuthenticationService
import com.don3.sync.service.SyncService
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.annotation.SendToUser
import org.springframework.stereotype.Controller
import java.security.Principal

class InvalidPayloadException(message: String) : IllegalArgumentException(message)

@Controller
@MessageMapping("/sync")
class SyncWebSocketController(
    private val syncService: SyncService,
    private val authenticationService: AuthenticationService
) {

    /**
     * Handles requests to get the latest snapshot of the user.
     * The response is sent back to the user who initiated the request.
     *
     * @param request The WebSocketRequest with null payload
     * @param principal The authenticated user's principal.
     * @return A WebSocketResponse with snapshot in the payload
     */
    @MessageMapping("/snapshot/latest")
    @SendToUser("/queue/snapshot/latest")
    fun getLatestSnapshot(
        @Payload request: WebSocketRequest<Nothing>, principal: Principal
    ): WebSocketResponse<GetSnapshotResponse> {
        val user = authenticationService.findUserByPrincipal(principal)
        val snapshot = syncService.getLatestSnapshot(user)
        return WebSocketResponse(
            requestId = request.requestId,
            type = WebSocketResponseType.GET_SNAPSHOT,
            payload = snapshot,
            message = "Latest snapshot retrieved successfully."
        )
    }

    /**
     * Handles requests to insert a new snapshot.
     * The response is sent back to the user who initiated the request.
     *
     * @param request The WebSocketRequest containing the InsertSnapshotRequest payload.
     * @param principal The authenticated user's principal.
     * @return A WebSocketResponse indicating the result of the operation.
     */
    @MessageMapping("/snapshot/insert")
    @SendToUser("/queue/snapshot/insert")
    fun insertSnapshot(
        @Payload request: WebSocketRequest<InsertSnapshotRequest>, principal: Principal
    ): WebSocketResponse<Nothing> {
        val payload =
            request.payload ?: throw InvalidPayloadException("Payload for snapshot insertion must not be null.")

        val user = authenticationService.findUserByPrincipal(principal)

        syncService.insertSnapshot(payload, user)

        val res = WebSocketResponse(
            requestId = request.requestId,
            type = WebSocketResponseType.SNAPSHOT_INSERTED, // More specific response type
            payload = null,
            message = "Snapshot inserted successfully."
        )

        println("Server sending snapshot insert response to user ${principal.name} on /queue/snapshot/insert: $res")

        return res
    }

    /**
     * Handles requests to insert an operation log.
     * The response, including the created OpLog, is sent back to the user.
     *
     * @param request The WebSocketRequest containing the InsertOpLogRequest payload.
     * @param principal The authenticated user's principal.
     * @return A WebSocketResponse containing the OpLogResponse.
     */
    @MessageMapping("/opLog/insert")
    @SendToUser("/queue/opLog/insert")
    fun insertOpLog(
        @Payload request: WebSocketRequest<InsertOpLogRequest>, principal: Principal
    ): WebSocketResponse<OpLogResponse> {
        val payload = request.payload ?: throw InvalidPayloadException("Payload for opLog insertion must not be null.")
        val user = this.authenticationService.findUserByPrincipal(principal)

        val opLog = syncService.insertOpLog(payload, user)

        return WebSocketResponse(
            requestId = request.requestId, type = WebSocketResponseType.OP_LOG_INSERTED, // More specific response type
            payload = opLog, message = "Operation log inserted successfully."
        )
    }
}