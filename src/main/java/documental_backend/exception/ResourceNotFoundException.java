package documental_backend.exception;

public class ResourceNotFoundException extends RuntimeException{

    public ResourceNotFoundException (String message){
      super(message);
    }

    public ResourceNotFoundException (){
        super("File you are looking for not Found ");
    }

    public ResourceNotFoundException (String message, Throwable ex){
        super(message, ex);
    }
}
