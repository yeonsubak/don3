package com.don3.sync.controller

import com.don3.sync.domain.auth.entity.User
import com.don3.sync.domain.sync.dto.GetSnapshotResponse
import com.don3.sync.domain.sync.dto.InsertSnapshotRequest
import com.don3.sync.service.SyncService
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/sync")
class SyncController(
    val syncService: SyncService
) {
    @GetMapping("/snapshots/latest")
    fun getLatestSnapshot(@AuthenticationPrincipal user: User): ResponseEntity<ApiResponse<GetSnapshotResponse>> {
        val snapshot = this.syncService.getLatestSnapshot(user)
        return ResponseEntity.ok(ApiResponse.success(snapshot))
    }

    @PostMapping("/snapshots/")
    fun createSnapshot(
        @RequestBody request: InsertSnapshotRequest,
        @AuthenticationPrincipal user: User
    ): ResponseEntity<ApiResponse<Unit>> {
        this.syncService.insertSnapshot(request, user)
        return ResponseEntity.ok(ApiResponse.success(Unit))
    }
}