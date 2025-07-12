package com.don3.sync.domain.sync.repository

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.entity.Snapshot
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface SnapshotRepository : JpaRepository<Snapshot, String> {
    fun findFirstByUserEqualsOrderByCreateAtDesc(user: User): Snapshot?
    fun findFirstByUserAndLocalId(user: User, localId: UUID): Snapshot?

    @Query(
        value = "SELECT COALESCE(MAX(sequence), 1) FROM sync.snapshots ss WHERE ss.user_id = :userId",
        nativeQuery = true
    )
    fun findMaxSequenceByUserId(@Param("userId") userId: String): Long
}