package com.backendlab.engine;

import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
@RestController
@RequestMapping("/api/_system/logs")
public class IncidentLogger {
    private final Queue<String> logs = new ConcurrentLinkedQueue<>();
    private static final int MAX_LOGS = 50;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss.SSS");

    public void log(String message) {
        String timestamp = java.time.LocalTime.now().format(formatter);
        String formattedMessage = String.format("[%s] %s", timestamp, message);
        logs.offer(formattedMessage);
        if (logs.size() > MAX_LOGS) {
            logs.poll();
        }
        System.out.println(formattedMessage); // Keep standard console output as well
    }

    @GetMapping
    public List<String> getLogs() {
        return new ArrayList<>(logs);
    }
}