const { uploadAndRetrieveImages } = require("../helper/s3.js");
class UploadService {
  static async uploadImages(req) {
    try {
      const imageArray = await uploadAndRetrieveImages(req.files);
      if (imageArray.length === 0) {
        return { status: 400, message: "No images found" };
      }
      return {
        status: 200,
        data: imageArray,
        message: "Images uploaded successfully",
      };
    } catch (error) {
      return { status: 500, message: error.message };
    }
  }
}

module.exports = UploadService;
