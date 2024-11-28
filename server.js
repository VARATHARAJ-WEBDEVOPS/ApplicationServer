const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' }); // Temporary folder for uploads

const appsDirectory = path.join(__dirname, 'apps');

// Endpoint to receive uploads
app.post('/upload', upload.single('file'), async (req, res) => {
  const { appId, filePath } = req.body;

  if (!appId || !filePath) {
    return res.status(400).send({ error: 'Application ID and file path are required' });
  }

  const appDir = path.join(appsDirectory, appId);
  const fileDir = path.dirname(filePath); // Get the directory from the filePath

  try {
    // Create the app directory if it doesn't exist
    await fs.promises.mkdir(appDir, { recursive: true });

    // Create the target directory inside the app folder (to preserve folder structure)
    const targetDir = path.join(appDir, fileDir);
    await fs.promises.mkdir(targetDir, { recursive: true });

    // Move the uploaded file to the target directory
    const tempFilePath = req.file.path;
    const destinationPath = path.join(targetDir, req.file.originalname);

    await fs.promises.rename(tempFilePath, destinationPath);

    res.status(200).send({ message: `App '${appId}' uploaded successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Upload failed.', details: err.message });
  }
});

// Endpoint to serve the `index.html` for a given appId
app.get('/:appId', (req, res) => {
  const { appId } = req.params;
  const appIndexPath = path.join(appsDirectory, appId, 'index.html');

  if (!fs.existsSync(appIndexPath)) {
    return res.status(404).send({ error: `App '${appId}' not found.` });
  }

  res.sendFile(appIndexPath);
});

// Middleware to serve static files for apps
app.use('/:appId', (req, res, next) => {
  const { appId } = req.params;
  const appPath = path.join(appsDirectory, appId);

  if (fs.existsSync(appPath)) {
    express.static(appPath)(req, res, next); // Serve static files if the app exists
  } else {
    next();
  }
});

const PORT = 2024;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
