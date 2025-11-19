const { body, validationResult, check } = require("express-validator");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { uploadAvatar, deleteAvatar } = require("../../s3");
const { removeFriendRequest } = require("./friendRequests");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const updateUserAccount = [
  body("currentPassword")
    .escape()
    .trim()
    .isLength({ min: 8 })
    .withMessage("Must be more than 8 characters")
    .custom(async (currentPassword, { req }) => {
      if (!(await bcrypt.compare(currentPassword, req.user.password)))
        throw new Error("Does not match");
    }),
  body("email")
    .optional({ values: "falsy" })
    .escape()
    .trim()
    .custom(async (email, { req }) => {
      if (email === req.user.email) return true;
      if (await User.findOne({ email })) throw new Error("Already exists");
    }),
  body("password")
    .optional({ values: "falsy" })
    .escape()
    .trim()
    .isLength({ min: 8 })
    .withMessage("Must be at more than 8 characters"),

  async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { email, password } = req.body;
      if (!email && !password) return res.json(false);

      const hashedPassword = await bcrypt.hash(password, 10);
      const update = !email
        ? { password: hashedPassword }
        : !password
        ? { email }
        : { email, password: hashedPassword };

      await User.findByIdAndUpdate(req.user._id, update);
      res.json(false);
    } else {
      const organizedErrors = {
        currentPassword: [],
        email: [],
        password: [],
      };

      for (const error of errors.array()) organizedErrors[error.path].push(error.msg);

      res.json(organizedErrors);
    }
  },
];

const updateUserProfile = [
  upload.single("avatar"),

  body("displayname")
    .escape()
    .trim()
    .isLength({ min: 3, max: 15 })
    .withMessage("Must be between 3 and 15 characters")
    .isAlphanumeric()
    .withMessage("Can only contain letters or numbers")
    .custom(async (displayname, { req }) => {
      if (displayname.toLowerCase() === req.user.username) return true;
      if (await User.findOne({ username: displayname.toLowerCase() }))
        throw new Error("Already exists");
    }),
  body("status").trim().isLength({ max: 40 }).withMessage("Must be less than 40 characters"),
  body("about").trim().isLength({ max: 190 }).withMessage("Must be less than 190 characters"),

  async (req, res) => {
    const errors = validationResult(req);
    if (req.file && req.file.mimetype !== "image/png" && req.file.mimetype !== "image/jpeg")
      errors.errors.push({
        msg: "Incorrect file type",
        path: "avatar",
      });

    if (errors.isEmpty()) {
      if (req.file)
        await uploadAvatar(`users/${req.user._id}`, req.file.buffer, req.file.mimetype);

      await User.findByIdAndUpdate(req.user._id, {
        ...req.body,
        username: req.body.displayname.toLowerCase(),
      });
      res.json(false);
    } else {
      const organizedErrors = {
        displayname: [],
        avatar: [],
        status: [],
        about: [],
      };

      for (const error of errors.array()) organizedErrors[error.path].push(error.msg);

      res.json(organizedErrors);
    }
  },
];

const deleteUser = [
  body("currentPassword")
    .escape()
    .trim()
    .isLength({ min: 8 })
    .withMessage("Must be more than 8 characters")
    .custom(async (currentPassword, { req }) => {
      if (!(await bcrypt.compare(currentPassword, req.user.password)))
        throw new Error("Does not match");
    }),

  async function deleteUser(req, res) {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      await deleteAvatar(`users/${req.user._id}`);
      await User.findByIdAndDelete(req.user._id);

      res.json(false);
    } else {
      res.json(errors.array());
    }
  },
];

module.exports = {
  updateUserAccount,
  updateUserProfile,
  deleteUser,
};
