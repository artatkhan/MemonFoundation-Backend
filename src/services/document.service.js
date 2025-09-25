const Document = require("../models/Document");

class DocumentService {
    static async createDocument(req) {
        try {
            const { title, documentType, documnetBrief, documentURL, documentUpload, uploadedBy, createdBy } = req.body;

            const newDocument = new Document({
                title,
                documentType,
                documnetBrief,
                documentURL,
                documentUpload,
                uploadedBy,
                createdBy
            });

            await newDocument.save();

            return { status: 201, message: "Document created successfully", data: newDocument };
        } catch (error) {
            console.error("Error creating document:", error);
            return { status: 500, message: error.message };
        }
    }

    static async getAllDocuments() {
        try {
            const documents = await Document.find()
                .populate("documentType", "documentType documentAbbreviation") // populate type info
                .populate("uploadedBy", "firstName lastName email")
                .populate("createdBy", "firstName lastName email")
                .sort({ createdAt: -1 });

            return { status: 200, data: documents };
        } catch (error) {
            console.error("Error fetching documents:", error);
            return { status: 500, message: error.message };
        }
    }

    static async getDocumentById(req) {
        try {
            const { id } = req.params;
            const document = await Document.findById(id)
                .populate("documentType", "documentType documentAbbreviation")
                .populate("uploadedBy", "firstName lastName email")
                .populate("createdBy", "firstName lastName email");

            if (!document) {
                return { status: 404, message: "Document not found" };
            }

            return { status: 200, data: document };
        } catch (error) {
            console.error("Error fetching document by ID:", error);
            return { status: 500, message: error.message };
        }
    }

    static async updateDocument(req) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const updatedDocument = await Document.findByIdAndUpdate(id, updates, { new: true })
                .populate("documentType", "documentType documentAbbreviation")
                .populate("uploadedBy", "firstName lastName email")
                .populate("createdBy", "firstName lastName email");

            if (!updatedDocument) {
                return { status: 404, message: "Document not found" };
            }

            return { status: 200, message: "Document updated successfully", data: updatedDocument };
        } catch (error) {
            console.error("Error updating document:", error);
            return { status: 500, message: error.message };
        }
    }

    static async deleteDocument(req) {
        try {
            const { id } = req.params;

            const deletedDocument = await Document.findByIdAndDelete(id);

            if (!deletedDocument) {
                return { status: 404, message: "Document not found" };
            }

            return { status: 200, message: "Document deleted successfully" };
        } catch (error) {
            console.error("Error deleting document:", error);
            return { status: 500, message: error.message };
        }
    }
}

module.exports = DocumentService;
