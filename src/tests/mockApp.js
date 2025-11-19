const express = require("express");
const app = express();
const cors = require("cors");
const userRouter = require("../routes/user");
const authRouter = require("../routes/auth");
const User = require("../models/User");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);
app.use(async (req, res, next) => {
  req.user = await User.findById("5099803df3f4948bd2f98391");
  next();
});
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);

module.exports = app;
