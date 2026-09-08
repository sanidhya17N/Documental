package documental_backend.service;

import documental_backend.config.AppProperties;
import documental_backend.entity.DocumentMetadata;
import documental_backend.entity.DocumentStatus;
import documental_backend.exception.DocumentProcessingException;
import documental_backend.repository.DocumentMetaDataRepo;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DocumentIngestionService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentIngestionService.class);
    private final VectorStore vectorStore;
    private final DocumentMetaDataRepo documentMetaDataRepo;
    private final AppProperties appProperties;
    private final OverlappingTokenTextSplitter overlappingTokenTextSplitter;

    public int ingest(DocumentMetadata documentMetadata, List<Document> parseDocuments) {

        logger.info("Ingesting document [id={}, name={}, pages={}]", documentMetadata.getId(), documentMetadata.getFileName(), parseDocuments.size());

        try {

            documentMetadata.setStatus(DocumentStatus.PROCESSING);
            documentMetadata.setTotalPages(parseDocuments.size());

            List<Document> chunks = overlappingTokenTextSplitter.split(parseDocuments);

            logger.info(
                    "Chunked document [id={}, chunks={}, chunkSize={}, overlap={}]",
                    documentMetadata.getId(),
                    chunks.size(),
                    appProperties.getRag().getChunkSize(),
                    appProperties.getRag().getChunkOverlap()
            );

            if (chunks.isEmpty()) {
                documentMetadata.setStatus(DocumentStatus.FAILED);
                documentMetadata.setErrorMessage("Document appears to be empty or unscannable");
                documentMetaDataRepo.save(documentMetadata);
                return 0;
            }

            List<Document> enrichedChunks = new ArrayList<>();
            for (int i = 0; i < chunks.size(); i++) {
                Document chunk = chunks.get(i);
                Map<String, Object> enrichedMetadata = new HashMap<>(chunk.getMetadata());
                enrichedMetadata.put("documentId", documentMetadata.getId().toString());
                enrichedMetadata.put("fileName", documentMetadata.getFileName());
                enrichedMetadata.put("contentType", documentMetadata.getContentType());
                enrichedMetadata.put("chunkIndex", i);
                enrichedMetadata.put("chunkSize", appProperties.getRag().getChunkSize());
                enrichedMetadata.put("chunkOverlap", appProperties.getRag().getChunkOverlap());

                Object pageNumber = chunk.getMetadata().get("page_number");
                if (pageNumber == null) {
                    pageNumber = chunk.getMetadata().get("pageNumber");
                }
                if (pageNumber != null) {
                    enrichedMetadata.put("pageNumber", pageNumber);
                }
                enrichedChunks.add(new Document(chunk.getText(), enrichedMetadata));
            }

            logger.info("Writing {} vector chunks to PgVectorStore for document: {}", enrichedChunks.size(), documentMetadata.getFileName());
            vectorStore.add(enrichedChunks);

            documentMetadata.setStatus(DocumentStatus.INDEXED);
            documentMetadata.setTotalChunks(enrichedChunks.size());
            documentMetadata.setErrorMessage(null);
            documentMetaDataRepo.save(documentMetadata);
            logger.info("Successfully indexed document [id={}, name={}, chunks={}]", documentMetadata.getId(), documentMetadata.getFileName(), enrichedChunks.size());

            return enrichedChunks.size();
        } catch (Exception ex) {
            logger.error("Failed to ingest document into vector store: {}", documentMetadata.getFileName(), ex);
            documentMetadata.setStatus(DocumentStatus.FAILED);
            documentMetadata.setErrorMessage(ex.getMessage());
            documentMetaDataRepo.save(documentMetadata);
            throw new DocumentProcessingException("Failed to index document: " + ex.getMessage(), ex);
        }
    }

}
