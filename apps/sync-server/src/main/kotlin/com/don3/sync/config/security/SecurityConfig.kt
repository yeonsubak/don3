package com.don3.sync.config.security

import com.don3.sync.service.AuthenticationService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.AuthenticationProvider
import org.springframework.security.authentication.ProviderManager
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.Authentication
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

@Configuration
class SecurityConfig(
    private val authenticationService: AuthenticationService
) {
    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }

    @Bean
    fun doNothingAuthenticationProvider(): AuthenticationProvider {
        return object : AuthenticationProvider {
            override fun authenticate(authentication: Authentication?): Authentication? {
                return null
            }

            override fun supports(authentication: Class<*>): Boolean {
                return false
            }
        }
    }

    @Bean
    fun authenticationManager(): AuthenticationManager {
        return ProviderManager(listOf(doNothingAuthenticationProvider()))
    }

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http.csrf { it.disable() }
            .cors { }
            .sessionManagement {
                it.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            }
            .authorizeHttpRequests {
                it.anyRequest().authenticated()
            }
            .httpBasic { it.disable() }
            .formLogin { it.disable() }
            .addFilterBefore(
                AuthenticationFilter(authenticationService),
                UsernamePasswordAuthenticationFilter::class.java

            )

        return http.build()
    }
}