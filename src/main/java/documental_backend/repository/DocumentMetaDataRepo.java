package documental_backend.repository;

import documental_backend.entity.DocumentMetadata;
import documental_backend.entity.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentMetaDataRepo extends JpaRepository<DocumentMetadata, UUID> {
    List<DocumentMetadata> findByStatus(DocumentStatus status);

    List<DocumentMetadata> findAllByOrderByCreatedAtDesc();

}
