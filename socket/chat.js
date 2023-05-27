const io = require("../socket");
const jwt = require("jsonwebtoken");
const chatNamespace = io.getIO().of("/chats/users");
const groupChatNamespace = io.getIO().of("/chats/groups");
const UserGroup = require("../models/usergroup");
const Group = require("../models/group");
const { Op } = require("sequelize");

chatNamespace
  .use(function (socket, next) {
    if (socket.handshake.query && socket.handshake.query.token) {
      try {
        const decoded = jwt.verify(socket.handshake.query.token, "cse492");
        socket.token = decoded;
        next();
      } catch (error) {
        console.log(error);
        next(new Error("Socket authentication failed"));
      }
    }
  })
  .on("connection", (socket) => {
    const senderId = "" + socket.token.userId;
    //group a yetkili mi -> sender id=> groupid
    socket.join(senderId);
  });

groupChatNamespace
  .use(function (socket, next) {
    if (socket.handshake.query && socket.handshake.query.token) {
      try {
        const decoded = jwt.verify(socket.handshake.query.token, "cse492");
        socket.token = decoded;
        next();
      } catch (error) {
        console.log(error);
        next(new Error("Socket authentication failed"));
      }
    }
  })
  .on("connection", async (socket) => {
    const senderId = "" + socket.token.userId;
    let groupArray = [];
    const userGroup = await UserGroup.findAll({
      where: {
        user: senderId,
      },
    });
    for (let i in userGroup) {
      groupArray.push("" + userGroup[i].groupid);
    }
    socket.join(groupArray);
  });
