package researchassistant.service;

import lombok.AllArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import researchassistant.model.User;
import researchassistant.model.UserRepository;

import java.util.Map;
import java.util.Optional;

@Service
@AllArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        
        return processOAuth2User(registrationId, oAuth2User);
    }

    private OAuth2User processOAuth2User(String registrationId, OAuth2User oAuth2User) {
        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = null;
        String name = null;

        if ("google".equalsIgnoreCase(registrationId)) {
            email = (String) attributes.get("email");
            name = (String) attributes.get("name");
        } else if ("github".equalsIgnoreCase(registrationId)) {
            email = (String) attributes.get("email");
            if (email == null) {
                // If email is private, we might use "login@github.com" as a fallback or handle differently
                String login = (String) attributes.get("login");
                email = login + "@github.com";
            }
            name = (String) attributes.get("name");
            if (name == null) {
                name = (String) attributes.get("login");
            }
        }

        if (email != null) {
            Optional<User> userOptional = userRepository.findById(email);
            User user;
            if (userOptional.isPresent()) {
                user = userOptional.get();
                user.setName(name);
            } else {
                user = new User();
                user.setEmail(email);
                user.setName(name);
                user.setRole("Student"); // Default role
                user.setPassword(""); // Password not needed for OAuth
            }
            userRepository.save(user);
        }

        return oAuth2User;
    }
}
