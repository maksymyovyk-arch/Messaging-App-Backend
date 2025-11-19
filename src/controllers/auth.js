const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const passport = require("passport");
const { getAvatar, checkAvatarExists, uploadAvatar } = require("../../s3");

const register = [
  body("email")
    .escape()
    .trim()
    .custom(async (email) => {
      if (await User.findOne({ email })) throw new Error("Already exists");
    }),
  body("password")
    .escape()
    .trim()
    .isLength({ min: 8 })
    .withMessage("Must be more than 8 characters"),
  body("displayname")
    .escape()
    .trim()
    .isLength({ min: 3, max: 15 })
    .withMessage("Must be between 3 and 15 characters")
    .isAlphanumeric()
    .withMessage("Can only contain letters or numbers")
    .custom(async (displayname) => {
      if (await User.findOne({ username: displayname.toLowerCase() }))
        throw new Error("Already exists");
    }),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        const { email, password, displayname } = req.body;

        await User.create({
          email,
          password: await bcrypt.hash(password, 10),
          displayname,
        });

        res.json(true);
      } else {
        const organizedErrors = {
          email: [],
          password: [],
          displayname: [],
        };

        for (const error of errors.array()) organizedErrors[error.path].push(error.msg);

        res.json(organizedErrors);
      }
    } catch (err) {
      next(err);
    }
  },
];

const login = [
  body("email").escape().trim(),
  body("password").escape().trim(),
  passport.authenticate("local", {
    successRedirect: "/api/auth/login/success",
    failureRedirect: "/api/auth/login/failure",
    failureMessage: true,
  }),
];

function logout(req, res) {
  req.logout((err) => {
    err ? res.json(false) : res.json(true);
  });
}

function loginSuccess(req, res) {
  res.json(true);
}

function loginFailure(req, res) {
  const error = req.session.messages[req.session.messages.length - 1];

  const organizedErrors = {
    email: [],
    password: [],
  };

  if (error.toLowerCase().includes("email")) organizedErrors.email.push(error);
  else if (error.toLowerCase().includes("password")) organizedErrors.password.push(error);

  res.json(organizedErrors);
}

function checkIsAuthenticated(req, res) {
  req.isAuthenticated() ? res.json(true) : res.json(false);
}

const getUser = [
  (req, res, next) => {
    req.isAuthenticated() ? next() : res.sendStatus(401);
  },
  async (req, res) => {
    const avatarExists = await checkAvatarExists(`users/${req.user._id}`);

    if (avatarExists) {
      const avatar = await getAvatar(`users/${req.user._id}`);
      const user = { ...req.user._doc, avatar };

      res.json(user);
    } else res.json(req.user);
  },
];

module.exports = {
  register,
  login,
  logout,
  loginSuccess,
  loginFailure,
  checkIsAuthenticated,
  getUser,
};
