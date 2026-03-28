package researchassistant.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
public class ChatHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    
    private String type; // e.g., "General Chat", "Document Summary", "GitHub Analysis"
    
    @Column(columnDefinition = "TEXT")
    private String response; // Optional: store the AI's response

    @Lob
    @Column(columnDefinition="LONGBLOB")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private byte[] fileData;

    private String mimeType;

    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
