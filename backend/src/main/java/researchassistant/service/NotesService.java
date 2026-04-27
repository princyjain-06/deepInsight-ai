package researchassistant.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import researchassistant.model.Note;
import researchassistant.model.User;
import researchassistant.model.UserRepository;
import researchassistant.repository.NotesRepository;
import researchassistant.dto.NoteRequest;

import java.util.List;

@Service
public class NotesService {

    @Autowired
    private NotesRepository notesRepository;

    @Autowired
    private UserRepository userRepository;

    public Note createNote(NoteRequest request, String authenticatedEmail) {
        User user = userRepository.findById(authenticatedEmail)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(authenticatedEmail);
                    newUser.setName("Demo User");
                    newUser.setRole("Student");
                    return userRepository.save(newUser);
                });

        Note note = new Note();
        note.setTitle(request.getTitle());
        note.setContent(request.getContent());
        note.setMediaContent(request.getMedia());
        note.setUser(user);

        return notesRepository.save(note);
    }

    public List<Note> getNotesByUser(String email) {
        return notesRepository.findByUserEmail(email);
    }

    // Securely get note by ID ensuring the requesting user owns it
    public Note getNoteByIdAndUser(Long id, String authenticatedEmail) {
        Note note = notesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found with id: " + id));
        
        if (!note.getUser().getEmail().equals(authenticatedEmail)) {
            throw new RuntimeException("Unauthorized: You do not own this note.");
        }
        return note;
    }

    public Note updateNote(Long id, NoteRequest request, String authenticatedEmail) {
        Note note = getNoteByIdAndUser(id, authenticatedEmail); // Validates ownership first
        
        if (request.getTitle() != null) {
            note.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            note.setContent(request.getContent());
        }
        if (request.getMedia() != null) {
            note.setMediaContent(request.getMedia());
        }

        return notesRepository.save(note);
    }

    public void deleteNoteForUser(Long id, String authenticatedEmail) {
        // Enforce ownership check before deleting
        Note note = getNoteByIdAndUser(id, authenticatedEmail); 
        notesRepository.delete(note);
    }
}
