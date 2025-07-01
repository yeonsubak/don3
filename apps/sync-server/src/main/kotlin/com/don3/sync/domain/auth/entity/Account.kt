package com.don3.sync.domain.auth.entity

import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import java.time.Instant

@Entity
@Table(
    name = "account", schema = "app_auth", indexes = [
        Index(name = "account_idx_user_id", columnList = "user_id")
    ]
)
class Account {
    @Id
    @Column(name = "id", nullable = false, length = 255)
    var id: String? = null

    @Column(name = "account_id", nullable = false, length = 255)
    var accountId: String? = null

    @Column(name = "provider_id", nullable = false, length = 255)
    var providerId: String? = null

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User? = null

    @Column(name = "access_token", length = 255)
    var accessToken: String? = null

    @Column(name = "refresh_token", length = 255)
    var refreshToken: String? = null

    @Column(name = "id_token", length = 255)
    var idToken: String? = null

    @Column(name = "access_token_expires_at")
    var accessTokenExpiresAt: Instant? = null

    @Column(name = "refresh_token_expires_at")
    var refreshTokenExpiresAt: Instant? = null

    @Column(name = "scope", length = 255)
    var scope: String? = null

    @Column(name = "password", length = 255)
    var password: String? = null

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant? = null

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant? = null
}