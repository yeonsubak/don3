package com.don3.sync.controller

import org.springframework.http.HttpStatus
import java.time.Instant

data class Response<T>(
    val status: String,
    val statusCode: Int,
    val data: T?,
    val sentAt: Instant,
    val message: String? = null,
) {
    companion object {
        fun <T> success(data: T): Response<T> =
            Response("SUCCESS", 200, data, Instant.now())

        fun <T> error(statusCode: HttpStatus): Response<T> =
            Response("ERROR", statusCode.value(), null, Instant.now())
    }
}