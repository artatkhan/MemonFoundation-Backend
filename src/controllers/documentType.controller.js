const DocumentTypeService = require("../services/documentType.service");



async function createDocumentTypeAPI(req, res) {
    const { status, ...data } = await DocumentTypeService.createDocumentType(req);
    return res.status(status).send(data);
}

async function getAllDocumentTypesAPI(req, res) {
    const { status, ...data } = await DocumentTypeService.getAllDocumentTypes(req);
    return res.status(status).send(data);
}

async function getDocumentTypeByIdAPI(req, res) {   
    const { status, ...data } = await DocumentTypeService.getDocumentTypeById(req);
    return res.status(status).send(data);
}
async function updateDocumentTypeAPI(req, res) {
    const { status, ...data } = await DocumentTypeService.updateDocumentType(req);
    return res.status(status).send(data);
}

async function deleteDocumentTypeAPI(req, res) {
    const { status, ...data } = await DocumentTypeService.deleteDocumentType(req);
    return res.status(status).send(data);
}

module.exports = {
    createDocumentTypeAPI,
    getAllDocumentTypesAPI,
    getDocumentTypeByIdAPI,
    updateDocumentTypeAPI,
    deleteDocumentTypeAPI,
};