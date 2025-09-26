const Document = require("../models/Document");

class DocumentService {
    static async createDocument(req) {
        try {
            const { title, documentType, documnetBrief, documentURL, documentUpload } = req.body;
            const { userId } = req.user;

            const newDocument = new Document({
                title,
                documentType,
                documnetBrief,
                documentURL,
                documentUpload,
                uploadedBy: userId,
                createdBy: userId
            });

            await newDocument.save();

            // Populate uploadedBy and createdBy
            const populatedDocument = await Document.findById(newDocument._id)
                .populate("uploadedBy", "name email")
                .populate("createdBy", "name email")
                .populate("documentType", "documentType documentAbbreviation");

            return {
                status: 201,
                message: "Document created successfully",
                data: populatedDocument
            };
        } catch (error) {
            console.error("Error creating document:", error);
            return { status: 500, message: error.message };
        }
    }

    static async getAllDocuments(req) {
        try {
            const { userId, type, tenantId } = req.user;

            let filter = {};

            if (type === "tutor") {
                filter.uploadedBy = userId;
            } else if (type === "student") {

                const tutors = await User.find({ type: "tutor", tenantId }).select("_id");
                const tutorIds = tutors.map(t => t._id);
                filter.uploadedBy = { $in: tutorIds };
            }

            const documents = await Document.find(filter)
                .populate("documentType", "documentType documentAbbreviation")
                .populate("uploadedBy", "email name")
                .populate("createdBy", "email name")
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
            const { userId } = req.user;

            const document = await Document.findOne({ _id: id, uploadedBy: userId }) // ✅ permission check
                .populate("documentType", "documentType documentAbbreviation")
                .populate("uploadedBy", "firstName lastName email")
                .populate("createdBy", "firstName lastName email");

            if (!document) {
                return { status: 404, message: "Document not found or access denied" };
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
