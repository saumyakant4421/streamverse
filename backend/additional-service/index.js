const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const marathonRoutes = require('./routes/marathonRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/tools/marathon', marathonRoutes);

// Log mounted routes
console.log('Mounted routes:');
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`${Object.keys(r.route.methods).join(', ')} ${r.route.path}`);
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Route ${req.url} not found` });
});

const PORT = process.env.MARATHON_PORT || 4002;
app.listen(PORT, () => console.log(`Marathon Service running on port ${PORT}`));

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));