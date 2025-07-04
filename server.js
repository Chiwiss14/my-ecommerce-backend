const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Sample route
app.get('/api/products', (req, res) => {
  res.json([
    { id: 1, name: 'Sneakers', price: 59.99 },
    { id: 2, name: 'Shirt', price: 29.99 },
    { id: 3, name: 'Pants', price: 39.99 },
    
  ]);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
