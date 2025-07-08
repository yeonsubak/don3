package com.don3.sync.domain.sync.entity

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.dto.InsertSnapshotRequest
import com.don3.sync.domain.sync.dto.SnapshotResponse
import com.don3.sync.domain.sync.dto.WebSocketRequest
import com.don3.sync.domain.sync.dto.WebSocketResponse
import com.don3.sync.domain.sync.enums.WebSocketRequestType
import com.don3.sync.domain.sync.enums.WebSocketResponseType
import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.Instant
import java.util.*

@Entity
@EntityListeners(AuditingEntityListener::class)
@Table(
    name = "snapshots",
    schema = "sync",
    indexes = [
        Index(name = "snapshots_idx_user_id_device_id", columnList = "user_id, device_id"),
        Index(name = "snapshots_idx_create_at_user_id_device_id", columnList = "create_at, user_id, device_id")
    ],
    uniqueConstraints = [
        UniqueConstraint(
            name = "snapshots_unq_local_id_user_id_device_id",
            columnNames = ["local_id", "user_id", "device_id"]
        )
    ]
)
class Snapshot {
    @Id
    @Column(name = "id", nullable = false)
    var id: UUID = UUID.randomUUID()

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    lateinit var user: User

    @Column(name = "device_id", nullable = false)
    lateinit var deviceId: UUID

    @Column(name = "local_id", nullable = false)
    lateinit var localId: UUID

    @Column(name = "schema_version", nullable = false)
    lateinit var schemaVersion: String

    @Column(name = "dump", nullable = false)
    lateinit var dump: String

    @Column(name = "meta", nullable = false)
    lateinit var meta: String

    @Column(name = "iv", nullable = false)
    lateinit var iv: String

    @CreatedDate
    @Column(name = "create_at", nullable = false, updatable = false)
    lateinit var createAt: Instant

    @LastModifiedDate
    @Column(name = "update_at")
    var updateAt: Instant? = null

    fun toResponse(): SnapshotResponse = SnapshotResponse(
        localId = this.localId,
        schemaVersion = this.schemaVersion,
        iv = this.iv,
        meta = this.meta,
        dump = this.dump,
        createAt = this.createAt,
        updateAt = this.updateAt
    )

    fun <P> toWebSocketResponse(request: WebSocketRequest<P>): WebSocketResponse<SnapshotResponse> {
        if (request.type === WebSocketRequestType.INSERT_SNAPSHOT) {
            return WebSocketResponse(
                requestId = request.requestId,
                userId = this.user.id,
                deviceId = request.deviceId,
                type = WebSocketResponseType.SNAPSHOT_INSERTED,
                payload = this.toResponse(),
                message = "Snapshot inserted successfully."
            )
        }

        if (request.type === WebSocketRequestType.GET_LATEST_SNAPSHOT) {
            return WebSocketResponse(
                requestId = request.requestId,
                userId = this.user.id,
                deviceId = request.deviceId,
                type = WebSocketResponseType.GET_SNAPSHOT,
                payload = this.toResponse(),
                message = "Latest snapshot retrieved successfully."
            )
        }

        throw IllegalArgumentException("Invalid request type")
    }

    companion object {
        fun fromRequest(request: WebSocketRequest<InsertSnapshotRequest>, user: User): Snapshot = Snapshot().apply {
            val payload =
                request.payload ?: throw IllegalArgumentException("Payload for snapshot insertion must not be null.")
            this.user = user
            this.deviceId = UUID.fromString(request.deviceId)
            this.localId = UUID.fromString(payload.localId)
            this.schemaVersion = payload.schemaVersion
            this.dump = payload.dump
            this.iv = payload.iv
            this.meta = payload.meta
        }
    }
}