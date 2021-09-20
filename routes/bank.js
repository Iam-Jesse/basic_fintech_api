const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { verifyToken, validationErrors } = require("../config/helpers");
const { check, validationResult } = require("express-validator");
const axios = require("../config/axios");
const User = mongoose.model("User");
const Bank = mongoose.model("Bank");

router.post(
  "/add",
  verifyToken,
  [
    check("bank_name", "Bank name field is required")
      .notEmpty()
      .trim()
      .escape()
      .toLowerCase(),
    check("bank_code", "This field is required")
      .notEmpty()
      .trim()
      .escape(),
    check("account_num", "Account number field is required")
      .notEmpty()
      .trim()
      .escape()
  ],
  async (req, res) => {
    try {
      if (validationErrors(validationResult(req), res)) {
        return;
      }
      const { bank_name, account_num, bank_code } = req.body;
      const { id, name } = res.locals.user;
      const resolveBank = await axios.get(
        `bank/resolve?account_number=${account_num}&bank_code=${bank_code}`
      );

      if (resolveBank) {
        const { account_name, account_number } = resolveBank.data.data;

        const findBank = await Bank.findOne({ account_number });

        if (findBank) {
          res.json({ error: "Account details already exist" });
        } else {
          if (account_name.toLowerCase() === name) {
            const createBank = await Bank.create({
              bank_name,
              account_name,
              account_number,
              user: id
            });

            if (createBank) {
              res.json({ message: "bank created successfully" });
            }
          } else {
            res.json({
              error: "Your name and the provided account name does not match"
            });
          }
        }
      }
    } catch {
      res.json({error: "Something went wrong!"})
    }
  }
);

module.exports = router;