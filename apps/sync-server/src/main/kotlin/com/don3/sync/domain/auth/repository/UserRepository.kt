package com.don3.sync.domain.auth.repository

import com.don3.sync.domain.auth.entity.User
import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository : JpaRepository<User, String> {

    fun findUserById(id: String): User?
}