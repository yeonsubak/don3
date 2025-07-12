package com.don3.sync.domain.sync.entity

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.message.Command
import com.don3.sync.domain.sync.message.Document
import com.don3.sync.domain.sync.message.Event
import com.don3.sync.domain.sync.message.Message
import com.don3.sync.domain.sync.message.dto.OpLogDTO
import com.don3.sync.domain.sync.message.enums.DocumentType
import com.don3.sync.domain.sync.message.enums.EventType
import jakarta.persistence.*
import org.hibernate.annotations.ColumnDefault
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.Instant
import java.util.UUID

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

    @Column(name = "local_id", nullable = false)
    lateinit var localId: UUID

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    lateinit var user: User

    @Column(name = "device_id", nullable = false)
    lateinit var deviceId: UUID

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

    fun toDTO(): OpLogDTO = OpLogDTO(
        deviceId = this.deviceId,
        localId = this.localId,
        version = this.version,
        schemaVersion = this.schemaVersion,
        sequence = this.sequence,
        iv = this.iv,
        data = this.data,
        queryKeys = this.queryKeys,
    )

    fun toDocument(correlationId: UUID?): Document<OpLogDTO> = Document(
        type = DocumentType.OP_LOG,
        timestamp = Instant.now(),
        correlationId = correlationId,
        data = this.toDTO()
    )

    fun toDocument(): Document<OpLogDTO> = this.toDocument(null)

    fun toEvent(correlationId: UUID?) = Event(
        eventId = UUID.randomUUID(),
        timestamp = Instant.now(),
        correlationId = correlationId,
        type = EventType.OP_LOG_CREATED,
        data = this.toDTO()
    )


    companion object {
        fun fromMessage(request: Message<Command<OpLogDTO>>, user: User): OpLog {
            val dto = request.body.data
            return OpLog().apply {
                this.user = user
                this.deviceId = dto.deviceId
                this.localId = dto.localId
                this.version = dto.version
                this.schemaVersion = dto.schemaVersion
                this.sequence = dto.sequence
                this.data = dto.data
                this.iv = dto.iv
                this.queryKeys = dto.queryKeys
            }
        }
    }
}