package com.don3.sync.domain.sync.entity

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.message.Document
import com.don3.sync.domain.sync.message.dto.oplog.OpLogDTO
import com.don3.sync.domain.sync.message.enums.DocumentType
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
        UniqueConstraint(name = "op_logs_unq_user_id_device_id_seq", columnNames = ["user_id", "device_id", "sequence"])
    ]
)
class OpLog {
    @Id
    @Column(name = "id", nullable = false)
    var id: UUID = UUID.randomUUID()

    @Column(name = "chunk_id", nullable = false)
    lateinit var chunkId: UUID

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

    fun toDTO(): OpLogDTO = OpLogDTO(
        localId = this.localId.toString(),
        deviceId = this.deviceId.toString(),
        chunkId = this.chunkId.toString(),
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
        correlationId = correlationId.toString(),
        data = this.toDTO()
    )

    fun toDocument(): Document<OpLogDTO> = this.toDocument(null)

    companion object {
        fun fromDTO(opLogDTO: OpLogDTO, user: User): OpLog = OpLog().apply {
            this.user = user
            this.deviceId = UUID.fromString(opLogDTO.deviceId)
            this.chunkId = UUID.fromString(opLogDTO.chunkId)
            this.localId = UUID.fromString(opLogDTO.localId)
            this.version = opLogDTO.version
            this.schemaVersion = opLogDTO.schemaVersion
            this.sequence = opLogDTO.sequence
            this.data = opLogDTO.data
            this.iv = opLogDTO.iv
            this.queryKeys = opLogDTO.queryKeys
        }
    }
}