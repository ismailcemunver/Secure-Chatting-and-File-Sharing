const { validationResult } = require("express-validator");
const User = require("../models/user");
const Friend = require("../models/friend");
const path = require("path");
const socketio = require("socket.io");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const io = require("../socket");
const { Op } = require("sequelize");
const PrivateMessage = require("../models/private-message");
const GroupMessage = require("../models/group-message");
const expressAsyncHandler = require("express-async-handler");
const Group = require("../models/group");
const UserGroup = require("../models/usergroup");
const { send } = require("process");
const { get } = require("http");
exports.getChats = async (req, res, next) => {
  const friendArray = await Friend.findAll({
    where: {
      sender: req.token.userId,
    },
    include: [
      {
        model: User,
        foreignKey: "sender",
        as: "senderUser",
      },
      {
        model: User,
        foreignKey: "receiver",
        as: "receiverUser",
      },
    ],
  });
  const userGroups = await UserGroup.findAll({
    where: {
      user: req.token.userId,
    },
    include: [
      {
        model: Group,
        foreignKey: "groupid",
        as: "groups",
      },
    ],
  });
  const getUsername = await User.findOne({
    where: {
      id: req.token.userId,
    },
  });
  res.render("chats", {
    pageTitle: `Welcome ${getUsername.username}!`,
    path: "/",
    getUsername,
    successMessage: req.flash("successMessage")[0],
    errorMessage: req.flash("errorMessage")[0],
    friendList: friendArray,
    userGroups,
  });
};
exports.addUser = async (req, res, next) => {
  try {
    const result = validationResult(req);
    const errors = result.array();
    if (errors.length > 0) {
      return res.status(422).json(errors);
    }

    const senderId = req.token.userId;
    const { friendUsername } = req.body;
    const existingUser = await User.findOne({
      where: { username: friendUsername },
    });
    let loadedUser;
    if (!existingUser) {
      req.flash("errorMessage", "Username does not exist!");
      return res.redirect("/chats");
    } else if (senderId === existingUser.id) {
      req.flash("errorMessage", "You cannot add yourself!");
      return res.redirect("/chats");
    } else {
      const existingFriend = await Friend.findOne({
        where: {
          sender: senderId,
          receiver: existingUser.id,
        },
      });
      if (existingFriend) {
        req.flash("errorMessage", "You are already friends with that user!");
        return res.redirect("/chats");
      }
      const friend = await Friend.create({
        sender: senderId,
        receiver: existingUser.id,
      });
      req.flash("successMessage", "User added!");
      return res.redirect("/chats");
    }
  } catch {
    res.redirect("/login");
  }
};

exports.getUserMessages = async (req, res, next) => {
  const friendId = req.params.userId;
  const sender = req.token.userId;
  if (sender == friendId) {
    return res.status(400).json("You cannot send a message to yourself");
  }
  const existingUser = await User.findOne({
    where: {
      id: friendId,
    },
  });
  const senderUser = await User.findOne({
    where: {
      id: sender,
    },
  });
  if (!existingUser) {
    return res.render("404");
  }
  const chatHistory = await PrivateMessage.findAll({
    where: {
      [Op.or]: [
        {
          [Op.and]: [
            { sender: req.token.userId },
            { receiver: req.params.userId },
          ],
        },
        {
          [Op.and]: [
            { sender: req.params.userId },
            { receiver: req.token.userId },
          ],
        },
      ],
    },
  });
  res.render("chatscreen", {
    pageTitle: `Private: ${existingUser.username}`,
    path: "/",
    friend: existingUser,
    sender: senderUser,
    successMessage: req.flash("successMessage")[0],
    errorMessage: req.flash("errorMessage")[0],
    chatHistory,
  });
};

exports.sendPrivateMessage = expressAsyncHandler(async (req, res, next) => {
  const sender = req.token.userId;
  const receiver = req.params.userId;
  const { messageContent } = req.body;

  let path;
  if (req.file) {
    path = req.file.filename;
  }

  if (sender == receiver) {
    return res.status(400).json("Sender cannot be the same as receiver");
  }

  const user = await User.findByPk(receiver);
  if (!user) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  await PrivateMessage.create({
    sender,
    receiver,
    messageContent,
    timestamp: new Date(),
    fileUrl: path || null,
  });

  io.getIO()
    .of("/chats/users")
    .to(receiver)
    .emit("private_message", {
      from: sender,
      to: user.id,
      content: messageContent,
      fileUrl: path || null,
    });

  res.json({ message: "OK", fileUrl: path || null });
});

exports.getPrivateFile = async (req, res, next) => {
  const fileUrl = req.params.fileUrl;
  const filePath = path.join("fileUpload", fileUrl);
  const isTrueUser = await User.findOne({
    where: {
      id: req.token.userId,
    },
  });
  if (!isTrueUser) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  const findUsers = await PrivateMessage.findOne({
    where: {
      fileUrl: `${req.params.fileUrl}`,
    },
  });
  const fileSender = findUsers.sender;
  const fileReceiver = findUsers.receiver;
  const existingFriendship = await Friend.findOne({
    where: {
      [Op.or]: [
        {
          [Op.and]: [{ sender: fileSender }, { receiver: fileReceiver }],
        },
        {
          [Op.and]: [{ sender: fileReceiver }, { receiver: fileSender }],
        },
      ],
    },
  });
  if (!existingFriendship) {
    return res
      .status(403)
      .render("403", { pageTitle: "Unauthorized", path: "/" });
  }
  if (req.token.userId == fileSender || req.token.userId == fileReceiver) {
    fs.readFile(
      path.join(".", "fileUpload", "privateFiles", fileUrl),
      (err, data) => {
        if (err) {
          return next(err);
        }
        res.send(data);
      }
    );
  } else {
    return res
      .status(403)
      .render("403", { pageTitle: "Unauthorized", path: "/" });
  }
};

exports.getCreateGroup = expressAsyncHandler(async (req, res, next) => {
  const friendArray = await Friend.findAll({
    where: {
      sender: req.token.userId,
    },
    include: [
      {
        model: User,
        foreignKey: "sender",
        as: "senderUser",
      },
      {
        model: User,
        foreignKey: "receiver",
        as: "receiverUser",
      },
    ],
  });
  res.render("creategroup", {
    pageTitle: "Create Group",
    path: "/",
    successMessage: req.flash("successMessage")[0],
    errorMessage: req.flash("errorMessage")[0],
    friendArray,
  });
});

exports.submitGroup = expressAsyncHandler(async (req, res, next) => {
  const { groupName } = req.body;
  const { friend } = req.body;
  const userIdArray = [];
  let userCounter = 1;
  if (!groupName) {
    req.flash("errorMessage", "You must give name to a group!");
    return res.redirect("/chats/creategroup");
  }
  if (!friend) {
    req.flash("errorMessage", "You must choose at least 2 friends!");
    return res.redirect("/chats/creategroup");
  }
  const existingUser = await User.findAll({
    where: { username: friend },
  });
  for (let i = 0; i < existingUser.length; i++) {
    userCounter++;
  }
  if (userCounter <= 2) {
    req.flash("errorMessage", "Not Enough Users!");
    return res.redirect("/chats/creategroup");
  }

  const group = await Group.create({
    title: groupName,
  });
  const groupId = await Group.findOne({
    where: {
      title: groupName,
    },
  });
  userIdArray.push({ user: req.token.userId, groupid: groupId.id });
  for (let i = 0; i < existingUser.length; i++) {
    userIdArray.push({ user: existingUser[i].id, groupid: groupId.id });
  }
  await UserGroup.bulkCreate(userIdArray);
  req.flash("successMessage", "Group successfully created");
  return res.redirect("/chats");
});

exports.getGroupMessages = async (req, res, next) => {
  const groupId = req.params.groupId;
  const sender = req.token.userId;
  const senderUser = await User.findOne({
    where: {
      id: sender,
    },
  });
  console.log(senderUser.username);
  if (!senderUser) {
    return res.render("404");
  }
  const groupMemberId = await UserGroup.findOne({
    where: {
      [Op.and]: [{ user: sender }, { groupid: groupId }],
    },
  });
  if (!groupMemberId) {
    return res.render("403", { pageTitle: "Forbidden", path: "/" });
  }
  if (groupMemberId.groupid != groupId)
    return res.render("403", { pageTitle: "Forbidden", path: "/" });

  const allMembers = await UserGroup.findAll({
    where: {
      [Op.and]: [
        {
          [Op.not]: [{ id: req.token.userId }],
        },
        { groupid: groupId },
      ],
    },
  });
  const uName = await User.findOne({
    where: {
      id: groupMemberId.user,
    },
  });
  const groupName = await Group.findOne({
    where: {
      id: groupId,
    },
  });
  console.log(uName.username);
  res.render("groupchatscreen", {
    pageTitle: `Group: ${groupName.title}`, //ISIM EKLE
    path: "/",
    groupId,
    sender: senderUser.username,
    senderId: senderUser.id,
    username: groupMemberId.username,
    userTab: groupMemberId.groupid,
    successMessage: req.flash("successMessage")[0],
    errorMessage: req.flash("errorMessage")[0],
  });
};

exports.sendGroupMessage = expressAsyncHandler(async (req, res, next) => {
  const sender = req.token.userId;
  const receiver = req.params.groupId;
  const { messageContent } = req.body;
  let path;
  if (req.file) {
    path = req.file.filename;
  }

  const group = await Group.findByPk(receiver);
  if (!group) {
    return res.status(400).json({ message: "Invalid group" });
  }
  const legitMessage = await UserGroup.findOne({
    where: {
      [Op.and]: [{ user: sender }, { groupid: receiver }],
    },
  });
  if (!legitMessage) {
    return res.render("403", { pageTitle: "Forbidden", path: "/" });
  }
  if (legitMessage.groupid != req.params.groupId) {
    return res.render("403", { pageTitle: "Forbidden", path: "/" });
  }
  const senderUsername = await User.findOne({
    where: {
      id: sender,
    },
  });
  await GroupMessage.create({
    sender,
    receiver,
    messageContent,
    timestamp: new Date(),
    fileUrl: path || null,
  });
  io.getIO()
    .of("/chats/groups")
    .to(receiver)
    .emit("group_message", {
      from: sender,
      to: receiver,
      content: messageContent,
      fileUrl: path || null,
      username: senderUsername.username,
    });
  res.json({ message: "OK", fileUrl: path || null });
});

exports.getGroupFile = async (req, res, next) => {
  const fileUrl = req.params.fileUrl;
  const filePath = path.join("fileUpload", fileUrl);
  const isTrueUser = await User.findOne({
    where: {
      id: req.token.userId,
    },
  });
  if (!isTrueUser) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  const findGroups = await GroupMessage.findOne({
    where: {
      fileUrl: `${req.params.fileUrl}`,
    },
  });
  const downloadable = await UserGroup.findOne({
    where: {
      [Op.and]: [{ user: req.token.userId }, { groupid: findGroups.receiver }],
    },
  });
  if (!downloadable) {
    return res.status(403).render("403", { pageTitle: "Forbidden", path: "/" });
  } else {
    fs.readFile(
      path.join(".", "fileUpload", "groupFiles", fileUrl),
      (err, data) => {
        if (err) {
          return next(err);
        }
        res.send(data);
      }
    );
  }
};
