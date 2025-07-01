package com.don3.sync.config

import com.don3.sync.config.security.WebSocketHandshakeHandler
import com.don3.sync.config.security.WebSocketHandshakeInterceptor
import com.don3.sync.service.AuthenticationService
import org.springframework.context.annotation.Configuration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(
    private val authenticationService: AuthenticationService
) : WebSocketMessageBrokerConfigurer {

    override fun configureMessageBroker(registry: MessageBrokerRegistry) {
        registry.enableSimpleBroker("/topic")
        registry.setApplicationDestinationPrefixes("/app")
        registry.setUserDestinationPrefix("/user")
    }

    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")
            .setHandshakeHandler(WebSocketHandshakeHandler())
            .addInterceptors(WebSocketHandshakeInterceptor(authenticationService))
    }

    override fun configureWebSocketTransport(registry: WebSocketTransportRegistration) {
        registry.setMessageSizeLimit(1024 * 1024) // 1MB
        registry.setSendBufferSizeLimit(1024 * 1024) //1MB
        registry.setSendTimeLimit(20_000)
    }
}