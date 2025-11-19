const mongoose = require("mongoose");
if (process.env.NODE_ENV !== "production") require("dotenv").config();

mongoose.connect(process.env.MONGO_PRIVATE_URL);
mongoose.connection.on("error", console.error.bind(console, "mongo connection error"));
