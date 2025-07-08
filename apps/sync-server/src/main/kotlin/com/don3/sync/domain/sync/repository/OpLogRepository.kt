package com.don3.sync.domain.sync.repository

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.entity.OpLog
import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant
import java.util.*

interface OpLogRepository : JpaRepository<OpLog, String> {
    fun findAllByUserAndCreateAtAfter(user: User, date: Instant): List<OpLog>
    fun findAllByUserAndDeviceIdAndSequenceGreaterThan(user: User, deviceId: UUID, sequence: Long): List<OpLog>
    fun findByUserAndDeviceIdAndSequence(user: User, deviceId: UUID, sequence: Long): OpLog
}