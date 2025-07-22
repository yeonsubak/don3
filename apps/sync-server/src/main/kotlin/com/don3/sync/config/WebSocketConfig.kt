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
    private val authenticationService: AuthenticationService,
    private val corsProperties: CorsProperties
) : WebSocketMessageBrokerConfigurer {

    companion object {
        val TOPIC_PREFIX = arrayOf("/topic", "/queue")
        const val APPLICATION_DESTINATION_PREFIX = "/app"
        const val USER_DESTINATION_PREFIX = "/user"
        const val WEBSOCKET_ENDPOINT = "/ws"
    }

    override fun configureMessageBroker(registry: MessageBrokerRegistry) {
        registry.enableSimpleBroker(*TOPIC_PREFIX)
        registry.setApplicationDestinationPrefixes(APPLICATION_DESTINATION_PREFIX)
        registry.setUserDestinationPrefix(USER_DESTINATION_PREFIX)
    }

    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint(WEBSOCKET_ENDPOINT)
            .setAllowedOriginPatterns(*corsProperties.allowedOrigins.toTypedArray())
            .setHandshakeHandler(WebSocketHandshakeHandler())
            .addInterceptors(WebSocketHandshakeInterceptor(authenticationService))
    }

    override fun configureWebSocketTransport(registry: WebSocketTransportRegistration) {
        registry.setMessageSizeLimit(1024 * 1024) // 1MB
        registry.setSendBufferSizeLimit(1024 * 1024) //1MB
        registry.setSendTimeLimit(20_000)
    }
}