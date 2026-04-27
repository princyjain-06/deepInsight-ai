package researchassistant.controller;

import researchassistant.service.ResearchService;
import researchassistant.dto.ResearchRequest;
import researchassistant.dto.GithubRequest;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/research")
@AllArgsConstructor
public class HomeController {
    private final ResearchService researchService;

    @PostMapping("/process")
    public ResponseEntity<?> processContent(
            @RequestBody ResearchRequest request,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            return ResponseEntity.ok(researchService.processContent(request, userEmail));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    @PostMapping("/process-image")
    public ResponseEntity<?> processImage(
            @RequestParam("image") org.springframework.web.multipart.MultipartFile image,
            @RequestParam(value = "operation", defaultValue = "Summarize") String operation,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            return ResponseEntity.ok(researchService.processImage(image, operation, userEmail));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    @PostMapping("/github")
    public ResponseEntity<?> processGithub(
            @RequestBody GithubRequest request,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            return ResponseEntity.ok(researchService.processGithubRepo(request.getUrl(), userEmail));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    @PostMapping("/mindmap")
    public ResponseEntity<?> processMindMap(@RequestBody ResearchRequest request) {
        System.out.println("Processing mindmap for content length: " + (request.getContent() != null ? request.getContent().length() : 0));
        try {
            String result = researchService.generateMindMap(request.getContent());
            System.out.println("Mindmap generated successfully");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error generating mindmap: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    @PostMapping("/quiz")
    public ResponseEntity<?> generateQuiz(@RequestBody ResearchRequest request) {
        System.out.println("Generating quiz for content length: " + (request.getContent() != null ? request.getContent().length() : 0));
        try {
            String result = researchService.generateQuiz(request.getContent());
            System.out.println("Quiz generated successfully");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error generating quiz: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    @PostMapping("/infographic")
    public ResponseEntity<?> generateInfographic(@RequestBody ResearchRequest request) {
        System.out.println("Generating infographic for content length: " + (request.getContent() != null ? request.getContent().length() : 0));
        try {
            String result = researchService.generateInfographic(request.getContent());
            System.out.println("Infographic generated successfully");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error generating infographic: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }
}
