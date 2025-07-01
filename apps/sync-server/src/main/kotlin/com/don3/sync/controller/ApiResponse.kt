package com.don3.sync.controller

data class ApiResponse<T>(
    val status: String,
    val statusCode: Int,
    val data: T?,
    val message: String? = null
) {
    companion object {
        fun <T> success(data: T): ApiResponse<T> =
            ApiResponse("SUCCESS", 200, data)

        fun <T> error(statusCode: Int, message: String): ApiResponse<T> =
            ApiResponse("ERROR", statusCode, null, message)
    }
}