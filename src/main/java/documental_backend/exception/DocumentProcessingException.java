package documental_backend.exception;

public class DocumentProcessingException extends RuntimeException{

    public DocumentProcessingException(String message){
        super(message);
    }

    public DocumentProcessingException(){
        super("Error while procesing the document!");
    }

    public DocumentProcessingException(String message, Throwable ex){
        super(message,ex);
    }

}
