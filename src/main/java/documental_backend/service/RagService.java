package documental_backend.service;

import documental_backend.config.AppProperties;
import documental_backend.dto.*;
import documental_backend.exception.ResourceNotFoundException;
import documental_backend.repository.DocumentMetaDataRepo;
import documental_backend.security.SecurityUtils;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RagService {
    private static final Logger log = LoggerFactory.getLogger(RagService.class);

    private static final int CONCISE_TOP_K = 4;
    private static final int DETAILED_TOP_K = 8;
    /** Enough room for a short answer without cutting mid-sentence. */
    private static final int CONCISE_MAX_OUTPUT_TOKENS = 1024;
    private static final int DETAILED_MAX_OUTPUT_TOKENS = 2048;
    private static final int CONCISE_SNIPPET_CHARS = 500;
    private static final int DETAILED_SNIPPET_CHARS = 1200;

    private final VectorStore vectorStore;
    private final AppProperties appProperties;
    private final ChatClient chatClient;
    private final DocumentMetaDataRepo documentMetaDataRepo;


    public ChatResponseDto askQuestion(ChatRequestDto request) {
        long startTime = System.currentTimeMillis();
        boolean detailed = shouldAnswerInDetail(request);
        UUID userId = SecurityUtils.currentUserId();
        log.info("Processing query: '{}', userId={}, scoped documentId: {}, detailed={}",
                request.getQuestion(), userId, request.getDocumentId(), detailed);

        assertDocumentAccess(request.getDocumentId(), userId);

        Integer effectiveTopK = resolveTopK(request.getTopK(), detailed);
        long retrieveStart = System.currentTimeMillis();
        List<Document> similarDocuments = this.retrieveRelevantDocuments(
                request.getQuestion(), userId, request.getDocumentId(), effectiveTopK, request.getMinSimilarity());
        long retrieveMs = System.currentTimeMillis() - retrieveStart;

        List<CitationDto> citationDtos = similarDocuments.stream().map(this::mapToCitation).toList();
        String contextText = buildContextString(similarDocuments, detailed);
        String prompt = buildPrompt(request.getQuestion(), contextText, detailed);

        long llmStart = System.currentTimeMillis();
        String answer = this.chatClient.prompt()
                .user(prompt)
                .options(chatOptions(detailed))
                .call()
                .content();
        long llmMs = System.currentTimeMillis() - llmStart;

        long responseTime = System.currentTimeMillis() - startTime;
        log.info("Completed Q&A in {} ms (retrieve={} ms, llm={} ms, chunks={}, detailed={})",
                responseTime, retrieveMs, llmMs, citationDtos.size(), detailed);

        return ChatResponseDto.builder()
                .answer(answer)
                .conversationId(request.getConversationId() != null
                        ? request.getConversationId()
                        : UUID.randomUUID().toString())
                .citations(citationDtos)
                .responseTimeMs(responseTime)
                .build();
    }

    public Flux<String> streamQuestionAnswer(ChatRequestDto requestDto) {
        boolean detailed = shouldAnswerInDetail(requestDto);
        UUID userId = SecurityUtils.currentUserId();
        log.info("Streaming query: '{}', userId={}, detailed={}", requestDto.getQuestion(), userId, detailed);

        assertDocumentAccess(requestDto.getDocumentId(), userId);

        Integer effectiveTopK = resolveTopK(requestDto.getTopK(), detailed);
        long retrieveStart = System.currentTimeMillis();
        List<Document> relevantDocuments = retrieveRelevantDocuments(
                requestDto.getQuestion(),
                userId,
                requestDto.getDocumentId(),
                effectiveTopK,
                requestDto.getMinSimilarity()
        );
        log.info("Stream retrieve took {} ms, chunks={}",
                System.currentTimeMillis() - retrieveStart, relevantDocuments.size());

        String contextText = buildContextString(relevantDocuments, detailed);
        String userPrompt = buildPrompt(requestDto.getQuestion(), contextText, detailed);
        return chatClient.prompt()
                .user(userPrompt)
                .options(chatOptions(detailed))
                .stream()
                .content();
    }

    private GoogleGenAiChatOptions.Builder chatOptions(boolean detailed) {
        return GoogleGenAiChatOptions.builder()
                .temperature(0.2)
                .maxOutputTokens(detailed ? DETAILED_MAX_OUTPUT_TOKENS : CONCISE_MAX_OUTPUT_TOKENS);
    }

    private Integer resolveTopK(Integer requested, boolean detailed) {
        if (requested != null && requested > 0) {
            return requested;
        }
        int configured = appProperties.getRag().getTopK();
        if (detailed) {
            return Math.max(configured, DETAILED_TOP_K);
        }
        // Prefer fewer chunks for short answers — less context = faster generation
        return Math.min(configured, CONCISE_TOP_K);
    }

    private boolean shouldAnswerInDetail(ChatRequestDto request) {
        if (Boolean.TRUE.equals(request.getDetailed())) {
            return true;
        }
        if (Boolean.FALSE.equals(request.getDetailed())) {
            return false;
        }
        String q = request.getQuestion() == null ? "" : request.getQuestion().toLowerCase(Locale.ROOT);
        return q.contains("in detail")
                || q.contains("elaborate")
                || q.contains("explain")
                || q.contains("comprehensive")
                || q.contains("walk me through")
                || q.contains("break down")
                || q.contains("tell me more")
                || q.contains("summarize the")
                || q.contains("full summary");
    }

    private String buildPrompt(String question, String contextText, boolean detailed) {
        String style = detailed
                ? """
                  Answer style for THIS message: DETAILED.
                  - Provide a thorough, well-structured answer using the context.
                  - Include relevant supporting points, but stay grounded in the documents.
                  """
                : """
                  Answer style for THIS message: CONCISE.
                  - Answer the user's question in 1–3 complete sentences (or up to 5 short bullets if listing items).
                  - Put the direct answer first. Do not add unsolicited background or biography.
                  - Always finish your sentences — never stop mid-phrase.
                  - Only expand if the question cannot be answered briefly without being misleading.
                  """;

        if (contextText != null && !contextText.isBlank()) {
            return String.format("""
                    Document Context:
                    ---------------------
                    %s
                    ---------------------
                    User Message / Question: %s

                    Instructions:
                    - If the question relates to the document context, prioritize that context and cite sources when useful.
                    - If it is a greeting or general question unrelated to the documents, answer briefly without forcing document content.
                    - Do not invent facts that are not in the context.

                    %s
                    """, contextText, question, style);
        }

        return String.format("""
                User Message / Question:
                %s

                Instructions:
                - Respond helpfully and accurately.

                %s
                """, question, style);
    }

    private String buildContextString(List<Document> similarDocuments, boolean detailed) {
        if (similarDocuments == null || similarDocuments.isEmpty()) {
            return "";
        }

        int maxChars = detailed ? DETAILED_SNIPPET_CHARS : CONCISE_SNIPPET_CHARS;
        return similarDocuments.stream().map(doc -> {
            String fileName = (String) doc.getMetadata().getOrDefault("fileName", "Unknown File");
            Object page = doc.getMetadata().getOrDefault("pageNumber", "N/A");
            Object chunkIndex = doc.getMetadata().getOrDefault("chunkIndex", "N/A");
            String text = truncate(doc.getText(), maxChars);
            return String.format("[Source: %s | Page: %s | Chunk: %s]\n%s", fileName, page, chunkIndex, text);
        }).collect(Collectors.joining("\n\n---\n\n"));
    }

    private String truncate(String text, int maxChars) {
        if (text == null) {
            return "";
        }
        if (text.length() <= maxChars) {
            return text;
        }
        return text.substring(0, maxChars).trim() + "…";
    }

    public SearchResultDto searchSimilarChunks(SearchRequestDto request) {
        UUID userId = SecurityUtils.currentUserId();
        assertDocumentAccess(request.getDocumentId(), userId);
        List<Document> matchedDocs = retrieveRelevantDocuments(
                request.getQuery(), userId, request.getDocumentId(), request.getTopK(), request.getSimilaritySearch());
        List<CitationDto> citations = matchedDocs.stream().map(this::mapToCitation).toList();
        return SearchResultDto.builder()
                .query(request.getQuery())
                .totalMatches(citations.size())
                .matches(citations)
                .build();
    }

    private void assertDocumentAccess(UUID documentId, UUID userId) {
        if (documentId == null) {
            return;
        }
        if (!documentMetaDataRepo.existsByIdAndUserId(documentId, userId)) {
            throw new ResourceNotFoundException("Document with given id not found !!");
        }
    }

    private CitationDto mapToCitation(Document document) {
        Map<String, Object> meta = document.getMetadata();
        UUID docId = null;
        if (meta.get("documentId") != null) {
            try {
                docId = UUID.fromString(meta.get("documentId").toString());
            } catch (Exception ignore) {
            }
        }
        Integer chunkIndex = null;
        if (meta.get("chunkIndex") instanceof Number n) {
            chunkIndex = n.intValue();
        }

        Integer pageNumber = null;
        if (meta.get("pageNumber") instanceof Number n) {
            pageNumber = n.intValue();
        } else if (meta.get("page_number") instanceof Number n) {
            pageNumber = n.intValue();
        }

        Double score = null;
        if (meta.get("distance") instanceof Number n) {
            score = 1.0 - n.doubleValue();
        }
        return CitationDto.builder()
                .documentId(docId)
                .fileName((String) meta.getOrDefault("fileName", "Unknown"))
                .chunkIndex(chunkIndex)
                .pageNumber(pageNumber)
                .snippet(document.getText())
                .similarityScore(score)
                .metadata(meta)
                .build();
    }

    private List<Document> retrieveRelevantDocuments(
            @NotBlank(message = "Question cannot be empty") String query,
            UUID userId,
            UUID documentId,
            Integer topK,
            Double similaritySearch
    ) {
        int effectiveTopK = (topK != null && topK > 0) ? topK : appProperties.getRag().getTopK();
        double effectiveSimilarity = (similaritySearch != null)
                ? similaritySearch
                : appProperties.getRag().getSimilarityThreshold();

        SearchRequest.Builder searchRequestBuilder = SearchRequest.builder().query(query).topK(effectiveTopK);

        if (effectiveSimilarity > 0.0) {
            searchRequestBuilder.similarityThreshold(effectiveSimilarity);
        }

        FilterExpressionBuilder b = new FilterExpressionBuilder();
        Filter.Expression expression;
        if (documentId != null) {
            log.info("Filtering userId={} and documentId={}", userId, documentId);
            expression = b.and(
                    b.eq("userId", userId.toString()),
                    b.eq("documentId", documentId.toString())
            ).build();
        } else {
            log.info("Filtering userId={}", userId);
            expression = b.eq("userId", userId.toString()).build();
        }
        searchRequestBuilder.filterExpression(expression);

        try {
            List<Document> documents = vectorStore.similaritySearch(searchRequestBuilder.build());
            log.info("Retrieved {} chunks for query: '{}' (userId={}, scoped docId: {})",
                    documents.size(), query, userId, documentId);
            return documents;
        } catch (Exception e) {
            log.error("Similarity search failed for query: '{}'", query, e);
            return Collections.emptyList();
        }
    }
}
