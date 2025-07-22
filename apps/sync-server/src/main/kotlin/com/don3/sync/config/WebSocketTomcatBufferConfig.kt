package com.don3.sync.config

import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class WebSocketTomcatBufferConfig {

    @Bean
    fun tomcatFactory(): TomcatServletWebServerFactory {
        val factory = TomcatServletWebServerFactory()
        factory.addContextCustomizers({ context ->
            context.servletContext.setAttribute("org.apache.tomcat.websocket.textBufferSize", 1024 * 1024) // 1MB
            context.servletContext.setAttribute("org.apache.tomcat.websocket.binaryBufferSize", 1024 * 1024)
        })
        return factory
    }
}