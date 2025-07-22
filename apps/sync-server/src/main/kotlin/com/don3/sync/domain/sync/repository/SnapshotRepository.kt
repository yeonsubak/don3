package com.don3.sync.domain.sync.repository

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.entity.Snapshot
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface SnapshotRepository : JpaRepository<Snapshot, String> {
    fun findFirstByUserEqualsOrderByCreateAtDesc(user: User): Snapshot?
    fun findFirstByUserAndChecksum(user: User, checksum: String): Snapshot?

    @Query(
        value = """
            SELECT ss.checksum 
            FROM sync.snapshots ss 
            WHERE ss.user_id = :userId
            ORDER BY ss.create_at DESC
            LIMIT 1
            """,
        nativeQuery = true
    )
    fun findChecksumByUserId(@Param("userId") userId: String): String?

    @Modifying
    @Query(
        value = """
            DELETE FROM sync.snapshots ss 
            WHERE ss.user_id = :userId 
            AND ss.checksum <> :excludeChecksum
            """,
        nativeQuery = true
    )
    fun clearSnapshots(@Param("userId") userId: String, @Param("excludeChecksum") excludeChecksum: String)
}