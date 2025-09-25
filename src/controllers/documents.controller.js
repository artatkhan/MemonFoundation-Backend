const DocumentService = require("../services/document.service");

async function createDocumentAPI(req, res) {
    const { status, ...data } = await DocumentService.createDocument(req);
    return res.status(status).send(data);
}
async function getAllDocumentsAPI(req, res) {
    const { status, ...data } = await DocumentService.getAllDocuments(req);
    return res.status(status).send(data);
}
async function getDocumentByIdAPI(req, res) {
    const { status, ...data } = await DocumentService.getDocumentById(req);
    return res.status(status).send(data);
}
module.exports = {
    createDocumentAPI,
    getAllDocumentsAPI,
    getDocumentByIdAPI,
};