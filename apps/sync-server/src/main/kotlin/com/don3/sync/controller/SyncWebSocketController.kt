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
    ): WebSocketResponse<SnapshotResponse>? {
        val user = authenticationService.findUserByPrincipal(principal)
        val snapshot = syncService.getLatestSnapshot(user)
        return snapshot?.toWebSocketResponse(request)
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
    ): WebSocketResponse<SnapshotResponse>? {
        val user = authenticationService.findUserByPrincipal(principal)
        val snapshot = syncService.insertSnapshot(request, user)
        val res = snapshot?.toWebSocketResponse(request)
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
        val user = this.authenticationService.findUserByPrincipal(principal)
        val opLog = syncService.insertOpLog(request, user)
        return opLog.toWebSocketResponse(request)
    }

    @MessageMapping("/opLog/get")
    @SendToUser("/queue/opLog/get")
    fun getOpLogByDeviceIdsAndGreaterThanSequence(
        @Payload request: WebSocketRequest<GetOpLogRequest>,
        principal: Principal
    ): WebSocketResponse<List<OpLogResponse>> {
        val payload = request.payload ?: throw InvalidPayloadException("Payload for opLog get must not be null.")
        val user = this.authenticationService.findUserByPrincipal(principal)

        val opLogs = syncService.getAllOpLogsByDeviceIdsAndGreaterThanSequence(payload.deviceIdAndSeq, user)

        return WebSocketResponse(
            requestId = request.requestId,
            userId = user.id,
            deviceId = request.deviceId,
            type = WebSocketResponseType.GET_OP_LOG,
            payload = opLogs,
            message = "Operation logs retrieved successfully."
        )
    }
}