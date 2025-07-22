package com.don3.sync.domain.auth.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.Instant

@Entity
@Table(
    name = "user", schema = "app_auth", indexes = [
        Index(name = "user_idx_email", columnList = "email")
    ], uniqueConstraints = [
        UniqueConstraint(name = "user_email_unique", columnNames = ["email"])
    ]
)
class User {
    @Id
    @Column(name = "id", nullable = false, length = 255)
    lateinit var id: String

    @Column(name = "name", nullable = false, length = 255)
    lateinit var name: String

    @Column(name = "email", nullable = false, length = 255)
    lateinit var email: String

    @Column(name = "email_verified", nullable = false)
    var emailVerified: Boolean = false

    @Column(name = "image", length = 255)
    var image: String? = null

    @Column(name = "created_at", nullable = false)
    lateinit var createdAt: Instant

    @Column(name = "updated_at", nullable = false)
    lateinit var updatedAt: Instant

    @OneToMany(mappedBy = "user")
    var accounts: MutableSet<Account> = mutableSetOf()

    @OneToMany(mappedBy = "user")
    var passkeys: MutableSet<Passkey> = mutableSetOf()
}