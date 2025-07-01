package com.don3.sync.domain.sync.entity

import com.don3.sync.domain.auth.entity.User
import jakarta.persistence.*
import org.hibernate.annotations.ColumnDefault
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.Instant
import java.util.*

@Entity
@EntityListeners(AuditingEntityListener::class)
@Table(
    name = "snapshots", schema = "sync", indexes = [
        Index(name = "snapshots_idx_user_id_device_id", columnList = "user_id, device_id"),
        Index(name = "snapshots_idx_create_at_user_id_device_id", columnList = "created_at, user_id, device_id")
    ]
)
class Snapshot {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    var id: UUID? = null

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User? = null

    @Column(name = "device_id", nullable = false)
    var deviceId: UUID? = null

    @Column(name = "schema_version", nullable = false)
    var schemaVersion: String? = null

    @Column(name = "dump", nullable = false)
    var dump: String? = null

    @Column(name = "meta", nullable = false)
    var meta: String? = null

    @Column(name = "iv", nullable = false)
    var iv: String? = null

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant? = null

    @LastModifiedDate
    @Column(name = "updated_at")
    var updatedAt: Instant? = null
}