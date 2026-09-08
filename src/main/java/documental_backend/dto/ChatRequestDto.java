package documental_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRequestDto {

    @NotBlank(message = "Question cannot be empty")
    private String question;

    private UUID documentId;

    private Integer topK;

    private Double minSimilarity;

    private String conversationId;

    /**
     * When true, the model may give a fuller explanation.
     * When false/null, answers stay concise by default.
     */
    private Boolean detailed;
}
