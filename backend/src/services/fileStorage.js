const fs = require('fs/promises');
const path = require('path');

const uploadRoot = path.join(__dirname, '..', '..', 'uploads');

const ensureTaskDirectory = async (taskId) => {
  const directory = path.join(uploadRoot, 'tasks', taskId.toString());
  await fs.mkdir(directory, { recursive: true });
  return directory;
};

const saveUploadedDocuments = async (taskId, files = []) => {
  const directory = await ensureTaskDirectory(taskId);

  const savedDocuments = [];
  for (const file of files) {
    const sanitizedName = `${Date.now()}-${file.originalname}`.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(directory, sanitizedName);
    await fs.writeFile(filePath, file.buffer);

    savedDocuments.push({
      filename: sanitizedName,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: filePath,
    });
  }

  return savedDocuments;
};

const readDocumentStream = async (documentPath) => {
  return fs.readFile(documentPath);
};

const removeTaskDirectory = async (taskId) => {
  const directory = path.join(uploadRoot, 'tasks', taskId.toString());
  await fs.rm(directory, { recursive: true, force: true });
};

const removeDocumentFile = async (documentPath) => {
  await fs.rm(documentPath, { force: true });
};

module.exports = {
  saveUploadedDocuments,
  readDocumentStream,
  removeTaskDirectory,
  removeDocumentFile,
};
