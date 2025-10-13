const StudentEmailAdminService = require("../services/studentEmailAdmin.service");

async function sendEmailToAdminAPI(req, res) {
    const { status, ...data } = await StudentEmailAdminService.sendEmailToAdmin(req);
    return res.status(status).send(data);
}

async function getAllStudentEmailsAPI(req, res) {
    const { status, ...data } = await StudentEmailAdminService.getAllStudentEmails(req);
    return res.status(status).send(data);
}
async function getStudentEmailByIdAPI(req, res) {
    const { status, ...data } = await StudentEmailAdminService.getStudentEmailById(req);
    return res.status(status).send(data);
}
module.exports = {
    sendEmailToAdminAPI,
    getAllStudentEmailsAPI,
    getStudentEmailByIdAPI
};