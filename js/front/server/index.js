// Simple Express server exposing /api/describe
// - If AZURE_COMPUTER_VISION_ENDPOINT and AZURE_COMPUTER_VISION_KEY are set, it forwards the image to Azure's Describe API
// - Otherwise it returns a friendly message indicating the server is not configured

const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
app.use(cors());
app.disable('x-powered-by');

const AZURE_ENDPOINT = process.env.AZURE_COMPUTER_VISION_ENDPOINT;
const AZURE_KEY = process.env.AZURE_COMPUTER_VISION_KEY;

app.get('/', (req, res) => res.json({status: 'ok', note: 'POST /api/describe with form-data field "image" to get a description.'}));

app.post('/api/describe', upload.single('image'), async (req, res) => {
  try{
    if(!req.file) return res.status(400).json({error:'No image file uploaded. Use form field name "image".'});

    // If Azure config is present, forward the image
    if(AZURE_ENDPOINT && AZURE_KEY){
      const endpoint = (AZURE_ENDPOINT.replace(/\/+$/,'') + '/vision/v3.2/describe?maxCandidates=1');
      const headers = {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Type': 'application/octet-stream'
      };

      const response = await fetch(endpoint, { method: 'POST', headers, body: req.file.buffer });
      if(!response.ok){
        const text = await response.text();
        return res.status(502).json({error: 'Azure returned error', details: text});
      }
      const json = await response.json();
      const desc = json?.description?.captions?.[0]?.text || null;
      if(desc) return res.json({description: desc, source: 'azure'});
      return res.status(502).json({error:'Azure did not return a description.'});
    }

    // If no provider configured, return a helpful message
    return res.json({description: 'Server: no vision provider configured. Set AZURE_COMPUTER_VISION_ENDPOINT and AZURE_COMPUTER_VISION_KEY to enable rich descriptions.'});
  }catch(err){
    console.error('Error in /api/describe', err);
    res.status(500).json({error: err.message || 'Internal error'});
  }
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`AuraSense API server listening on http://localhost:${port}`));
