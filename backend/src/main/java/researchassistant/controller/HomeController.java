package researchassistant.controller;

import researchassistant.service.ResearchService;
import researchassistant.dto.ResearchRequest;
import researchassistant.dto.GithubRequest;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/research")
@CrossOrigin(origins = "*")
@AllArgsConstructor
public class HomeController {
    private final ResearchService researchService;

    @PostMapping("/process")
    public ResponseEntity<?> processContent(@RequestBody ResearchRequest request) {
        try {
            return ResponseEntity.ok(researchService.processContent(request));
        } catch (Exception e) {
            e.printStackTrace(); // logs real error
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }
    @PostMapping("/process-image")
    public ResponseEntity<?> processImage(@RequestParam("image") org.springframework.web.multipart.MultipartFile image,
                                          @RequestParam(value = "operation", defaultValue = "Summarize") String operation) {
        try {
            return ResponseEntity.ok(researchService.processImage(image, operation));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    @PostMapping("/github")
    public ResponseEntity<?> processGithub(@RequestBody GithubRequest request) {
        try {
            return ResponseEntity.ok(researchService.processGithubRepo(request.getUrl()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }
}
