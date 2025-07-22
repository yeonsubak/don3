package com.don3.sync.domain.auth.entity

import AlgorithmConverter
import com.don3.sync.domain.auth.enums.Algorithm
import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import java.time.Instant

@Entity
@Table(
    name = "wrapped_keys", schema = "app_auth", indexes = [
        Index(name = "wrapped_key_idx_passkey_id", columnList = "passkey_id")
    ]
)
class WrappedKey {
    @Id
    @Column(name = "id", nullable = false, length = 255)
    var id: String? = null

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "passkey_id", nullable = false)
    var passkey: Passkey? = null

    @Column(name = "wrapped_key", nullable = false, length = 255)
    var wrappedKey: String? = null

    @Column(name = "created_at")
    var createdAt: Instant? = null

    @Column(name = "updated_at")
    var updatedAt: Instant? = null

    @Column(name = "prf_salt", nullable = false, length = 255)
    var prfSalt: String? = null

    @Column(name = "algorithm", columnDefinition = "algorithm_enum not null")
    @Convert(converter = AlgorithmConverter::class)
    var algorithm: Algorithm? = null
}