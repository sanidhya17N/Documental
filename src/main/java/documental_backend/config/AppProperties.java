package documental_backend.config;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
@Getter
@Setter
public class AppProperties {

    private RagProperties rag = new RagProperties();
    private CorsProperties cors = new CorsProperties();


    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RagProperties {
        /** Target chunk size in tokens. Smaller = finer knowledge extraction. */
        private int chunkSize = 350;
        /** Sliding-window overlap in tokens between consecutive chunks. */
        private int chunkOverlap = 80;
        private int minChunkSizeChars = 120;
        private int minChunkLengthToEmbed = 5;
        private int maxNumChunks = 10000;
        private int topK = 8;
        private double similarityThreshold = 0.0;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CorsProperties {
        private String allowedOrigins = "*";
        private String allowedMethods = "GET,POST,PUT,DELETE,OPTIONS";
        private String allowedHeaders = "*";
    }

}
