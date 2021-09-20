const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const mongoose = require("mongoose");
const { verifyToken, validationErrors } = require("../config/helpers");
const { check, validationResult } = require("express-validator");
const axios = require("../config/axios");
const User = mongoose.model("User");
const Transaction = mongoose.model("Transaction");
const Bank = mongoose.model("Bank");

router.post(
  "/deposit",
  verifyToken,
  check("amount", "This field is required")
    .notEmpty()
    .trim()
    .escape(),
  async (req, res) => {
    try {
      const { amount } = req.body;
      if (validationErrors(validationResult(req), res)) {
        return;
      }

      if (isNaN(Number(amount))) {
        return res.json({ error: "Invalid amount" });
      }

      const { id, email } = res.locals.user;
      const newTransaction = await Transaction.create({
        type: "deposit",
        user: id
      });

      if (newTransaction) {
        const sendToPaystack = await axios.post(
          "transaction/initialize",
          JSON.stringify({
            email,
            amount: amount * 100,
            reference: newTransaction._id
          })
        );

        if (sendToPaystack.data.status) {
          res.json({
            paystack_authorization_url:
              sendToPaystack.data.data.authorization_url
          });
        }
      } else {
        return res.json({ error: "Something went wrong!" });
      }
    } catch (error) {
      return res.json({ error: "Something went wrong!" });
    }
  }
);

router.post("/webhook", async (req, res) => {
  let hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");
  if (hash == req.headers["x-paystack-signature"]) {
    if (req.body.event === "charge.success") {
      let { reference, amount, paid_at, channel } = req.body.data;
      if (!mongoose.Types.ObjectId.isValid(reference)) {
        return;
      }
      let findTransaction = await Transaction.findOne({ _id: reference });

      if (findTransaction) {
        findTransaction.status = "success";
        findTransaction.save();

        let updateUser = await User.updateOne(
          { _id: findTransaction.user },
          { $inc: { balance: amount / 100 } }
        );
      } else {
        res.sendStatus(400);
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

router.post(
  "/transfer",
  verifyToken,
  [
    check("email", "Email address is invalid")
      .isEmail()
      .trim()
      .escape(),
    check("amount", "This field is required")
      .notEmpty()
      .trim()
      .escape()
  ],
  async (req, res) => {
    const { email, amount } = req.body;
    const { id: _id } = res.locals.user;
    
    try {
      if (validationErrors(validationResult(req), res)) {
        return;
      }

      if (isNaN(Number(amount))) {
        return res.json({ error: "Invalid amount" });
      }

      const userExists = await User.findOne({ email });
      if (!userExists) {
        return res.json({ error: "User account does not exist" });
      }

      let debit = await User.findOne({ _id });

      if (debit && debit.balance >= amount) {
        let old_balance = debit.balance;
        debit.balance -= Number(amount);
        debit.save();

        let credit = await User.updateOne(
          { email },
          { $inc: { balance: Number(amount) } }
        );
        if (credit) {
          res.json({
            message: "transfer successful",
            old_balance,
            new_balance: debit.balance,
            amount_transferred: amount
          });
        }
      } else {
        res.json({ error: "Insufficient fund" });
      }
    } catch (error) {
      res.json({ error: "Something went wrong!" });
    }
  }
);

router.post(
  "/withdraw",
  verifyToken,
  [
    check("amount", "Amount field is required")
      .notEmpty()
      .trim()
      .escape(),
    check("account_number", "Account number field is required")
      .notEmpty()
      .trim()
      .escape(),
    check("bank_code", "Bank code field is required")
      .notEmpty()
      .trim()
      .escape()
  ],
  async (req, res) => {
    const { amount, account_number, bank_code } = req.body;
    const { id } = res.locals.user;
    let recipient_code;

    if (validationErrors(validationResult(req), res)) {
      return;
    }
    
    if (isNaN(Number(amount))) {
      return res.json({ error: "Invalid amount" });
    }

    const findBank = await Bank.findOne({ account_number });

    if (findBank && findBank.user == id) {
      if (!findBank.recipient_code) {
        const createRecipient = await axios.post(
          "transferrecipient",
          JSON.stringify({
            type: "nuban",
            account_number,
            bank_code
          })
        );

        if (createRecipient) {
          const { recipient_code } = createRecipient.data.data;
          recipient_code = recipient_code;
          findBank.recipient_code = recipient_code;
          findBank.save();
        }
      } else {
        recipient_code = findBank.recipient_code;
      }
      const findUser = await User.findOne({_id: id});

      if (findUser && findUser.balance >= Number(amount)) {
        let old_balance = findUser.balance;
        findUser.balance -= Number(amount);
        const saved = await findUser.save();
        
        if(saved){
          const transferMoney = await axios.post(
            "transfer",
            JSON.stringify({
              source: "balance",
              amount: amount * 100,
              recipient: recipient_code
            })
          );
        }
        res.json({ message: "widthdrawal intiated", amount, old_balance, new_balance: findUser.balance, account_number });
      }else{
        res.json({error: 'Insufficient fund'});
      }
    } else {
      res.json({ error: "Invalid bank details" });
    }
  }
);

module.exports = router;
