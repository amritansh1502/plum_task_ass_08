require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

const ocrRoutes = require('./src/routes/ocrRoutes');
const extractRoutes = require('./src/routes/extractRoutes');
const classifyRoutes = require('./src/routes/classifyRoutes');
const fullExtractRoutes = require('./src/routes/fullExtractRoutes');

app.use('/api/ocr', ocrRoutes);
app.use('/api/extract', extractRoutes);
app.use('/api/classify', classifyRoutes);
app.use('/api/full-extract', fullExtractRoutes);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
