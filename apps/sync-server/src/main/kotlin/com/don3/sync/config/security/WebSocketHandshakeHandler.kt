package com.don3.sync.config.security

import com.don3.sync.domain.auth.entity.User
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
        val user = attributes["user"] as? User ?: throw IllegalStateException("User missing in attributes")

        return Principal { user.id.toString() }
    }
}