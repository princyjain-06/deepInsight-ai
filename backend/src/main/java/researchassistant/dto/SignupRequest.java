package researchassistant.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;

@Data
public class SignupRequest {

    private String name;
    @Email
    private String email;
    private String password;
    private String role;

}