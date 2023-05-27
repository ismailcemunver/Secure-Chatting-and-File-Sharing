const path = require("path");
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const chatsController = require("../controllers/chats");
const isAuth = require("../middleware/is-auth");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join("fileUpload", "privateFiles"));
  },
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});
const groupStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join("fileUpload", "groupFiles"));
  },
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "text/plain" ||
    file.mimetype === "application/zip" ||
    file.mimetype === "application/x-zip-compressed" ||
    file.mimetype === "application/octet-stream" ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
    console.log(file.mimetype);
  } else {
    console.log(file.mimetype);
    cb(null, false);
  }
};
const uploader = multer({ storage: storage, fileFilter: fileFilter });
const groupUploader = multer({ storage: groupStorage, fileFilter: fileFilter });
router.post("/adduser", isAuth, chatsController.addUser);
router.get("/chats", isAuth, chatsController.getChats);
router.get("/chats/users/:userId", isAuth, chatsController.getUserMessages);
router.get(
  "/fileUpload/privateFiles/:fileUrl",
  isAuth,
  chatsController.getPrivateFile
);
router.get("/chats/creategroup", isAuth, chatsController.getCreateGroup);
router.post("/chats/submitgroup", isAuth, chatsController.submitGroup);
router.get("/chats/groups/:groupId", isAuth, chatsController.getGroupMessages);
router.get(
  "/fileUpload/groupFiles/:fileUrl",
  isAuth,
  chatsController.getGroupFile
);
router.post(
  "/chats/send-to-user/:userId",
  isAuth,
  uploader.single("messageFile"),
  chatsController.sendPrivateMessage
);
router.post(
  "/chats/send-to-group/:groupId",
  isAuth,
  groupUploader.single("messageFile"),
  chatsController.sendGroupMessage
);

module.exports = router;
