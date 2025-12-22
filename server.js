const express = require("express")
const app = express();
const dotenv =require("dotenv").config();
const mongoose = require("mongoose");
const PORT = process.env.PORT


const Rateroutes = require("./src/routes/ratesRoutes");
const Authroutes = require("./src/routes/authRoutes");


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});



app.use("/",Rateroutes);
app.use("/", Authroutes);

app.listen(PORT,()=>{
    console.log(`Server live locally  on ${PORT}`);
})
