package com.backendlab.engine;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/_system")
public class SystemMapController {

    private final DependencyHealthService dependencyHealthService;

    public SystemMapController(DependencyHealthService dependencyHealthService) {
        this.dependencyHealthService = dependencyHealthService;
    }

    @GetMapping("/dependencies")
    public ResponseEntity<List<DependencyStatus>> getDependencies() {
        return ResponseEntity.ok(dependencyHealthService.getDependencyStatuses());
    }
}
