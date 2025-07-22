package com.don3.sync.config.security

import org.springframework.http.server.ServerHttpRequest
import org.springframework.web.socket.WebSocketHandler
import org.springframework.web.socket.server.support.DefaultHandshakeHandler
import java.security.Principal

class WebSocketHandshakeHandler() : DefaultHandshakeHandler() {
    override fun determineUser(
        request: ServerHttpRequest,
        wsHandler: WebSocketHandler,
        attributes: Map<String?, Any?>
    ): Principal {
        val userId = attributes["userId"] as? String ?: throw IllegalStateException("UserId missing in attributes")
        return Principal { userId }
    }
}