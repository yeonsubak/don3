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
    name = "op_logs",
    schema = "sync",
    indexes = [
        Index(name = "op_logs_idx_user_id_device_id", columnList = "user_id, device_id"),
        Index(name = "op_logs_idx_create_at_user_id_device_id", columnList = "create_at, user_id, device_id")
    ],
    uniqueConstraints = [
        UniqueConstraint(
            columnNames = ["user_id", "device_id", "sequence"],
            name = "op_logs_unq_user_id_device_id_seq"
        ),
        UniqueConstraint(
            columnNames = ["local_id", "user_id", "device_id"],
            name = "op_logs_unq_local_id_user_id_device_id"
        )
    ]
)
class OpLog {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    var id: UUID? = null

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User? = null

    @Column(name = "device_id", nullable = false)
    var deviceId: UUID? = null

    @Column(name = "local_id", nullable = false)
    var localId: UUID? = null

    @Column(name = "version", nullable = false)
    var version: String? = null

    @Column(name = "schema_version", nullable = false)
    var schemaVersion: String? = null

    @Column(name = "sequence", nullable = false)
    var sequence: Long? = null

    @Column(name = "data", nullable = false, length = Integer.MAX_VALUE)
    var data: String? = null

    @Column(name = "iv", nullable = false)
    var iv: String? = null

    @CreatedDate
    @Column(name = "create_at", nullable = false, updatable = false)
    var createAt: Instant? = null

    @LastModifiedDate
    @Column(name = "update_at")
    var updateAt: Instant? = null
}