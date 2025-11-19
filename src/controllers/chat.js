const { body, ExpressValidator, validationResult } = require("express-validator");
const { getAvatar, checkAvatarExists } = require("../../s3");
const DM = require("../models/DM");
const User = require("../models/User");

async function getVisibleChats(req, res) {
  let user = await User.findById(req.user._id).populate("chats.users.friend");
  user = JSON.parse(JSON.stringify(user));

  const visibleChats = user.chats.users.filter((chat) => chat.visible);
  for (const visibleChat of visibleChats) {
    const avatarExists = await checkAvatarExists(`users/${visibleChat.friend._id}`);

    if (avatarExists)
      visibleChat.friend.avatar = await getAvatar(`users/${visibleChat.friend._id}`);
  }

  res.json(visibleChats);
}

async function changeVisibleStatus(req, res) {
  const user = req.user;
  const { otherUserId, visible } = req.body;
  const chat = await DM.findOne({ users: { $all: [user._id, otherUserId] } });

  for (const chatUser of user.chats.users) {
    if (chatUser.ref.equals(chat._id)) chatUser.visible = visible;
  }

  await user.save();

  res.end();
}

async function getChat(req, res) {
  let user = await User.findById(req.user._id, "chats").populate({
    path: "chats.users",
    populate: [
      { path: "friend", select: "displayname username status about visibility" },
      {
        path: "ref",
        populate: [
          {
            path: "messages.user",
            select: "displayname username",
          },
          { path: "users", select: "username" },
        ],
      },
    ],
  });
  user = JSON.parse(JSON.stringify(user));

  const chat = user.chats.users.filter(
    (chat) => chat.friend.username === req.params.username
  )[0];

  // profile pictures
  const profilePictures = {};
  for (const user of chat.ref.users) {
    const avatarExists = await checkAvatarExists(`users/${user._id}`);
    if (avatarExists) profilePictures[user.username] = await getAvatar(`users/${user._id}`);
  }

  if (profilePictures[chat.friend.username]) {
    chat.friend.avatar = profilePictures[chat.friend.username];
  }

  for (const messages of chat.ref.messages) {
    if (profilePictures[messages.user.username]) {
      messages.user.avatar = profilePictures[messages.user.username];
    }
  }

  res.json(chat);
}

async function reorderChats(req, res) {
  const { username } = req.params;
  const otherUser = await User.findOne({ username });

  const userChats = req.user.chats.users;

  let index;
  for (let i = 0; i < userChats.length; i++) {
    if (userChats[i].friend.equals(otherUser._id)) index = i;
  }

  userChats.unshift(userChats.splice(index, 1)[0]);
  await req.user.save();

  res.end();
}

const addMessage = [
  body("message").isLength({ max: 2000 }),

  async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { message, chatId } = req.body;

      const chat = await DM.findById(chatId);
      chat.messages.push({
        body: message,
        user: req.user._id,
      });

      await chat.save();
    }

    res.end();
  },
];

const editMessage = [
  body("message").isLength({ max: 2000 }),

  async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { messageId } = req.params;
      const { message, chatId } = req.body;

      const chat = await DM.findById(chatId);
      const index = chat.messages.findIndex((message) => message._id.equals(messageId));
      chat.messages[index].body = message;

      await chat.save();
    }

    res.end();
  },
];

async function deleteMessage(req, res) {
  const { messageId } = req.params;
  const { chatId } = req.body;

  const chat = await DM.findById(chatId);
  chat.messages = chat.messages.filter((message) => !message._id.equals(messageId));

  await chat.save();

  res.end();
}

module.exports = {
  getVisibleChats,
  changeVisibleStatus,
  getChat,
  reorderChats,
  addMessage,
  editMessage,
  deleteMessage,
};
