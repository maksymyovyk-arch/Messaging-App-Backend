const { getFriends, removeFriend } = require("../controllers/friends");

const router = require("express").Router();

router.get("/", getFriends);
router.delete("/:userId/remove", removeFriend);

module.exports = router;
