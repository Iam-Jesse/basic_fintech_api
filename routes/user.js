const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const {
  isAuthenticated,
  verifyToken,
  validationErrors
} = require("../config/helpers");
const User = mongoose.model("User");

let loginValidate = [
  check("email", "Use a valid email")
    .isEmail()
    .trim()
    .escape()
    .normalizeEmail(),
  check(
    "password",
    "Password must contain at least 8 characters, one lowercase letter, uppercase letter, number and symbol."
  )
    .isStrongPassword()
    .trim()
    .escape(),
  check("name", "This field is required!")
    .notEmpty()
    .trim()
    .escape()
    .toLowerCase()
];

router.post("/user/register", loginValidate, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (validationErrors(validationResult(req), res)) {
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userAlreadyExist = await User.findOne({ email });

    if (!userAlreadyExist) {
      const createNewUser = await User.create({
        email,
        password: hashedPassword,
        name
      });
      if (createNewUser) {
        let token = jwt.sign(
          { id: createNewUser._id, email: createNewUser.email, name: createNewUser.name },
          process.env.TOKEN_SECRET,
          {
            expiresIn: 86400 // expires in 24 hours
          }
        );
        res.json({ message: "User created successfully", token });
      } else {
        res.json({ error: "Something went wrong, try again" });
      }
    } else {
      res.json({ error: "Something went wrong, try again" });
    }
  } catch (error) {
    res.json({ error: "Something went wrong, try again" });
  }
});

router.post(
  "/user/login",
  passport.authenticate("local", { session: false }),
  (req, res) => {
    let token = jwt.sign(
      { id: req.user._id, email: req.user.email, name: req.user.name },
      process.env.TOKEN_SECRET,
      {
        expiresIn: 86400 // expires in 24 hours
      }
    );
    res.json({ message: "Login successful", token });
  }
);

router.get("/user/logout", verifyToken, (req, res) => {
  res.json({ token: null });
});

module.exports = router;