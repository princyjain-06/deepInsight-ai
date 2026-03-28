package researchassistant.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpHeaders;
import researchassistant.model.ChatHistory;
import researchassistant.repository.ChatHistoryRepository;

import java.util.List;

@RestController
@RequestMapping("/api/research")
@CrossOrigin(origins = "*")
@AllArgsConstructor
public class HistoryController {

    private final ChatHistoryRepository chatHistoryRepository;

    @GetMapping("/history")
    public ResponseEntity<List<ChatHistory>> getHistory() {
        try {
            return ResponseEntity.ok(chatHistoryRepository.findAllByOrderByCreatedAtDesc());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/history/{id}/file")
    public ResponseEntity<byte[]> getHistoryFile(@PathVariable Long id) {
        ChatHistory history = chatHistoryRepository.findById(id).orElse(null);
        if (history != null && history.getFileData() != null) {
            String mimeType = history.getMimeType();
            if (mimeType == null) {
                mimeType = "application/octet-stream";
            }
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, mimeType)
                    .body(history.getFileData());
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/history/{id}")
    public ResponseEntity<Void> deleteHistory(@PathVariable Long id) {
        try {
            chatHistoryRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
