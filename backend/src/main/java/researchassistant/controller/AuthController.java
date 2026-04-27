package researchassistant.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import researchassistant.model.User;
import researchassistant.dto.SignupRequest;
import researchassistant.dto.LoginRequest;
import researchassistant.service.AuthService;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
@AllArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        try {

            String response = authService.signup(request);

            if (response.startsWith("Error")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", response));
            }

            return ResponseEntity.ok(
                    Map.of("message", response));

        } catch (Exception e) {

            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Server error"));

        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Map<String, Object> result = authService.login(request);

            if (!(Boolean) result.get("success")) {
                return ResponseEntity.status(401).body(result);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Server error"));
        }
    }
}
