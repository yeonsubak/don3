package com.don3.sync.domain.sync.repository

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.entity.OpLog
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant
import java.util.UUID

interface OpLogRepository : JpaRepository<OpLog, String> {
    fun findAllByUserAndChunkId(user: User, chunkId: UUID): List<OpLog>
    fun findAllByUserAndCreateAtAfter(user: User, date: Instant): List<OpLog>
    fun findAllByUserAndDeviceIdNotIn(user: User, deviceIds: List<UUID>): List<OpLog>
    fun findAllByUserAndDeviceIdAndSequenceGreaterThan(user: User, deviceId: UUID, sequence: Long): List<OpLog>

    @Query(
        value = """
            SELECT COUNT(*)
            FROM sync.op_logs op 
            WHERE op.user_id = :userId
            """,
        nativeQuery = true
    )
    fun countOpLogsByUserId(@Param("userId") userId: String): Long

    @Modifying
    @Query(
        value = """
            DELETE FROM sync.op_logs op 
            WHERE op.user_id = :userId
            """,
        nativeQuery = true
    )
    fun clearOpLogs(@Param("userId") userId: String)
}