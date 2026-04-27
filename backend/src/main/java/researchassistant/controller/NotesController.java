package researchassistant.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import researchassistant.model.Note;
import researchassistant.service.NotesService;
import researchassistant.dto.NoteRequest;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
public class NotesController {

    @Autowired
    private NotesService notesService;

    /**
     * Resolves the authenticated user's email from either:
     *   1. An active OAuth2 session (Google / GitHub login)
     *   2. The X-User-Email request header sent by the frontend after custom form-login
     *
     * The OAuth2 session is always preferred; the header is only a fallback for
     * users who signed in via email+password (where Spring Security does not
     * establish an OAuth2 principal).
     */
    private String resolveEmail(OAuth2User principal, String headerEmail) {
        // 1. Prefer the OAuth2 session principal (cannot be spoofed from the client side)
        if (principal != null) {
            Map<String, Object> attrs = principal.getAttributes();
            if (attrs.get("email") != null) return attrs.get("email").toString();
            if (attrs.get("sub") != null)   return attrs.get("sub").toString();
        }
        // 2. Fall back to the header value set by the frontend after custom login
        if (headerEmail != null && !headerEmail.isBlank()) {
            return headerEmail.trim();
        }
        return null;
    }

    @PostMapping
    public ResponseEntity<?> createNote(
            @RequestBody NoteRequest request,
            @AuthenticationPrincipal OAuth2User principal,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail) {

        String email = resolveEmail(principal, headerEmail);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated.");
        }

        System.out.println("Creating note for user: " + email + " | title: " + request.getTitle());
        return ResponseEntity.ok(notesService.createNote(request, email));
    }

    @GetMapping("/my-notes")
    public ResponseEntity<?> getMyNotes(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail) {

        String email = resolveEmail(principal, headerEmail);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated.");
        }
        return ResponseEntity.ok(notesService.getNotesByUser(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getNoteById(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User principal,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail) {

        String email = resolveEmail(principal, headerEmail);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated.");
        }
        return ResponseEntity.ok(notesService.getNoteByIdAndUser(id, email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNote(
            @PathVariable Long id,
            @RequestBody NoteRequest request,
            @AuthenticationPrincipal OAuth2User principal,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail) {

        String email = resolveEmail(principal, headerEmail);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated.");
        }
        System.out.println("Updating note " + id + " for user: " + email);
        return ResponseEntity.ok(notesService.updateNote(id, request, email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(
            @PathVariable Long id,
            @AuthenticationPrincipal OAuth2User principal,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail) {

        String email = resolveEmail(principal, headerEmail);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated.");
        }
        notesService.deleteNoteForUser(id, email);
        return ResponseEntity.noContent().build();
    }
}
