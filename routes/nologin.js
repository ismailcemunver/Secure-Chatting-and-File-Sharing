const path = require("path");
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const nologinController = require("../controllers/nologin");
const isAuth = require("../middleware/is-auth");

router.get(
  "/register",
  [
    body("username").isString().notEmpty(),
    body("psw").isString().notEmpty(),
    body("pswrepeat").isEmpty().notEmpty(),
  ],
  nologinController.getRegister
);
router.post("/submit", nologinController.postSubmit);
router.post("/loginsubmit", nologinController.postLogin);
router.get("/login", nologinController.getLogin);
router.get("/", nologinController.getMainPage);
module.exports = router;
