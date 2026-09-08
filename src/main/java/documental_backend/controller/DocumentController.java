package documental_backend.controller;

import documental_backend.dto.ApiResponse;
import documental_backend.dto.*;
import documental_backend.service.DocumentMetaDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
@Tag(
        name = "Document Controller",
        description = "Handles all the REST operations for documents eg. Uploading, Fetching etc."
)
@RequiredArgsConstructor
public class DocumentController {


    private final DocumentMetaDataService documentMetaDataService;
    @PostMapping(value = "/upload" , consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Upload Pdfs, docs, and other file formats"
    )
    public ResponseEntity<ApiResponse<DocumentResponseDto>> uploadDocuments(@RequestParam MultipartFile file){
        DocumentResponseDto document = documentMetaDataService.processAndUpload(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<DocumentResponseDto>builder()
                        .success(true)
                        .data(document)
                        .message("File Uploaded and indexed Successfully")
                        .timestamp(LocalDateTime.now())
                        .build()

                );
    }

    //    list all uploaded documents
    @GetMapping
    @Operation(summary = "List all uploaded documents and their indexing status")
    public ResponseEntity<ApiResponse<List<DocumentMetadataDto>>> getAllDocuments(){
        java.util.List<DocumentMetadataDto> documents =documentMetaDataService.getAllDocuments();
        return ResponseEntity.ok(
                ApiResponse.<List<DocumentMetadataDto>>
                                builder()
                        .message("All documents is here")
                        .success(true)
                        .timestamp(LocalDateTime.now())
                        .data(documents)
                        .build()
        );
    }


    @GetMapping("/{id}")
    @Operation(summary = "Get metadata of a specific document by ID")
    public ResponseEntity<ApiResponse<DocumentMetadataDto>> getDocumentById(@PathVariable UUID id) {
        DocumentMetadataDto document = documentMetaDataService.getDocumentById(id);
        return ResponseEntity.ok(
                ApiResponse.<DocumentMetadataDto>
                                builder()
                        .message("Single document is here")
                        .success(true)
                        .timestamp(LocalDateTime.now())
                        .data(document)
                        .build()
        );
    }

    @GetMapping("/{id}/chunks")
    @Operation(summary = "List all indexed chunks for a document (full knowledge extraction view)")
    public ResponseEntity<ApiResponse<List<CitationDto>>> getDocumentChunks(@PathVariable UUID id) {
        List<CitationDto> chunks = documentMetaDataService.getDocumentChunks(id);
        return ResponseEntity.ok(
                ApiResponse.<List<CitationDto>>builder()
                        .success(true)
                        .message("Document chunks retrieved")
                        .timestamp(LocalDateTime.now())
                        .data(chunks)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a document and purge its vector embeddings from vector store")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable UUID id) {
        documentMetaDataService.deleteDocument(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>
                                builder()
                        .message("Document deleted successfully")
                        .success(true)
                        .timestamp(LocalDateTime.now())
                        .data(null)
                        .build()
        );
    }

}

