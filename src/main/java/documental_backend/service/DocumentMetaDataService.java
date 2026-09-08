package documental_backend.service;

import documental_backend.dto.*;
import documental_backend.entity.DocumentMetadata;
import documental_backend.entity.DocumentStatus;
import documental_backend.exception.DocumentProcessingException;
import documental_backend.exception.ResourceNotFoundException;
import documental_backend.repository.DocumentMetaDataRepo;
import documental_backend.security.SecurityUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentMetaDataService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentMetaDataService.class);

    private final DocumentMetaDataRepo documentMetaDataRepo;
    private final DocumentIngestionService documentIngestionService;
    private final DocumentParseService parseService;
    private final JdbcTemplate jdbcTemplate;
    private final ModelMapper modelMapper;
    private final ObjectMapper objectMapper;

    public DocumentResponseDto processAndUpload(MultipartFile file) {
        UUID userId = SecurityUtils.currentUserId();
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        DocumentMetadata documentMetadata = DocumentMetadata.builder()
                .userId(userId)
                .fileName(fileName)
                .contentType(contentType)
                .fileSize(file.getSize())
                .createdAt(LocalDateTime.now())
                .status(DocumentStatus.UPLOADING)
                .updatedAt(LocalDateTime.now())
                .build();

        documentMetadata = documentMetaDataRepo.save(documentMetadata);
        int chunksCreated;

        try {
            List<Document> parsedDocs = parseService.parse(file);
            chunksCreated = documentIngestionService.ingest(documentMetadata, parsedDocs);
        } catch (DocumentProcessingException e) {
            logger.info("Document metadata deleting due to fail processing");
            documentMetaDataRepo.delete(documentMetadata);
            throw e;
        }

        return DocumentResponseDto.builder()
                .id(documentMetadata.getId())
                .fileName(documentMetadata.getFileName())
                .fileSize(documentMetadata.getFileSize())
                .chunkCreated(chunksCreated)
                .status(documentMetadata.getStatus())
                .message("Document successfully Processed and Indexed")
                .build();
    }

    public List<DocumentResponseDto> uploadMultipleDocuments(List<MultipartFile> files) {
        List<DocumentResponseDto> responseDtos = new ArrayList<>();
        for (MultipartFile file : files) {
            responseDtos.add(processAndUpload(file));
        }
        return responseDtos;
    }

    public List<DocumentMetadataDto> getAllDocuments() {
        UUID userId = SecurityUtils.currentUserId();
        return documentMetaDataRepo.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(doc -> modelMapper.map(doc, DocumentMetadataDto.class))
                .toList();
    }

    public DocumentMetadataDto getDocumentById(UUID id) {
        DocumentMetadata documentMetadata = requireOwnedDocument(id);
        return modelMapper.map(documentMetadata, DocumentMetadataDto.class);
    }

    public List<CitationDto> getDocumentChunks(UUID id) {
        DocumentMetadata documentMetadata = requireOwnedDocument(id);

        String sql = """
                SELECT content, metadata
                FROM vector_store
                WHERE metadata->>'documentId' = ?
                  AND metadata->>'userId' = ?
                """;

        List<CitationDto> chunks = jdbcTemplate.query(sql, (rs, rowNum) -> {
            String content = rs.getString("content");
            String metadataJson = rs.getString("metadata");
            Map<String, Object> meta = Map.of();
            try {
                if (metadataJson != null && !metadataJson.isBlank()) {
                    meta = objectMapper.readValue(metadataJson, new TypeReference<>() {});
                }
            } catch (Exception e) {
                logger.warn("Could not parse chunk metadata for document {}: {}", id, e.getMessage());
            }

            Integer chunkIndex = null;
            Object rawIndex = meta.get("chunkIndex");
            if (rawIndex instanceof Number n) {
                chunkIndex = n.intValue();
            } else if (rawIndex != null) {
                try {
                    chunkIndex = Integer.parseInt(rawIndex.toString());
                } catch (NumberFormatException ignore) {
                }
            }

            Integer pageNumber = null;
            Object rawPage = meta.get("pageNumber");
            if (rawPage == null) {
                rawPage = meta.get("page_number");
            }
            if (rawPage instanceof Number n) {
                pageNumber = n.intValue();
            } else if (rawPage != null) {
                try {
                    pageNumber = Integer.parseInt(rawPage.toString());
                } catch (NumberFormatException ignore) {
                }
            }

            return CitationDto.builder()
                    .documentId(documentMetadata.getId())
                    .fileName(documentMetadata.getFileName())
                    .chunkIndex(chunkIndex)
                    .pageNumber(pageNumber)
                    .snippet(content)
                    .similarityScore(null)
                    .metadata(meta)
                    .build();
        }, id.toString(), documentMetadata.getUserId().toString());

        // Fallback for older chunks that lack userId metadata but belong to this document
        if (chunks.isEmpty()) {
            chunks = jdbcTemplate.query("""
                    SELECT content, metadata
                    FROM vector_store
                    WHERE metadata->>'documentId' = ?
                    """, (rs, rowNum) -> {
                String content = rs.getString("content");
                String metadataJson = rs.getString("metadata");
                Map<String, Object> meta = Map.of();
                try {
                    if (metadataJson != null && !metadataJson.isBlank()) {
                        meta = objectMapper.readValue(metadataJson, new TypeReference<>() {});
                    }
                } catch (Exception ignored) {
                }
                Integer chunkIndex = meta.get("chunkIndex") instanceof Number n ? n.intValue() : null;
                Integer pageNumber = meta.get("pageNumber") instanceof Number n ? n.intValue() : null;
                return CitationDto.builder()
                        .documentId(documentMetadata.getId())
                        .fileName(documentMetadata.getFileName())
                        .chunkIndex(chunkIndex)
                        .pageNumber(pageNumber)
                        .snippet(content)
                        .build();
            }, id.toString());
        }

        chunks.sort(Comparator.comparing(
                c -> c.getChunkIndex() == null ? Integer.MAX_VALUE : c.getChunkIndex()
        ));
        logger.info("Listed {} chunks for document {} (user={})", chunks.size(), id, documentMetadata.getUserId());
        return chunks;
    }

    @Transactional
    public void deleteDocument(UUID id) {
        DocumentMetadata documentMetadata = requireOwnedDocument(id);
        documentMetaDataRepo.delete(documentMetadata);
        try {
            String deleteVectorsSql = "DELETE FROM vector_store WHERE metadata->>'documentId' = ?";
            int deletedCount = jdbcTemplate.update(deleteVectorsSql, id.toString());
            logger.info("Deleted {} vector chunks for document id {} ", deletedCount, id);
        } catch (Exception e) {
            logger.warn("Could not delete vectors from vector store directly: {}", e.getMessage());
        }
    }

    public DocumentMetadata requireOwnedDocument(UUID id) {
        UUID userId = SecurityUtils.currentUserId();
        return documentMetaDataRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document with given id not found !!"));
    }
}
