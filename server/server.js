// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Basic Route
// app.get('/', (req, res) => {
//   res.send('Backend is running without a database!');
// });

// // Example API Route
// app.get('/api/test', (req, res) => {
//   res.json({ message: 'API Test Route' });
// });

// // Start Server
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

var http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('TailGator');
}).listen(8080);


