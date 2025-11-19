const {
  register,
  login,
  logout,
  loginSuccess,
  loginFailure,
  getUser,
  checkIsAuthenticated,
} = require("../controllers/auth");
const User = require("../models/User");

const router = require("express").Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/login/success", loginSuccess);
router.get("/login/failure", loginFailure);
router.get("/isAuthenticated", checkIsAuthenticated);
router.get("/user", getUser);

module.exports = router;
