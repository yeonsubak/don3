package com.don3.sync.domain.sync.entity

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.dto.InsertOpLogRequest
import com.don3.sync.domain.sync.dto.OpLogResponse
import com.don3.sync.domain.sync.dto.WebSocketRequest
import com.don3.sync.domain.sync.dto.WebSocketResponse
import com.don3.sync.domain.sync.enums.WebSocketRequestType
import com.don3.sync.domain.sync.enums.WebSocketResponseType
import jakarta.persistence.*
import org.hibernate.annotations.ColumnDefault
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.Instant
import java.util.*

@Entity
@EntityListeners(AuditingEntityListener::class)
@Table(
    name = "op_logs",
    schema = "sync",
    indexes = [
        Index(name = "op_logs_idx_user_id_device_id", columnList = "user_id, device_id"),
        Index(name = "op_logs_idx_create_at_user_id_device_id", columnList = "create_at, user_id, device_id")
    ],
    uniqueConstraints = [
        UniqueConstraint(
            name = "op_logs_unq_local_id_user_id_device_id",
            columnNames = ["local_id", "user_id", "device_id"]
        ),
        UniqueConstraint(name = "op_logs_unq_user_id_device_id_seq", columnNames = ["user_id", "device_id", "sequence"])
    ]
)
class OpLog {
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

    @Column(name = "version", nullable = false)
    lateinit var version: String

    @Column(name = "schema_version", nullable = false)
    lateinit var schemaVersion: String

    @Column(name = "sequence", nullable = false)
    var sequence: Long = 0

    @Column(name = "data", nullable = false, length = Integer.MAX_VALUE)
    lateinit var data: String

    @Column(name = "iv", nullable = false)
    lateinit var iv: String

    @ColumnDefault("'[]'")
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "query_keys", nullable = false)
    var queryKeys: List<String> = emptyList()

    @CreatedDate
    @Column(name = "create_at", nullable = false, updatable = false)
    lateinit var createAt: Instant

    @LastModifiedDate
    @Column(name = "update_at")
    var updateAt: Instant? = null

    fun toResponse(): OpLogResponse = OpLogResponse(
        id = this.id,
        userId = this.user.id,
        deviceId = this.deviceId,
        localId = this.localId,
        version = this.version,
        schemaVersion = this.schemaVersion,
        sequence = this.sequence.toBigInteger(),
        iv = this.iv,
        data = this.data,
        queryKeys = this.queryKeys,
        createAt = this.createAt,
        updateAt = this.updateAt
    )

    fun <P> toWebSocketResponse(request: WebSocketRequest<P>): WebSocketResponse<OpLogResponse> {
        if (request.type === WebSocketRequestType.INSERT_OP_LOG) {
            return WebSocketResponse(
                requestId = request.requestId,
                userId = request.userId,
                deviceId = request.deviceId,
                type = WebSocketResponseType.OP_LOG_INSERTED,
                payload = this.toResponse(),
                message = "Snapshot inserted successfully."
            )
        }

        throw IllegalArgumentException("Invalid request type")
    }

    companion object {
        fun fromRequest(request: WebSocketRequest<InsertOpLogRequest>, user: User): OpLog {
            val payload =
                request.payload ?: throw IllegalArgumentException("Payload for opLog insertion must not be null.")

            return OpLog().apply {
                this.user = user
                this.deviceId = UUID.fromString(request.deviceId)
                this.localId = UUID.fromString(payload.localId)
                this.version = payload.version
                this.schemaVersion = payload.schemaVersion
                this.sequence = payload.sequence.toLong()
                this.data = payload.data
                this.iv = payload.iv
                this.queryKeys = payload.queryKeys
            }
        }
    }
}