package com.don3.sync.config.security

import com.don3.sync.service.AuthenticationService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.web.filter.OncePerRequestFilter

class AuthenticationFilter(
    private val authenticationService: AuthenticationService,
) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val cookieValue = authenticationService.extractCookieValue(request)

        if (cookieValue.isNullOrBlank()) {
            filterChain.doFilter(request, response)
            return
        }

        val session = authenticationService.findValidSessionByToken(cookieValue)
        if (session == null || session.user == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired session")
            return
        }

        val user = session.user
        val auth = UsernamePasswordAuthenticationToken(user, null, emptyList())
            .apply {
                details = WebAuthenticationDetailsSource().buildDetails(request)
            }

        SecurityContextHolder.getContext().authentication = auth
        filterChain.doFilter(request, response)
    }
}