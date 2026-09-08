package documental_backend.service;

import com.knuddels.jtokkit.Encodings;
import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingType;
import com.knuddels.jtokkit.api.IntArrayList;
import documental_backend.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Token-based sliding-window splitter with configurable overlap.
 * Spring AI's {@code TokenTextSplitter} has no overlap support, so we provide our own
 * to improve retrieval for knowledge extraction (facts spanning chunk boundaries).
 */
@Component
@RequiredArgsConstructor
public class OverlappingTokenTextSplitter {

    private static final List<Character> PUNCTUATION = List.of('.', '?', '!', '\n', ';', ':');

    private final AppProperties appProperties;
    private final Encoding encoding = Encodings.newLazyEncodingRegistry().getEncoding(EncodingType.CL100K_BASE);

    public List<Document> split(List<Document> sourceDocuments) {
        List<Document> result = new ArrayList<>();
        for (Document source : sourceDocuments) {
            String text = source.getText();
            if (!StringUtils.hasText(text)) {
                continue;
            }
            Map<String, Object> baseMeta = source.getMetadata() != null
                    ? new HashMap<>(source.getMetadata())
                    : new HashMap<>();

            for (String chunkText : splitText(text)) {
                result.add(new Document(chunkText, new HashMap<>(baseMeta)));
            }
        }
        return result;
    }

    public List<String> splitText(String text) {
        AppProperties.RagProperties rag = appProperties.getRag();
        int chunkSize = Math.max(50, rag.getChunkSize());
        int overlap = Math.max(0, Math.min(rag.getChunkOverlap(), chunkSize - 1));
        int step = Math.max(1, chunkSize - overlap);
        int minChars = Math.max(1, rag.getMinChunkSizeChars());
        int minEmbed = Math.max(1, rag.getMinChunkLengthToEmbed());
        int maxChunks = Math.max(1, rag.getMaxNumChunks());

        List<Integer> tokens = encoding.encode(text).boxed();
        if (tokens.isEmpty()) {
            return List.of();
        }

        // Short docs: still one chunk (no need to force-split)
        if (tokens.size() <= chunkSize) {
            String whole = text.trim();
            return whole.length() > minEmbed ? List.of(whole) : List.of();
        }

        List<String> chunks = new ArrayList<>();
        int start = 0;
        while (start < tokens.size() && chunks.size() < maxChunks) {
            int end = Math.min(start + chunkSize, tokens.size());
            List<Integer> window = tokens.subList(start, end);
            String chunkText = decode(window);

            // Prefer breaking near sentence/section boundaries when not at end of doc
            if (end < tokens.size()) {
                int lastPunct = lastPunctuationIndex(chunkText);
                if (lastPunct >= minChars) {
                    chunkText = chunkText.substring(0, lastPunct + 1);
                }
            }

            String trimmed = chunkText.trim();
            if (trimmed.length() > minEmbed) {
                chunks.add(trimmed);
            }

            if (end >= tokens.size()) {
                break;
            }

            // Advance by overlap-aware step based on tokens actually kept
            int consumed = encoding.encode(chunkText).size();
            if (consumed <= 0) {
                consumed = step;
            }
            // Move forward so next window overlaps the previous by ~overlap tokens
            int advance = Math.max(1, consumed - overlap);
            start += advance;

            // Safety: avoid infinite loops on pathological punctuation cases
            if (advance == 0) {
                start += step;
            }
        }

        return chunks;
    }

    private int lastPunctuationIndex(String chunkText) {
        int max = -1;
        for (Character mark : PUNCTUATION) {
            max = Math.max(max, chunkText.lastIndexOf(mark));
        }
        return max;
    }

    private String decode(List<Integer> tokens) {
        IntArrayList arr = new IntArrayList(tokens.size());
        tokens.forEach(arr::add);
        return encoding.decode(arr);
    }
}
