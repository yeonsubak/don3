package com.don3.sync.exception

class DuplicateEntityExistException(
    entityName: String,
    cause: Throwable? = null
) : RuntimeException("Possibly attempting to insert a duplicated $entityName entity.", cause)