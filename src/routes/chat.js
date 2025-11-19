const {
  changeVisibleStatus,
  getVisibleChats,
  getChat,
  addMessage,
  reorderChats,
  editMessage,
  deleteMessage,
} = require("../controllers/chat");

const router = require("express").Router();

router.use((req, res, next) => {
  req.isAuthenticated() ? next() : res.sendStatus(401);
});
router.get("/visible", getVisibleChats);
router.put("/visible", changeVisibleStatus);

router.get("/:username", getChat);
router.put("/:username/reorder", reorderChats);

router.post("/message", addMessage);
router.put("/message/:messageId", editMessage);
router.delete("/message/:messageId", deleteMessage);

module.exports = router;
