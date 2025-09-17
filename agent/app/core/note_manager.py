import os
import logging
import hashlib
from typing import List, Dict, Any
from dotenv import load_dotenv
from openai import OpenAI
import chromadb
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Import Llama Index components - try multiple import patterns

from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, StorageContext
from llama_index.core.schema import Document
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore
from app.utils.note_utils import ensure_upload_dir_exists, setup_vector_store, format_modal_paper

# Load environment variables
load_dotenv()

class NoteManager:
    def __init__(self, tenant_id: str = None):
        """Initialize the NoteManager with OpenAI client and vector store."""
        self.tenant_id = tenant_id
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.embed_model = OpenAIEmbedding()
        self.vector_store = None
        self.index = None
        self.uploaded_notes_dir = f"./uploads/{tenant_id}" if tenant_id else "./uploads"
        ensure_upload_dir_exists(self.uploaded_notes_dir)
        self.vector_store, self.storage_context = setup_vector_store(self.tenant_id)
        # Try to load existing index
        try:
            self.index = VectorStoreIndex.from_vector_store(self.vector_store, embed_model=self.embed_model)
            logging.info("Loaded existing index from vector store.")
        except Exception as e:
            logging.info(f"No existing index to load or error loading: {e}")
            self.index = None
        logging.info("NoteManager initialized.")
    
    def upload_notes(self, file_path: str) -> List[Document]:
        """
        Upload notes from a file, save to uploaded_notes directory if not already there, and create embeddings.

        Args:
            file_path: Path to the note file

        Returns:
            List of processed documents
        """
        try:
            logging.info(f"Uploading notes from file: {file_path}")

            # Check if file is already in uploads directory
            if file_path.startswith(self.uploaded_notes_dir):
                # File is already in uploads directory, use it directly
                destination_path = file_path
                filename = os.path.basename(file_path)
                logging.info(f"File already in uploads directory: {destination_path}")
            else:
                # Save the file to uploaded_notes directory with original name
                filename = os.path.basename(file_path)
                destination_path = os.path.join(self.uploaded_notes_dir, filename)

                # Copy the file to uploads directory
                import shutil
                shutil.copy2(file_path, destination_path)
                logging.info(f"File saved to uploads directory: {destination_path}")

            # Compute file hash to check for content changes
            with open(destination_path, 'rb') as f:
                file_hash = hashlib.md5(f.read()).hexdigest()

            # Read the document and add upload time metadata
            logging.info("Attempting to read the document using SimpleDirectoryReader.")
            try:
                documents = SimpleDirectoryReader(input_files=[destination_path]).load_data()
                logging.info(f"Documents loaded: {documents}")
            except Exception as e:
                logging.error(f"Error loading documents: {e}")
                raise

            # Add upload time metadata to each document and log the metadata
            upload_time = datetime.now().isoformat()
            for doc in documents:
                doc.metadata = {
                    **doc.metadata,
                    "file_name": filename,
                    "upload_time": upload_time,
                    "file_path": destination_path,
                    "file_hash": file_hash,
                    "tenant_id": self.tenant_id
                }
                logging.info(f"Document metadata: {doc.metadata}")

            # Check for existing embeddings of the same file
            chroma_client = chromadb.PersistentClient(path="./chroma_db")
            collection_name = f"notes_{self.tenant_id}" if self.tenant_id else "notes"
            try:
                collection = chroma_client.get_collection(collection_name)
                # Check if file already exists in embeddings
                existing_results = collection.get(where={"file_name": filename})
                if existing_results['ids']:
                    # Check if all existing have the same hash
                    all_same_hash = all(meta.get('file_hash') == file_hash for meta in existing_results['metadatas'] if meta)
                    if all_same_hash:
                        logging.info(f"File {filename} content unchanged, skipping re-embedding.")
                        return documents
                    else:
                        logging.info(f"File {filename} content changed, deleting existing embeddings before re-embedding.")
                        # Delete existing embeddings for this file
                        collection.delete(where={"file_name": filename})
                        logging.info(f"Deleted {len(existing_results['ids'])} existing embeddings for {filename}")
            except Exception as e:
                logging.warning(f"Could not check/delete existing embeddings: {e}")
                # Continue with embedding if check fails

            # Update the index by loading from vector store and inserting new documents
            try:
                self.index = VectorStoreIndex.from_vector_store(self.vector_store, embed_model=self.embed_model)
                self.index.insert(documents)
                logging.info(f"Inserted {len(documents)} documents into existing index.")
            except Exception as e:
                logging.info(f"No existing index to load or error loading: {e}. Creating new index from documents.")
                self.index = VectorStoreIndex.from_documents(
                    documents,
                    embed_model=self.embed_model,
                    storage_context=self.storage_context
                )

            logging.info(f"Successfully uploaded and embedded {len(documents)} documents")
            return documents

        except Exception as e:
            logging.error(f"Error uploading notes: {e}")
            # Clean up: remove the file from uploaded_notes directory if upload failed
            if 'destination_path' in locals() and os.path.exists(destination_path) and not file_path.startswith(self.uploaded_notes_dir):
                os.remove(destination_path)
                logging.info(f"Cleaned up file after failed upload: {destination_path}")
            return []
    
    def delete_note(self, filename: str) -> bool:
        """
        Delete a specific note file and its embeddings from ChromaDB.

        Args:
            filename: Name of the file to delete

        Returns:
            True if deletion was successful, False otherwise
        """
        try:
            logging.info(f"Deleting note: {filename}")

            # Delete file from uploaded_notes directory
            file_path = os.path.join(self.uploaded_notes_dir, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                logging.info(f"Deleted file: {file_path}")
            else:
                logging.warning(f"File not found in uploads directory: {file_path}")

            # Delete embeddings from tenant-specific ChromaDB collection
            chroma_client = chromadb.PersistentClient(path="./chroma_db")
            collection_name = f"notes_{self.tenant_id}" if self.tenant_id else "notes"
            collection = chroma_client.get_collection(collection_name)

            # Delete documents with matching filename
            collection.delete(where={"file_name": filename})
            logging.info(f"Deleted embeddings for file: {filename} from collection: {collection_name}")

            # Check if collection is now empty and delete it if so
            results = collection.get()
            if not results['ids']:
                logging.info(f"Collection {collection_name} is now empty, deleting collection.")
                chroma_client.delete_collection(collection_name)
                logging.info(f"Deleted empty collection: {collection_name}")
            else:
                logging.info(f"Collection {collection_name} still has {len(results['ids'])} documents remaining.")

            # Reset index to force reload
            self.index = None

            logging.info(f"Successfully deleted note: {filename}")
            return True

        except Exception as e:
            logging.error(f"Error deleting note {filename}: {e}")
            return False
    
    def generate_modal_paper(self, query: str, num_notes: int = 5) -> str:
        """
        Generate a modal paper from the stored notes based on a query.
        
        Args:
            query: The query to generate the modal paper about
            num_notes: Number of relevant notes to include
            
        Returns:
            Generated modal paper as string
        """
        logging.info(f"Generating modal paper for query: {query}")
        if not self.index:
            logging.warning("No notes available for generating modal paper.")
            return "No notes available. Please upload notes first."
        
        try:
            # Query the index for relevant notes
            query_engine = self.index.as_query_engine()
            response = query_engine.query(query)
            
            # Format the response as a modal paper
            modal_paper = format_modal_paper(response, query)
            return modal_paper
            
        except Exception as e:
            logging.error(f"Error generating modal paper: {e}")
            return f"Error generating modal paper: {e}"
    
    def list_uploaded_notes(self) -> List[Dict[str, str]]:
        """List all uploaded notes in the vector store with their upload times (unique files only)."""
        try:
            # Create a new Chroma client and get the tenant-specific collection
            chroma_client = chromadb.PersistentClient(path="./chroma_db")
            collection_name = f"notes_{self.tenant_id}" if self.tenant_id else "notes"

            try:
                collection = chroma_client.get_collection(collection_name)
            except Exception:
                # Collection doesn't exist yet, return empty list
                return []

            # Get all documents from the collection
            results = collection.get()

            # Group by unique filename to avoid duplicates
            unique_notes = {}
            for i, metadata in enumerate(results['metadatas']):
                if metadata:  # Ensure metadata exists
                    filename = metadata.get('file_name', 'Unknown')
                    if filename not in unique_notes:
                        unique_notes[filename] = {
                            "filename": filename,
                            "upload_time": metadata.get('upload_time'),
                            "file_path": metadata.get('file_path'),
                            "chunk_count": 1
                        }
                    else:
                        # Increment chunk count for existing file
                        unique_notes[filename]["chunk_count"] += 1

            # Convert to list
            notes_info = list(unique_notes.values())
            return notes_info
        except Exception as e:
            logging.error(f"Error listing notes: {e}")
            return []
    
    def clear_notes(self) -> bool:
        """Clear all uploaded notes from the vector store without deleting the database file."""
        try:
            logging.info("Clearing all notes from vector store.")

            # Delete all files from uploaded_notes directory
            if os.path.exists(self.uploaded_notes_dir):
                for filename in os.listdir(self.uploaded_notes_dir):
                    file_path = os.path.join(self.uploaded_notes_dir, filename)
                    try:
                        if os.path.isfile(file_path) or os.path.islink(file_path):
                            os.unlink(file_path)
                            logging.info(f"Deleted file: {file_path}")
                    except Exception as e:
                        logging.error(f"Failed to delete {file_path}: {e}")

            # Clear all embeddings from tenant-specific ChromaDB collection without deleting the collection
            chroma_client = chromadb.PersistentClient(path="./chroma_db")
            collection_name = f"notes_{self.tenant_id}" if self.tenant_id else "notes"

            try:
                # Get the collection and delete all documents
                collection = chroma_client.get_collection(collection_name)

                # Get all document IDs first, then delete them
                results = collection.get()
                if results['ids']:
                    collection.delete(ids=results['ids'])
                    logging.info(f"Deleted {len(results['ids'])} embeddings from collection: {collection_name}")

                    # After deleting all documents, delete the empty collection
                    chroma_client.delete_collection(collection_name)
                    logging.info(f"Deleted empty collection: {collection_name}")
                else:
                    logging.info("No embeddings found to delete.")
                    # If collection exists but is empty, still delete it
                    try:
                        chroma_client.delete_collection(collection_name)
                        logging.info(f"Deleted empty collection: {collection_name}")
                    except Exception as delete_e:
                        logging.warning(f"Could not delete empty collection {collection_name}: {delete_e}")
            except Exception as e:
                logging.warning(f"Could not clear collection {collection_name}: {e}")
                # If collection doesn't exist, that's fine - nothing to clear
                if "does not exist" in str(e).lower():
                    logging.info(f"Collection {collection_name} does not exist, nothing to clear.")
                else:
                    return False

            # Reset the index
            self.index = None

            logging.info("All notes cleared successfully. Database file preserved.")
            return True

        except Exception as e:
            logging.error(f"Error clearing notes: {e}")
            import traceback
            logging.error(f"Traceback: {traceback.format_exc()}")
            return False

# Example usage
if __name__ == "__main__":
    # Initialize note manager
    note_manager = NoteManager()
    
    # Example: Upload a note file
    note_manager.upload_notes("/home/tahir-srp/Projects/tutor-agent/test_notes.txt")
    
    # Example: Generate modal paper
    paper = note_manager.generate_modal_paper("Explain machine learning concepts")
    print(paper)
