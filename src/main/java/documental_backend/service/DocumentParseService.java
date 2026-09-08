package documental_backend.service;

import com.drew.lang.annotations.Nullable;
import documental_backend.exception.DocumentProcessingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.config.PdfDocumentReaderConfig;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class DocumentParseService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentParseService.class);

    public List<Document> parse(MultipartFile file) {
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

        logger.info("Parsing document: {}, size: {} bytes, contentType: {}", fileName, file.getSize(), contentType);

        try{
            Resource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public @Nullable String getFilename() {
                    return fileName;
                }
            };

            if (fileName.toLowerCase().endsWith(".pdf") || contentType.contains("pdf")) {
                return parsePdf(resource);
            } else {
                return parseGenericFile(resource);
            }
        }catch (IOException ex){
            logger.error("Failed to read file bytes {}\"",fileName,ex);
            throw new DocumentProcessingException("Could not read uploaded file : " + fileName, ex);
        } catch (Exception ex) {
            logger.error("Error during document parsing: {}", fileName, ex);
            throw new DocumentProcessingException("Failed to parse document content: " + fileName, ex);
        }
    }

    private List<Document> parseGenericFile(Resource resource) {
        TikaDocumentReader documentReader = new TikaDocumentReader(resource);
        return documentReader.read();
    }

    private List<Document> parsePdf(Resource resource) {
        PdfDocumentReaderConfig config = PdfDocumentReaderConfig.builder()
                .withPageBottomMargin(0)
                .withPageTopMargin(0)
                .build();

        PagePdfDocumentReader documentReader = new PagePdfDocumentReader(resource, config);
        return documentReader.read();
    }
}
