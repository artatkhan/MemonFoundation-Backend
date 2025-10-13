const DocumentType = require("../models/Document-type");

class DocumentTypeService {
    static async createDocumentType(req) {
        try {
            const { documentType, documentAbbreviation, description } = req.body;

            const existingDocumentType = await DocumentType.findOne({ documentType });
            if (existingDocumentType) {
                return {
                    status: 400,
                    message: "Document type with this name already exists",
                };
            }

            const newDocumentType = await DocumentType.create({
                documentType,
                documentAbbreviation,
                description,
            });

            return { status: 201, data: newDocumentType,message: "Document type create successfully" };
        } catch (error) {
            return { status: 500, message: error.message };
        }
    }
    static async getAllDocumentTypes(req) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const [documentTypes, total] = await Promise.all([
                DocumentType.find()
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
                DocumentType.countDocuments()
            ]);

            return {
                status: 200,
                data: documentTypes,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            };
        } catch (error) {
            return { status: 500, message: error.message };
        }
    }
    static async getDocumentTypeById(req) {
        try {
            const { id } = req.params;
            const documentTypeData = await DocumentType.findById(id);
            if (!documentTypeData) {
                return { status: 404, message: "Document type not found" };
            }
            return { status: 200, data: documentTypeData };
        } catch (error) {
            return { status: 500, message: error.message };
        }
    }
    static async updateDocumentType(req) {
        try {
            const { id } = req.params;
            const { documentType, documentAbbreviation, description } = req.body;

            const documentTypeData = await DocumentType.findById(id);
            if (!documentTypeData) {
                return { status: 404, message: "Document type not found" };
            }

            documentTypeData.documentType = documentType || documentTypeData.documentType;
            documentTypeData.documentAbbreviation = documentAbbreviation || documentTypeData.documentAbbreviation;
            documentTypeData.description = description || documentTypeData.description;

            await documentTypeData.save();

            return { status: 200, data: documentTypeData, message: "Document type updated successfully" };
        } catch (error) {
            return { status: 500, message: error.message };
        }
    }
    static async deleteDocumentType(req) {
        try {
            const { id } = req.params;
            const documentTypeData = await DocumentType.findById(id);
            if (!documentTypeData) {
                return { status: 404, message: "Document type not found" };
            }
            await documentTypeData.deleteOne(); 
            return { status: 200, message: "Document type deleted successfully" };
        } catch (error) {
            return { status: 500, message: error.message };
        }
    }
}

module.exports = DocumentTypeService;

