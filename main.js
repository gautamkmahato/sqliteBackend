const express = require('express');
const cors = require('cors');
const databaseRouter = require('./routes/databaseRoutes');
require('dotenv').config();

const app = express();

// Middleware to parse JSON request bodies
const corsOptions = {
  origin: 'http://localhost:3000', // Set to your frontend origin
  credentials: true, // Allow cookies to be sent
};

app.use(cors(corsOptions));

app.use(express.urlencoded({extended: true}));


app.use('/api/database', databaseRouter);

app.get('/', (req, res) =>{
    res.send("jello")
})

app.listen(5000, () => {
  console.log("Server is running on PORT 5000...");
});
