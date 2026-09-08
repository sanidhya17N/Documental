package documental_backend.dto;

import documental_backend.entity.DocumentStatus;
import lombok.*;

import java.util.UUID;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DocumentResponseDto {
    private UUID id;
    private String fileName;
    private Long fileSize;
    private DocumentStatus status;
    private Integer chunkCreated;
    private String message;
}
