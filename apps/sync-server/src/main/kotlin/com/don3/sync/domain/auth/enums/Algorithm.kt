package com.don3.sync.domain.auth.enums

enum class Algorithm(val dbValue: String) {
    AES_GCM("AES-GCM"),
    AES_KW("AES-KW"),
    RSA("RSA");

    companion object {
        private val map = entries.associateBy { it.dbValue }

        fun fromDb(value: String): Algorithm =
            map[value] ?: error("Unknown Algorithm value: $value")
    }
}
