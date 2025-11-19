const { updateUserAccount, updateUserProfile, deleteUser } = require("../controllers/user");
const friendRequestsRouter = require("./friendRequests");
const friendsRouter = require("./friends");
const router = require("express").Router();

router.use((req, res, next) => {
  req.isAuthenticated() ? next() : res.sendStatus(401);
});
router.put("/account", updateUserAccount);
router.put("/profile", updateUserProfile);
router.delete("/", deleteUser);
router.use("/friendRequests", friendRequestsRouter);
router.use("/friends", friendsRouter);

module.exports = router;
