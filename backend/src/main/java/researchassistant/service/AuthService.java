package researchassistant.service;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import researchassistant.model.User;
import researchassistant.model.UserRepository;
import researchassistant.dto.SignupRequest;
import researchassistant.dto.LoginRequest;

import java.util.Map;
import java.util.Optional;

@Service
@AllArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    public String signup(SignupRequest request) {

        if (request.getEmail() == null || request.getPassword() == null) {
            return "Error: Email and password are required!";
        }

        Optional<User> existingUser = userRepository.findById(request.getEmail());
        if (existingUser.isPresent()) {
            return "Error: User with this email already exists!";
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setRole(request.getRole());

        userRepository.save(user);

        return "Signup successful!";
    }

    /**
     * Returns a result map on success with keys: success, message, email, name.
     * On failure, returns a map with success=false and a message.
     */
    public Map<String, Object> login(LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return Map.of("success", false, "message", "Error: Email and password are required!");
        }
        Optional<User> optionalUser = userRepository.findById(request.getEmail());

        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            if (user.getPassword().equals(request.getPassword())) {
                return Map.of(
                    "success", true,
                    "message", "Login successful! Welcome " + user.getName(),
                    "email", user.getEmail(),
                    "name", user.getName()
                );
            } else {
                return Map.of("success", false, "message", "Error: Incorrect password!");
            }
        }
        return Map.of("success", false, "message", "Error: User not found!");
    }
}
