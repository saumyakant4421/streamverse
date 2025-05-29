// index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const franchiseRoutes = require('./routes/franchiseRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/franchises', franchiseRoutes);

// Log mounted routes safely
const logRoutes = () => {
  console.log('Mounted routes:');
  try {
    const routes = [];
    app._router.stack.forEach((layer) => {
      if (layer.route) {
        // Direct routes
        const methods = Object.keys(layer.route.methods).join(', ');
        routes.push(`${methods} ${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) {
        // Router middleware (e.g., /api/franchises)
        const prefix = layer.regexp.source
          .replace('/^\\', '')
          .replace('(?:\\/)?', '')
          .replace('\\/', '/')
          .replace('(?=\\/|$)/i', '');
        layer.handle.stack.forEach((subLayer) => {
          if (subLayer.route) {
            const methods = Object.keys(subLayer.route.methods).join(', ');
            routes.push(`${methods} ${prefix}${subLayer.route.path}`);
          }
        });
      }
    });
    routes.forEach((route) => console.log(route));
  } catch (error) {
    console.error('Error logging routes:', error.message);
  }
};

// Call logRoutes after routes are mounted
logRoutes();

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Route ${req.url} not found` });
});

// Start server
const PORT = process.env.FRANCHISE_PORT || 4014;
app.listen(PORT, () => {
  console.log(`Franchise Service running on port ${PORT}`);
});

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));