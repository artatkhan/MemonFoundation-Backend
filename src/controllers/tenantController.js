const TenantService = require("../services/tenantService");

async function createTenantAPI(req, res) {
  const { status, ...data } = await TenantService.createTenant(req);
  return res.status(status).send(data);
}

async function getAllTenantsAPI(req, res) {
  const { status, ...data } = await TenantService.getAllTenants(req);
  return res.status(status).send(data);
}

async function getTenantByIdAPI(req, res) {
  const { status, ...data } = await TenantService.getTenantById(req);
  return res.status(status).send(data);
}

async function updateTenantAPI(req, res) {
  const { status, ...data } = await TenantService.updateTenant(req);
  return res.status(status).send(data);
}

async function deleteTenantAPI(req, res) {
  const { status, ...data } = await TenantService.deleteTenant(req);
  return res.status(status).send(data);
}

async function uploadTenantDocumentsAPI(req, res) {
  const { status, ...data } = await TenantService.uploadTenantDocuments(req);
  return res.status(status).send(data);
}

module.exports = {
  createTenantAPI,
  getAllTenantsAPI,
  getTenantByIdAPI,
  updateTenantAPI,
  deleteTenantAPI,
  uploadTenantDocumentsAPI,
};
