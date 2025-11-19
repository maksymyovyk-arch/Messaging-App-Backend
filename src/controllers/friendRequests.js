const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { getAvatar, checkAvatarExists } = require("../../s3");
const DM = require("../models/DM");

async function removeFriendRequest(user, userIdToRemove, type) {
  user.friendRequests[type] = user.friendRequests[type].filter(
    (value) => !value.equals(userIdToRemove)
  );

  await user.save();
}

async function getFriendRequests(req, res) {
  let user = await User.findById(req.user._id, "friendRequests").populate(
    "friendRequests.incoming friendRequests.outgoing"
  );

  const friendRequests = JSON.parse(JSON.stringify(user.friendRequests));

  for (let i = 0; i < friendRequests.incoming.length; i++) {
    const userItem = friendRequests.incoming[i];
    const avatarExists = await checkAvatarExists(`users/${userItem._id}`);
    if (avatarExists) userItem.avatar = await getAvatar(`users/${userItem._id}`);
  }
  for (let i = 0; i < friendRequests.outgoing.length; i++) {
    const userItem = friendRequests.outgoing[i];
    const avatarExists = await checkAvatarExists(`users/${userItem._id}`);
    if (avatarExists) userItem.avatar = await getAvatar(`users/${userItem._id}`);
  }

  res.json(friendRequests);
}

const sendFriendRequest = [
  body("username")
    .escape()
    .trim()
    .custom(async (username, { req }) => {
      const friendedUser = await User.findOne({ username });

      if (username === req.user.username) throw new Error("You can't friend yourself...");
      else if (!(await User.findOne({ username }))) throw new Error("Username doesn't exist");
      else if (req.user.friendRequests.outgoing.includes(friendedUser._id))
        throw new Error("You've already sent a friend request");
      else if (req.user.friendRequests.incoming.includes(friendedUser._id))
        throw new Error("They've already sent a friend request");
      else if (req.user.friends.includes(friendedUser._id))
        throw new Error("You're already friends");
    }),
  async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const { username } = req.body;
      const friendedUser = await User.findOne({ username });

      friendedUser.friendRequests.incoming.push(req.user._id);
      await friendedUser.save();

      req.user.friendRequests.outgoing.push(friendedUser._id);
      await req.user.save();

      res.json(false);
    } else res.send(errors.array());
  },
];

const declineFriendRequest = {
  async incoming(req, res) {
    const { username } = req.body;
    const friendedUser = await User.findOne({ username });

    await removeFriendRequest(req.user, friendedUser._id, "incoming");
    await removeFriendRequest(friendedUser, req.user._id, "outgoing");

    res.end();
  },
  async outgoing(req, res) {
    const { username } = req.body;
    const friendedUser = await User.findOne({ username });

    await removeFriendRequest(req.user, friendedUser._id, "outgoing");
    await removeFriendRequest(friendedUser, req.user._id, "incoming");

    res.end();
  },
};

async function acceptFriendRequest(req, res) {
  const user = req.user;
  let friendedUser = await User.findOne({ username: req.body.username });

  await removeFriendRequest(user, friendedUser._id, "incoming");
  await removeFriendRequest(friendedUser, user._id, "outgoing");

  friendedUser.friends.push(user._id);
  user.friends.push(friendedUser._id);

  const chat =
    (await DM.findOne({ users: { $all: [friendedUser._id, user._id] } })) ||
    (await DM.create({
      users: [friendedUser._id, user._id],
    }));
  friendedUser.chats.users.push({ ref: chat._id, friend: req.user._id });
  user.chats.users.push({ ref: chat._id, friend: friendedUser._id });

  await friendedUser.save();
  await user.save();

  res.end();
}

module.exports = {
  removeFriendRequest,
  getFriendRequests,
  sendFriendRequest,
  declineFriendRequest,
  acceptFriendRequest,
};
