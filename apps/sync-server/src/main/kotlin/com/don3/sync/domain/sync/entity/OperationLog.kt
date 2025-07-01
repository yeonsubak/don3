package com.don3.sync.domain.sync.entity

import com.don3.sync.domain.auth.entity.User
import jakarta.persistence.*
import org.hibernate.annotations.ColumnDefault
import java.time.Instant
import java.util.*

@Entity
@Table(
    name = "operation_logs", schema = "sync", indexes = [
        Index(name = "operation_logs_idx_user_id_device_id", columnList = "user_id, device_id"),
        Index(name = "operation_logs_idx_create_at_user_id_device_id", columnList = "created_at, user_id, device_id")
    ]
)
class OperationLog {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    var id: UUID? = null

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User? = null

    @Column(name = "device_id", nullable = false)
    var deviceId: UUID? = null

    @Column(name = "version", nullable = false)
    var version: String? = null

    @Column(name = "schema_version", nullable = false)
    var schemaVersion: String? = null

    @Column(name = "sequence", nullable = false)
    var sequence: Long? = null

    @Column(name = "method", nullable = false)
    var method: String? = null

    @Column(name = "method_hash", nullable = false, length = Integer.MAX_VALUE)
    var methodHash: String? = null

    @Column(name = "op_data", nullable = false, length = Integer.MAX_VALUE)
    var opData: String? = null

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant? = null

    @Column(name = "updated_at")
    var updatedAt: Instant? = null
}