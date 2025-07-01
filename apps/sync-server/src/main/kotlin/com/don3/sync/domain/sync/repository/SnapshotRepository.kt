package com.don3.sync.domain.sync.repository

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.entity.Snapshot
import org.springframework.data.jpa.repository.JpaRepository

interface SnapshotRepository : JpaRepository<Snapshot, String> {
    fun findFirstByUserEqualsOrderByCreatedAtDesc(user: User): Snapshot?
}