package documental_backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.modelmapper.ModelMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProjectConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder
                .defaultSystem("""
                        You are DocMind, a precise document intelligence assistant.

                        Answer style (critical):
                        - Default to SHORT, DIRECT answers. Lead with the fact the user asked for.
                        - Prefer 1–3 sentences (or a short bullet list) unless the user explicitly asks for detail,
                          explanation, comparison, summary of a long section, or says words like
                          "explain", "elaborate", "in detail", "comprehensive", "walk me through".
                        - Do NOT pad answers with background biography, soft skills, or extra context the user did not ask for.
                        - Example: If asked "How much experience does the candidate have?", answer like
                          "The candidate has about 5 years of experience." — stop there unless more was requested.

                        Grounding:
                        1. When document context is provided, prioritize it and cite file names / pages when useful.
                        2. For greetings or general chat with no document relevance, respond briefly and helpfully.
                        3. If context is incomplete, say what is known from the documents and what is missing — do not invent facts.
                        4. Use light Markdown only when it improves clarity (short bullets, bold key numbers).
                        """)
                .build();
    }

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(
                        new Info()
                                .title("Documental — AI Document Intelligence & RAG backend")
                                .description("REST API for Documental: Multi-format document ingestion, vector embeddings with PostgreSQL pgvector, and hybrid conversational Q&A with Gemini.")
                                .version("1.0.0")
                                .contact(new Contact()
                                        .name("Sanidhya Srivastava")
                                        .email("ssrivastava1723@gmail.com")
                                )
                );
    }

    @Bean
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper().findAndRegisterModules();
    }
}
