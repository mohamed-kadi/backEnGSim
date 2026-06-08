package com.backendlab.engine;

public record DependencyStatus(
        String id,
        String name,
        String role,
        String status,
        String detail
) {
}
