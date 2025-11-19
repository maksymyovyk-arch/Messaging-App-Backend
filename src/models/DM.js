const mongoose = require("mongoose");

module.exports = mongoose.model(
  "DM",
  mongoose.Schema({
    users: [{ type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true }],
    messages: [
      {
        user: { type: mongoose.SchemaTypes.ObjectId, ref: "User", required: true },
        body: { type: String, required: true },
        date: { type: String, default: Date.now, required: true },
      },
    ],
  })
);
