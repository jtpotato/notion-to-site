const express = require("express");
const app = express();
const path = require("path");

const port = 3000;

// Serve static files from the 'site' folder
console.log(path.resolve(path.join(__dirname, "../site")))
app.use(express.static(path.resolve(path.join(__dirname, "../site"))));

app.use(function (req, res, next) {
  console.log(`[${new Date()}] ${req.method} ${req.url} ${res.status}`);
  // console.log(path.join(__dirname, "../site", req.url))
  next();
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
