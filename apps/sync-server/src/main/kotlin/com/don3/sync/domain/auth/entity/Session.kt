package com.don3.sync.domain.auth.entity

import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import java.time.Instant

@Entity
@Table(
    name = "session", schema = "app_auth", indexes = [
        Index(name = "session_idx_token", columnList = "token"),
        Index(name = "session_idx_user_id_token", columnList = "user_id, token")
    ], uniqueConstraints = [
        UniqueConstraint(name = "session_token_unique", columnNames = ["token"])
    ]
)
class Session {
    @Id
    @Column(name = "id", nullable = false, length = 255)
    var id: String? = null

    @Column(name = "expires_at", nullable = false)
    var expiresAt: Instant? = null

    @Column(name = "token", nullable = false, length = 255)
    var token: String? = null

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant? = null

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant? = null

    @Column(name = "ip_address", length = 255)
    var ipAddress: String? = null

    @Column(name = "user_agent", length = 255)
    var userAgent: String? = null

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User? = null
}