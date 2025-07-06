package com.don3.sync.service

import com.don3.sync.domain.auth.entity.Session
import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.auth.repository.SessionRepository
import com.don3.sync.domain.auth.repository.UserRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.Principal
import java.time.ZoneId
import java.time.ZonedDateTime

@Service
class AuthenticationService(
    private val sessionRepository: SessionRepository,
    private val userRepository: UserRepository
) {

    @Transactional
    fun findValidSessionByToken(cookieValue: String): Session? {
        val token = cookieValue.split(".")[0]
        val session = sessionRepository.findWithUserByToken(token)
        return if (this.validateSession(session)) session else null
    }

    fun extractCookieValue(request: HttpServletRequest): String? {
        return request.cookies?.firstOrNull { it.name == "better-auth.session_token" }?.value
    }

    fun findUserByPrincipal(principal: Principal): User {
        return userRepository.findUserById(principal.name) ?: throw IllegalStateException("User not in session")
    }

    private fun validateSession(session: Session?): Boolean {
        val now = ZonedDateTime.now(ZoneId.systemDefault()).toInstant()
        return session != null && now.isBefore(session.expiresAt)
    }
}