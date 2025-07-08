package com.don3.sync.controller

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.dto.OpLogResponse
import com.don3.sync.service.SyncService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
@RequestMapping("/api/v1/sync")
class SyncController(
    private val syncService: SyncService
) {
    @GetMapping("/snapshots/latest")
    fun getLatestSnapshot(@AuthenticationPrincipal user: User): ResponseEntity<out Response<out Any>?> {
        val snapshot = this.syncService.getLatestSnapshot(user)

        if (snapshot == null) {
            return ResponseEntity.ok(Response.error(HttpStatus.NOT_FOUND))
        }

        return ResponseEntity.ok(Response.success(snapshot.toResponse()))
    }

//    @PostMapping("/snapshots/")
//    fun createSnapshot(
//        @RequestBody request: InsertSnapshotRequest,
//        @AuthenticationPrincipal user: User
//    ): ResponseEntity<Response<Unit>> {
//        this.syncService.insertSnapshot(request, user)
//        return ResponseEntity.status(HttpStatus.CREATED).body(Response.success(Unit))
//    }

    @GetMapping("/opLogs")
    fun getOpLogsAfterDate(
        @RequestParam date: Instant,
        @AuthenticationPrincipal user: User
    ): ResponseEntity<Response<List<OpLogResponse>>> {
        val opLogs = this.syncService.getOpLogsAfterDate(date, user)
        return ResponseEntity.ok(Response.success(opLogs))
    }
}