package researchassistant.service;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import researchassistant.model.User;
import researchassistant.model.UserRepository;
import researchassistant.dto.SignupRequest;
import researchassistant.dto.LoginRequest;

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

    public String login(LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return "Error: Email and password are required!";
        }
        Optional<User> optionalUser = userRepository.findById(request.getEmail());

        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            if (user.getPassword().equals(request.getPassword())) {
                return "Login successful! Welcome " + user.getName();
            } else {
                return "Error: Incorrect password!";
            }
        }
        return "Error: User not found!";
    }
}
