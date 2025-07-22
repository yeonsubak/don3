package com.don3.sync.exception

class ValueNotFoundException(
    valueName: String,
    cause: Throwable? = null
) : IllegalArgumentException("Required value '$valueName' was not found.", cause)
