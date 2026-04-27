package researchassistant.service;

import researchassistant.dto.ResearchRequest;
import researchassistant.dto.GeminiResponse;
import researchassistant.model.ChatHistory;
import researchassistant.repository.ChatHistoryRepository;

import org.springframework.web.multipart.MultipartFile;
import java.util.Base64;

import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;

@Service
public class ResearchService {
    @Value("${gemini.api.key}")
    private String geminiKey;
//
    @Value("${gemini.api.url}")
    private String geminiUrl;

    private final WebClient webClient;

    private ObjectMapper objectMapper;
    private final ChatHistoryRepository chatHistoryRepository;

public ResearchService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper, ChatHistoryRepository chatHistoryRepository) {
    this.webClient = webClientBuilder.build();
    this.objectMapper = objectMapper;
    this.chatHistoryRepository = chatHistoryRepository;
}

    public String processContent(ResearchRequest request, String userEmail) {

//        Build the prompt
        String prompt = buildPrompt(request);

        //Query the AI model API
        Map<String,Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts",new Object[]{
                                Map.of("text",prompt)
                        })
                }
        );
//
        String response = webClient.post()
                .uri(geminiUrl + geminiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        String responseText = extractTextFromResponse(response);
        
        ChatHistory history = new ChatHistory();
        String title = request.getContent().length() > 50 ? request.getContent().substring(0, 50) + "..." : request.getContent();
        history.setUserEmail(userEmail);
        history.setTitle(title);
        history.setType("General Chat");
        history.setResponse(responseText);
        chatHistoryRepository.save(history);
        
        return responseText;
    }
    private String extractTextFromResponse(String response){
        try{
            GeminiResponse geminiResponse = objectMapper.readValue(response , GeminiResponse.class);
            if(geminiResponse.getCandidates() != null && !geminiResponse.getCandidates().isEmpty()){
                GeminiResponse.Candidate firstCandidate = geminiResponse.getCandidates().get(0);

                if(firstCandidate.getContent() != null && firstCandidate.getContent().getParts() != null &&
                !firstCandidate.getContent().getParts().isEmpty()){
                    return firstCandidate.getContent().getParts().get(0).getText();
                }
            }
            return "No content found in response";
        }catch(Exception e){
            return "Error Parsing: "+ e.getMessage();
        }
    }

    public String processImage(MultipartFile image, String operation, String userEmail) throws Exception {
        String base64Image = Base64.getEncoder().encodeToString(image.getBytes());
        String mimeType = image.getContentType();
        if (mimeType == null) {
            mimeType = "image/jpeg";
        }

        boolean isPdf = "application/pdf".equals(mimeType);
        String subject = isPdf ? "document" : "image";

        String promptText = "";
        if ("Summarize".equalsIgnoreCase(operation)) {
            promptText = "Provide a clear and concise summary of this " + subject + ".";
        } else if ("chat".equalsIgnoreCase(operation)) {
            promptText = "Analyze this " + subject + " and answer any questions if provided.";
        } else {
            promptText = "Analyze this " + subject + ".";
        }

        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text", promptText),
                                Map.of("inline_data", Map.of(
                                        "mime_type", mimeType,
                                        "data", base64Image
                                ))
                        })
                }
        );

        String response = webClient.post()
                .uri(geminiUrl + geminiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        String responseText = extractTextFromResponse(response);

        ChatHistory history = new ChatHistory();
        String filename = image.getOriginalFilename();
        history.setUserEmail(userEmail);
        history.setTitle(filename != null && !filename.isEmpty() ? filename : "Uploaded " + subject);
        history.setType(isPdf ? "Document Summary" : "Image Analysis");
        history.setResponse(responseText);
        history.setFileData(image.getBytes());
        history.setMimeType(mimeType);
        chatHistoryRepository.save(history);

        return responseText;
    }
//
    public String generateMindMap(String content) {
        String prompt = """
                Create a clear, well-structured mind map from the given notes.
                
                Instructions:
                - Output MUST be a valid Mermaid mindmap diagram
                - Start strictly with the keyword: mindmap
                - Do NOT include any text, explanation, or code block formatting before or after
                - Use proper indentation to represent hierarchy
                
                Structure Rules:
                - Use one central root topic summarizing the overall content
                - Extract 3–6 main topics from the notes
                - Under each main topic, add relevant subtopics
                - Keep hierarchy depth to a maximum of 3–4 levels
                - Ensure the structure is balanced and easy to read
                
                Formatting Rules:
                - Use short, concise phrases (max 4–6 words per node)
                - Avoid long sentences
                - Use emojis where appropriate to improve visual clarity (e.g., 📊, 🧠, ⚙️, 💻)
                - Avoid repetition
                - Group related ideas logically
                
                Output Format Example:
                mindmap
                  Root Topic
                    🧠 Main Topic 1
                      Subtopic A
                      Subtopic B
                    📊 Main Topic 2
                      Subtopic A
                        Sub-subtopic
                
                Notes:
                """ + "\"\"\"\n" + content + "\n\"\"\"";

        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );

        String response = webClient.post()
                .uri(geminiUrl + geminiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return extractTextFromResponse(response);
    }

    public String generateInfographic(String content) {
        String prompt = "You are an infographic generator. Produce a single self-contained HTML infographic based on the provided notes.\n\n" +
                "LAYOUT:\n" +
                "- Total width: 680px, height: auto\n" +
                "- Background: #111113\n" +
                "- Three vertical sections:\n" +
                "  1. HEADER — topic title + one-line insight (Bg #0e0e10, pad 28px 32px; Title 22px #e8e8f4; Insight 13px #606078 mt-6px; border-bottom 0.5px solid #1e1e22)\n" +
                "  2. STATS ROW — 3 big number callouts (Bg #0f0f12, pad 20px 32px, flex gap 16px; Card bg #161618, border 0.5px solid #222226, radius 8px, pad 16px; Number 28px #e0e0f0; Label 11px #505068 mt-4px; Context 11px #383850 mt-2px)\n" +
                "  3. MAIN BODY — left column 60% + right column 40% (flex gap 24px, pad 24px 32px)\n" +
                "     - Left: 3-5 process/timeline steps. Section label 10px #383850 uppercase letter-spacing 0.08em mb-14px. Step flex gap 12px. Circle 22px bg #1a1a20 border 0.5px solid #2e2e38 #707088 text 11px. Title 12px #c0c0d8. Body 11px #585870 line-height 1.6 mt-2px. Connector line 1px solid #1e1e24 height 16px margin-left 11px.\n" +
                "     - Right: Two compared aspects stacked gap 10px. Card bg #141418 border-left 2px solid #383848 radius 0 6px 6px 0 pad 12px 14px. Label 10px #505068 mb-4px. Details 12px #a0a0b8 line-height 1.6.\n" +
                "  4. FOOTER ROW — 3-4 key takeaway pills (Bg #0e0e10 pad 16px 32px flex gap 8px border-top 0.5px solid #1a1a1e. Pill bg #161618 border 0.5px solid #222226 radius 20px pad 5px 14px 11px #707088 text).\n\n" +
                "TYPOGRAPHY: Font system-ui, sans-serif. Grayscale ONLY.\n\n" +
                "OUTPUT: Return ONLY a single raw HTML fragment. No DOCTYPE, no <html>, no <head>, no <body> tags. No external libraries or fonts. No markdown, no explanation, no code fences. Just the raw HTML with inline styles only.\n\n" +
                "Notes content:\n" + content;

        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );

        String response = webClient.post()
                .uri(geminiUrl + geminiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return extractTextFromResponse(response);
    }

    public String generateQuiz(String content) {
        String prompt = "Create a 10-question quiz based on the following notes. " +
                "Return ONLY a valid JSON array (no markdown, no code blocks, no extra text) in this exact format:\n" +
                "[\n" +
                "  {\n" +
                "    \"question\": \"Question text here?\",\n" +
                "    \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n" +
                "    \"answer\": \"Option A\",\n" +
                "    \"explanation\": \"Brief explanation why this is correct.\"\n" +
                "  }\n" +
                "]\n\n" +
                "Notes content:\n" + content;

        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );

        String response = webClient.post()
                .uri(geminiUrl + geminiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return extractTextFromResponse(response);
    }

    public String processGithubRepo(String repoUrl, String userEmail) {
        String[] parts = repoUrl.split("github.com/");
        if (parts.length < 2) {
            return "Invalid GitHub URL. Must be in format https://github.com/owner/repo";
        }
        String repoPath = parts[1];
        if (repoPath.endsWith("/")) {
            repoPath = repoPath.substring(0, repoPath.length() - 1);
        }
        
        String readmeUrl = "https://raw.githubusercontent.com/" + repoPath + "/main/README.md";
        String readmeContent;
        try {
            readmeContent = webClient.get()
                    .uri(readmeUrl)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (Exception e) {
            try {
                // fallback to master branch
                readmeUrl = "https://raw.githubusercontent.com/" + repoPath + "/master/README.md";
                readmeContent = webClient.get()
                        .uri(readmeUrl)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();
            } catch (Exception ex) {
                return "Error fetching README from GitHub. Ensure the repository exists and is public.";
            }
        }

        String prompt = "Summarize the following GitHub repository based on its README. Provide clear headings for: Tech Stack, Purpose/About, and Key Features.\n\n" + readmeContent;

        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );

        String response = webClient.post()
                .uri(geminiUrl + geminiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        String responseText = extractTextFromResponse(response);

        ChatHistory history = new ChatHistory();
        history.setUserEmail(userEmail);
        history.setTitle(repoPath + " architecture deep dive");
        history.setType("GitHub Analysis");
        history.setResponse(responseText);
        chatHistoryRepository.save(history);

        return responseText;
    }

    private String buildPrompt(ResearchRequest request){
        if (request.getOperation() == null || request.getOperation().isBlank()) {
            throw new IllegalArgumentException("operation must not be null or empty");
        }
        StringBuilder prompt= new StringBuilder();
        switch(request.getOperation()){
            case "chat":
                prompt.append("Answer the following query clearly and concisely:\n\n");
                break;
            case "Summarize":
                prompt.append("Provide a clear and concise summary of the following text in a few sentence: \n\n");
                break;
            case "Suggest":
                prompt.append("Based on the following content : suggest related topics and further reading. Format the response with clear heading and bullet points:\n\n ");
                break;
            default:
                throw new IllegalArgumentException("Unknown Operation: "+ request.getOperation());
        }
        prompt.append(request.getContent());
        return prompt.toString();
    }

}
