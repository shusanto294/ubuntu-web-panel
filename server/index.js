const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const siteRoutes = require('./routes/sites');
const cloudflareRoutes = require('./routes/cloudflare');
const emailRoutes = require('./routes/email');
const { connectDB } = require('./services/database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/cloudflare', cloudflareRoutes);
app.use('/api/email', emailRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Ubuntu Web Panel server running on port ${PORT}`);
});