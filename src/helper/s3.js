const path = require('path');
const fs = require('fs');

const uploadAndRetrieveImages = async (files) => {
  const uploadedFiles = [];
  const uploadDir = path.join(__dirname, '../../uploads/');

  if (!files || files?.length === 0) return uploadedFiles;
  for (const file of files) {

    const fileExtension = path.extname(file.originalname);
    const fileNameWithoutExtension = path.basename(file.originalname, fileExtension);
    const fileFormat = fileExtension.slice(1); // Remove the leading dot
    
    // Generate the unique file name with the format suffix
    const uniqueFileName = `${fileNameWithoutExtension}-${fileFormat}-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    try {
      const fileData = await fs.promises.readFile(file.path);
      await fs.promises.writeFile(filePath, fileData);
      uploadedFiles.push(filePath);
      return uploadedFiles
    } catch (err) {
      console.error('Error processing file:', file.originalname, err);
      throw err;
    }
}};

module.exports = { uploadAndRetrieveImages };
