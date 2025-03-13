require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
