const express = require("express");
const router = express.Router();
const User = require("../model/User");
const Message = require("../model/Message");
const fetchuser = require("../fetchuser");

router.post("/addmessage/:id", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("friends");

    const { content } = req.body;
    let message = await Message.create({
      sender: req.user.id,
      content: content,
      receiver: req.params.id,
    });

    await message.save();
    const user1 = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { messages: message._id } },
      { new: true }
    );
    const user2 = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { messages: message._id } },
      { new: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).send("Internal Server Issue");
  }
});

router.delete("/deletemessage/:id", fetchuser, async (req, res) => {
  const user = await User.findByIdAndDelete(
    req.user.id,
    { $pull: { messages: req.params.id } },
    { new: true }
  );
});

router.get("/findallchat/:id", fetchuser, async (req, res) => {
  const user = await User.findById(req.user.id).populate("messages");
  const data = user.messages.filter(
    (message) =>
      (message.sender.toString() === req.user.id &&
        message.receiver.toString() === req.params.id) ||
      (message.sender.toString() === req.params.id &&
        message.receiver.toString() === req.user.id)
  );
  res.json(data);
});

module.exports = router;
