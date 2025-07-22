package com.don3.sync.domain.sync.message

import com.don3.sync.domain.sync.message.enums.MessageType
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import java.time.Instant

data class Message<T>(
    val requestInfo: RequestInfo?,
    val body: T,
    val sentAt: Instant,
    val type: MessageType,
    val destination: String?,
) {
    fun toApiResponse(status: HttpStatus): ResponseEntity<Message<T>> {
        return if (status == HttpStatus.OK) {
            ResponseEntity.ok(this)
        } else {
            ResponseEntity.status(status).body(this)
        }
    }

    companion object {
        fun <T> create(requestInfo: RequestInfo?, type: MessageType, body: T) = Message(
            requestInfo = requestInfo,
            sentAt = Instant.now(),
            body = body,
            type = type,
            destination = null
        )

        fun createEmpty(messageType: MessageType) = Message(
            requestInfo = null,
            sentAt = Instant.now(),
            body = null,
            type = messageType,
            destination = null
        )
    }
}
