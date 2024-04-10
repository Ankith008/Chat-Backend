const express = require("express");
const User = require("../model/User");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const fetchuser = require("../fetchuser");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    let unique = uuidv4();
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });
router.post(
  "/adduser",
  upload.single("profile"),
  [
    body("name").isLength({ min: 3 }),
    body("email").isEmail(),
    body("password").isLength({ min: 5 }),
    body("phone").isNumeric(),
  ],
  async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    try {
      const { filename } = req.file;
      const { name, email, phone, password } = req.body;
      let user = await User.findOne({ phone: phone });
      if (user) {
        return res.status(400).send("Phone Number Already Present ");
      }
      const Salt = await bcrypt.genSalt(10);
      const secpass = await bcrypt.hash(password, Salt);

      user = await User.create({
        name: name,
        password: secpass,
        email: email,
        phone: phone,
        profile: filename,
      });

      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, process.env.SECRET_KEY);

      success = true;
      res.json({ success, authtoken });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Issue");
    }
  }
);

router.post(
  "/login",
  [body("email").isEmail(), body("password").isLength({ min: 5 })],
  async (req, res) => {
    let success = false;
    try {
      const error = validationResult(req);
      if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
      }
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).send("Please sign Up first");
      }
      const passwordcompare = await bcrypt.compare(password, user.password);
      if (!passwordcompare) {
        return res.status(400).send("Invalid Credencials");
      }
      const data = {
        user: {
          id: user.id,
        },
      };
      success = true;
      const authtoken = jwt.sign(data, process.env.SECRET_KEY);
      res.json({ success: true, authtoken });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Issue" });
    }
  }
);

router.get("/getsearchuser", async (req, res) => {
  try {
    const query = req.query.searchquery;
    const user = await User.find({ phone: query });
    res.json(user);
  } catch (error) {
    res.status(500).send("Internal Server Issue");
  }
});

router.post("/sendfriendrequest", fetchuser, async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findByIdAndUpdate(
      id,
      { $push: { request: req.user.id } },
      { new: true }
    );
    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.log(error);
  }
});
router.get("/getrequest", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("request");
    res.json({ result: user.request });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Issue");
  }
});

router.post("/accepttherequest/:id", fetchuser, async (req, res) => {
  try {
    const user1 = await User.findById(req.user.id);
    const isAlreadyFriend1 = user1.friends.includes(req.params.id);
    const user2 = await User.findById(req.params.id);
    const isAlreadyFriend2 = user2.friends.includes(req.user.id);
    if (!isAlreadyFriend1) {
      await User.findByIdAndUpdate(
        req.user.id,
        { $push: { friends: req.params.id } },
        { new: true }
      );
      await User.findByIdAndUpdate(
        req.user.id,
        { $pull: { request: req.params.id } },
        { new: true }
      );
    }
    if (!isAlreadyFriend2) {
      await User.findByIdAndUpdate(
        req.params.id,
        { $push: { friends: req.user.id } },
        { new: true }
      );
      await User.findByIdAndUpdate(
        req.params.id,
        { $pull: { request: req.user.id } },
        { new: true }
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).send("Internal Server Issue");
  }
});

router.get("/getallfriends", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("friends");
    res.json(user.friends);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Issue");
  }
});

module.exports = router;
