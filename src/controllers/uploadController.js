const UploadService = require("../services/uploadService");

async function addImages(req, res) {
  const { status, ...data } = await UploadService.uploadImages(req);
  return res.status(status).send(data);
}

module.exports = {
  addImages,
};
