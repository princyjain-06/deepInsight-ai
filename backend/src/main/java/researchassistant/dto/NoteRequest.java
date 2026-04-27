package researchassistant.dto;

import lombok.Data;

@Data
public class NoteRequest {
    private String email;
    private String title;
    private String content;
    private String media;
}
