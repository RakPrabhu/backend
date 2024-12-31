require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Database connection error:', err));

// Define City Schema
const citySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  population: { type: Number, required: true },
  country: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
});

// City Model
const City = mongoose.model('City', citySchema);

// Add City API
app.post('/api/cities', async (req, res) => {
  try {
    const { name, population, country, latitude, longitude } = req.body;
    const newCity = new City({ name, population, country, latitude, longitude });
    const savedCity = await newCity.save();
    res.status(201).json({ message: 'City added successfully.', city: savedCity });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update City API
app.put('/api/cities/:id', async (req, res) => {
  try {
    const updatedCity = await City.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCity) {
      return res.status(404).json({ error: 'City not found.' });
    }
    res.json({ message: 'City updated successfully.', city: updatedCity });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete City API
app.delete('/api/cities/:id', async (req, res) => {
  try {
    const deletedCity = await City.findByIdAndDelete(req.params.id);
    if (!deletedCity) {
      return res.status(404).json({ error: 'City not found.' });
    }
    res.json({ message: 'City deleted successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get Cities API
app.get('/api/cities', async (req, res) => {
    try {
      const { page = 1, limit = 10, filter, sort, search, fields } = req.query;
      const query = {};
  
      // Filter
      if (filter) {
        Object.assign(query, JSON.parse(filter));
      }
  
      // Search
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }
  
      // Pagination
      const skip = (page - 1) * limit;
  
      // Projection
      const projection = fields ? fields.split(',').join(' ') : '';
  
      // Sorting - check if sort is provided and valid
      let sortOption = {};
      if (sort) {
        const [field, order] = sort.split(':');
        // Ensure the field exists and order is either 'asc' or 'desc'
        if (field && (order === 'asc' || order === 'desc')) {
          sortOption[field] = order === 'asc' ? 1 : -1;
        } else {
          return res.status(400).json({ error: "Invalid sort parameter. Use 'field:asc' or 'field:desc'." });
        }
      }
  
      const cities = await City.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .select(projection)
        .sort(sortOption);
  
      const total = await City.countDocuments(query);
  
      res.json({ total, page, limit, cities });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
