package com.don3.sync.domain.auth.repository

import com.don3.sync.domain.auth.entity.Session
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface SessionRepository : JpaRepository<Session, String> {
    fun findByToken(token: String): Session?


    @Query(
        """
        SELECT s FROM Session s
        JOIN FETCH s.user
        WHERE s.token = :token
    """
    )
    fun findWithUserByToken(@Param("token") token: String): Session?
}