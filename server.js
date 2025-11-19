const express = require("express");
const session = require("express-session");
const passport = require("passport");
const app = express();
const cors = require("cors");
const authRouter = require("./src/routes/auth");
const userRouter = require("./src/routes/user");
const chatRouter = require("./src/routes/chat");

require("./mongooseConfig");
require("./passportConfig");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);

app.listen(process.env.PORT || 3000, "0.0.0.0");
