package com.don3.sync.domain.sync.entity

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.message.Command
import com.don3.sync.domain.sync.message.Document
import com.don3.sync.domain.sync.message.Event
import com.don3.sync.domain.sync.message.Message
import com.don3.sync.domain.sync.message.dto.SnapshotDTO
import com.don3.sync.domain.sync.message.enums.DocumentType
import com.don3.sync.domain.sync.message.enums.EventType
import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.Instant
import java.util.UUID

@Entity
@EntityListeners(AuditingEntityListener::class)
@Table(
    name = "snapshots",
    schema = "sync",
    indexes = [
        Index(name = "snapshots_idx_create_at_user_id", columnList = "create_at, user_id")
    ],
    uniqueConstraints = [
        UniqueConstraint(
            name = "snapshots_unq_local_id_user_id",
            columnNames = ["local_id", "user_id"]
        ),
        UniqueConstraint(
            name = "snapshots_unq_user_id_sequence",
            columnNames = ["user_id", "sequence"]
        )
    ]
)
class Snapshot {
    @Id
    @Column(name = "id", nullable = false)
    var id: UUID = UUID.randomUUID()

    @Column(name = "local_id", nullable = false)
    lateinit var localId: UUID

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    lateinit var user: User

    @Column(name = "sequence", nullable = false)
    var sequence: Long = 0

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

    fun toDTO(): SnapshotDTO = SnapshotDTO(
        localId = this.localId,
        schemaVersion = this.schemaVersion,
        iv = this.iv,
        meta = this.meta,
        dump = this.dump,
        sequence = this.sequence,
        createAt = this.createAt
    )

    fun toDTOWithoutDump() = SnapshotDTO(
        localId = this.localId,
        schemaVersion = this.schemaVersion,
        iv = this.iv,
        meta = this.meta,
        dump = null,
        sequence = this.sequence,
        createAt = this.createAt
    )


    fun toDocument(correlationId: UUID?): Document<SnapshotDTO> = Document(
        type = DocumentType.SNAPSHOT,
        timestamp = Instant.now(),
        correlationId = correlationId,
        data = this.toDTO()
    )

    fun toDocument(): Document<SnapshotDTO> = this.toDocument(null)

    fun toEvent(withoutDump: Boolean, correlationId: UUID?) = Event(
        eventId = UUID.randomUUID(),
        timestamp = Instant.now(),
        correlationId = correlationId,
        type = EventType.SNAPSHOT_CREATED,
        data = if (withoutDump) this.toDTOWithoutDump() else this.toDTO()
    )

    companion object {
        fun fromMessage(request: Message<Command<SnapshotDTO>>, user: User): Snapshot {
            val dto = request.body.data
            return Snapshot().apply {
                this.localId = dto.localId
                this.user = user
                this.schemaVersion = dto.schemaVersion
                this.dump = dto.dump ?: ""
                this.meta = dto.meta
                this.iv = dto.iv
            }
        }
    }
}