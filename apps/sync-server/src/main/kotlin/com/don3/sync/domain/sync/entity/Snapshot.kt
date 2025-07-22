package com.don3.sync.domain.sync.entity

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.message.Document
import com.don3.sync.domain.sync.message.Event
import com.don3.sync.domain.sync.message.dto.snapshot.SnapshotDTO
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
            name = "snapshots_unq_checksum_user_id",
            columnNames = ["checksum", "user_id"]
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

    @Column(name = "schema_version", nullable = false)
    lateinit var schemaVersion: String

    @Column(name = "dump", nullable = false)
    lateinit var dump: String

    @Column(name = "meta", nullable = false)
    lateinit var meta: String

    @Column(name = "iv", nullable = false)
    lateinit var iv: String

    @Column(name = "checksum", nullable = false)
    lateinit var checksum: String // sha256

    @CreatedDate
    @Column(name = "create_at", nullable = false, updatable = false)
    lateinit var createAt: Instant

    @LastModifiedDate
    @Column(name = "update_at")
    var updateAt: Instant? = null

    fun toDTO(): SnapshotDTO = SnapshotDTO(
        schemaVersion = this.schemaVersion,
        iv = this.iv,
        meta = this.meta,
        dump = this.dump,
        checksum = this.checksum,
        createAt = this.createAt
    )

    fun toDTOWithoutDump() = SnapshotDTO(
        schemaVersion = this.schemaVersion,
        iv = this.iv,
        meta = this.meta,
        dump = null,
        checksum = this.checksum,
        createAt = this.createAt
    )


    fun toDocument(correlationId: String?): Document<SnapshotDTO> = Document(
        type = DocumentType.SNAPSHOT,
        timestamp = Instant.now(),
        correlationId = correlationId,
        data = this.toDTO()
    )

    fun toDocument(): Document<SnapshotDTO> = this.toDocument(null)

    fun toEvent(withoutDump: Boolean, correlationId: String?) = Event(
        timestamp = Instant.now(),
        correlationId = correlationId,
        type = EventType.SNAPSHOT_CREATED,
        data = if (withoutDump) this.toDTOWithoutDump() else this.toDTO()
    )

    companion object {
        fun fromDTO(dto: SnapshotDTO, user: User): Snapshot = Snapshot().apply {
            this.user = user
            this.schemaVersion = dto.schemaVersion
            this.dump = dto.dump ?: ""
            this.meta = dto.meta
            this.iv = dto.iv
            this.checksum = dto.checksum
        }
    }
}