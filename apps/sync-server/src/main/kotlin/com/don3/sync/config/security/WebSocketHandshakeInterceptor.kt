package com.don3.sync.config.security

import com.don3.sync.service.AuthenticationService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.server.ServerHttpRequest
import org.springframework.http.server.ServerHttpResponse
import org.springframework.http.server.ServletServerHttpRequest
import org.springframework.web.socket.WebSocketHandler
import org.springframework.web.socket.server.HandshakeInterceptor

class WebSocketHandshakeInterceptor(
    private val authenticationService: AuthenticationService
) : HandshakeInterceptor {

    override fun beforeHandshake(
        request: ServerHttpRequest,
        response: ServerHttpResponse,
        wsHandler: WebSocketHandler,
        attributes: MutableMap<String, Any>
    ): Boolean {
        if (request !is ServletServerHttpRequest) return false

        val servletRequest: HttpServletRequest = request.servletRequest
        val cookieValue = authenticationService.extractCookieValue(servletRequest)

        if (cookieValue.isNullOrBlank()) return false

        val session = authenticationService.findValidSessionByToken(cookieValue)
        val user = session?.user ?: return false

        attributes["user"] = user // Store authenticated user in WebSocket session attributes
        attributes["userId"] = user.id.toString()
        return true
    }

    override fun afterHandshake(
        request: ServerHttpRequest,
        response: ServerHttpResponse,
        wsHandler: WebSocketHandler,
        exception: Exception?
    ) {
        // No-op
    }
}