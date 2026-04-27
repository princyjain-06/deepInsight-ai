package researchassistant.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import researchassistant.model.ChatHistory;
import researchassistant.repository.ChatHistoryRepository;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/research")
@AllArgsConstructor
public class HistoryController {

    private final ChatHistoryRepository chatHistoryRepository;

    @GetMapping("/history")
    public ResponseEntity<List<ChatHistory>> getHistory(
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            if (userEmail == null || userEmail.isBlank()) {
                // No identity – return empty list rather than leaking everyone's data
                return ResponseEntity.ok(Collections.emptyList());
            }
            List<ChatHistory> items = chatHistoryRepository
                    .findByUserEmailOrderByCreatedAtDesc(userEmail);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/history/{id}/file")
    public ResponseEntity<byte[]> getHistoryFile(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        ChatHistory history = chatHistoryRepository.findById(id).orElse(null);
        if (history == null || history.getFileData() == null) {
            return ResponseEntity.notFound().build();
        }
        // Ownership check: only return the file if it belongs to the requesting user
        if (userEmail != null && !userEmail.isBlank() && !userEmail.equals(history.getUserEmail())) {
            return ResponseEntity.status(403).build();
        }
        String mimeType = history.getMimeType() != null ? history.getMimeType() : "application/octet-stream";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, mimeType)
                .body(history.getFileData());
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<Void> deleteHistory(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            ChatHistory history = chatHistoryRepository.findById(id).orElse(null);
            if (history == null) return ResponseEntity.notFound().build();
            // Ownership check: only allow the owner to delete
            if (userEmail != null && !userEmail.isBlank() && !userEmail.equals(history.getUserEmail())) {
                return ResponseEntity.status(403).build();
            }
            chatHistoryRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
