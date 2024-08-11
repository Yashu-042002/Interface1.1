import express from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the current file and directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Set up Multer for file upload
const upload = multer({ dest: 'uploads/' });

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ensure the data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}
// Handle Home route
app.get('/', (req, res) => {
    res.render('index');
});

// Handle file upload and processing
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  exec(`python process_data.py ${req.file.path}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error}`);
      console.error(`stderr: ${stderr}`);
      return res.status(500).send('Error processing file.');
    }

    console.log(`stdout: ${stdout}`); // Log the output for debugging

    let processedData;
    try {
      processedData = JSON.parse(stdout);
    } catch (err) {
      console.error('Error parsing JSON:', err);
      return res.status(500).send('Error parsing data.');
    }

    // Save processed data to a file for later use
    try {
      fs.writeFileSync(path.join(dataDir, 'processedData.json'), JSON.stringify(processedData, null, 2));
    } catch (err) {
      console.error('Error saving processed data:', err);
      return res.status(500).send('Error saving processed data.');
    }

    // Render results to results.ejs with default page 1
    res.redirect('/results?page=1');
  });
});

// Results route with pagination
app.get('/results', (req, res) => {
  let processedData;
  try {
    processedData = JSON.parse(fs.readFileSync(path.join(dataDir, 'processedData.json')));
  } catch (err) {
    console.error('Error reading processed data:', err);
    return res.status(500).send('Error fetching data.');
  }

  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = 20;
  const entries = Object.entries(processedData);
  const totalPages = Math.ceil(entries.length / pageSize);

  const paginatedEntries = entries.slice((page - 1) * pageSize, page * pageSize).reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});

  res.render('results', {
    data: {
      entries: paginatedEntries
    },
    pagination: {
      currentPage: page,
      totalPages,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPages ? page + 1 : null
    }
  });
});

// Details route
app.get('/details/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  let processedData;

  try {
    // Read processed data from the file
    processedData = JSON.parse(fs.readFileSync(path.join(dataDir, 'processedData.json')));
  } catch (err) {
    console.error('Error reading processed data:', err);
    return res.status(500).send('Error fetching data.');
  }

  // Find the details for the given ID
  const entry = Object.values(processedData).find(item => item.ID === id);

  if (entry) {
    res.render('details', { details: entry });
  } else {
    res.status(404).send('Details not found.');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
