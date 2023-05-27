const express = require("express");
const db = require("./util/database");
const bodyParser = require("body-parser");
const app = express();
const chatRoutes = require("./routes/chats");
const authRoutes = require("./routes/nologin");
const errorController = require("./controllers/error");
const path = require("path");
const https = require("https");
const http = require("http");
const exp = require("constants");
const expressSession = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const fs = require("fs");
const socketio = require("socket.io");
try {
  fs.mkdirSync("fileUpload");
} catch {}

const httpsServer = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, "certificates", "key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "certificates", "cert.pem")),
  },
  app
);
app.use(cookieParser());
app.use(
  expressSession({
    cookie: { maxAge: 60000 },
    secret: "cse492",
    resave: false,
    saveUninitialized: false,
  })
);
const User = require("./models/user");
const Friend = require("./models/friend");
const Group = require("./models/group");
const UserGroup = require("./models/usergroup");
const { group } = require("console");
User.hasMany(Friend, { foreignKey: "sender", as: "senderUser" });
Friend.belongsTo(User, { foreignKey: "sender", as: "senderUser" });
User.hasMany(Friend, { foreignKey: "receiver", as: "receiverUser" });
Friend.belongsTo(User, { foreignKey: "receiver", as: "receiverUser" });
Group.hasMany(UserGroup, { foreignKey: "groupid", as: "groups" });
UserGroup.belongsTo(Group, { foreignKey: "groupid", as: "groups" });
UserGroup.hasMany(User, { foreignKey: "user" });
User.belongsTo(UserGroup, { foreignKey: "user" });
app.use(flash());
app.set("view engine", "ejs");
app.set("views", "views");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(chatRoutes); //oturum acinca olacak reqestler.
app.use(authRoutes); //unauthenticated kullanici icin requestler.
app.use(errorController.get404); //error
db.sync({ alter: true })
  .then((data) => {
    httpsServer.listen(443);
  })
  .catch((error) => {
    console.log(error);
  }); // to write dynamically to db
const io = require("./socket").init(httpsServer);
