package com.don3.sync.domain.auth.entity

import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import java.time.Instant

@Entity
@Table(
    name = "passkey", schema = "app_auth", indexes = [
        Index(name = "passkey_idx_user_id", columnList = "user_id")
    ]
)
class Passkey {
    @Id
    @Column(name = "id", nullable = false, length = 255)
    var id: String? = null

    @Column(name = "name", length = 255)
    var name: String? = null

    @Column(name = "public_key", nullable = false, length = 255)
    var publicKey: String? = null

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User? = null

    @Column(name = "credential_i_d", nullable = false, length = 255)
    var credentialID: String? = null

    @Column(name = "counter", nullable = false)
    var counter: Int? = null

    @Column(name = "device_type", nullable = false, length = 255)
    var deviceType: String? = null

    @Column(name = "backed_up", nullable = false)
    var backedUp: Boolean? = false

    @Column(name = "transports", length = 255)
    var transports: String? = null

    @Column(name = "created_at")
    var createdAt: Instant? = null

    @Column(name = "aaguid", length = 255)
    var aaguid: String? = null

    @OneToMany(mappedBy = "passkey")
    var wrappedKeys: MutableSet<WrappedKey> = mutableSetOf()
}