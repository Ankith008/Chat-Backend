const mongoose = require("mongoose");
const { Schema } = mongoose;
const { moment } = require("moment");

const MessageSchema = new Schema({
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  content: {
    type: String,
  },
  time: {
    type: Date,
    default: Date.now(),
  },
  receiver: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Message", MessageSchema);
