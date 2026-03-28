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

    public String processContent(ResearchRequest request) {

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
//        //Parse the response
//        //Return response
//
        String responseText = extractTextFromResponse(response);
        
        ChatHistory history = new ChatHistory();
        String title = request.getContent().length() > 50 ? request.getContent().substring(0, 50) + "..." : request.getContent();
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

    public String processImage(MultipartFile image, String operation) throws Exception {
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
        history.setTitle(filename != null && !filename.isEmpty() ? filename : "Uploaded " + subject);
        history.setType(isPdf ? "Document Summary" : "Image Analysis");
        history.setResponse(responseText);
        history.setFileData(image.getBytes());
        history.setMimeType(mimeType);
        chatHistoryRepository.save(history);

        return responseText;
    }
//
    public String processGithubRepo(String repoUrl) {
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
