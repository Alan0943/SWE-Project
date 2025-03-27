const express = require('express');
const app = express();
app.use(express.json());

app.post('/', (req, res) => {
  console.log("Received a request!"); // Debugging log
  res.json("test");
});

app.listen(5000, () => console.log('✅ Server is running on http://localhost:5000'));
