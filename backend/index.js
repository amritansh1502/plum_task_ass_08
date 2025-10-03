
  require('dotenv').config();
const express  = require("express");
  const  app = express();
    const cors = require("cors");
     const mongoose = require("mongoose");


  const PORT = process.env.PORT

  app.use(cors());

    mongoose.connect(process.env.MONGOURI)  
  .then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`App is running on port ${PORT}`));
})
.catch(err => console.log(err));
  app.use(express.json());

  

   

  