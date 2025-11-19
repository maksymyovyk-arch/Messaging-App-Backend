const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Group",
  mongoose.Schema({
    users: [{ type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true }],
    title: { type: String, default: "New group", required: true },
    avatar: { type: String, default: "temp", required: true },
    messages: [
      {
        user: { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
        body: { type: String, required: true },
        date: { type: String, default: Date.now, required: true },
      },
    ],
  })
);
