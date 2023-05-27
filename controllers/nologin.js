const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.getRegister = (req, res, next) => {
  res.render("register", {
    pageTitle: "Register",
    path: "/",
    errorMessage: req.flash("errorMessage")[0],
  });
};
exports.getLogin = (req, res, next) => {
  const token = req.cookies.token;
  try {
    jwt.verify(token, "cse492");
    res.redirect("/");
  } catch {
    res.render("login", {
      pageTitle: "Login",
      path: "/",
      successMessage: req.flash("successMessage")[0],
      errorMessage: req.flash("errorMessage")[0],
    });
  }
};
exports.postLogin = async (req, res, next) => {
  const result = validationResult(req);
  const errors = result.array();
  let loadedUser;
  if (errors.length > 0) {
    return res.status(422).json(errors);
  }
  const { username, psw } = req.body;
  const existingUser = await User.findOne({
    where: {
      username: username,
    },
  });
  if (!existingUser) {
    req.flash("errorMessage", "Username does not exist!");
    return res.redirect("/login");
  }
  loadedUser = existingUser;
  const correctPassword = await bcrypt.compare(psw, loadedUser.password);
  if (!correctPassword) {
    req.flash("errorMessage", "Wrong password!");
    return res.redirect("/login");
  }
  req.flash("successMessage", "User successfully logged in!");
  const token = jwt.sign(
    {
      username: loadedUser.username,
      userId: loadedUser.id,
    },
    "cse492",
    { expiresIn: "1h" }
  );
  const expireDate = new Date(Date.now() + 3600000);
  res.cookie("token", token, {
    expires: expireDate,
  });
  return res.redirect("/chats");
};

exports.postSubmit = async (req, res, next) => {
  const result = validationResult(req);
  const errors = result.array();
  if (errors.length > 0) {
    return res.status(422).json(errors);
  }
  const { username, psw, pswrepeat } = req.body;
  const existingUser = await User.findOne({
    where: {
      username: username,
    },
  });
  if (existingUser) {
    req.flash("errorMessage", "Username already exists!");
    return res.redirect("/register");
  }

  if (psw !== pswrepeat) {
    req.flash("errorMessage", "Passwords do not match!");
    return res.redirect("/register");
  }
  const hashedPass = await bcrypt.hash(psw, 12); //best practice -> 12
  const user = await User.create({
    username: username,
    password: hashedPass,
  });
  req.flash("successMessage", "User successfully registered");
  req.res.redirect("/login");
};

exports.getMainPage = (req, res, next) => {
  res.render("mainscreen", {
    pageTitle: "Welcome!",
    path: "/",
    successMessage: req.flash("successMessage")[0],
    errorMessage: req.flash("errorMessage")[0],
  });
};
