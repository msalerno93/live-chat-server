const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
cors: {
origin: "",
methods: ["GET", "POST"],
},
});

app.use(cors());
app.use(express.json());

const PORT = 5000;
const JWT_SECRET = "FAKEJWTTOKEN";

const db = new sqlite3.Database("./chat-app.db");

db.serialize(() => {
db.run(
"CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)"
);
db.run(
"CREATE TABLE messages (id INTEGER PRIMARY KEY, senderId INTEGER, receiverId INTEGER, message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)"
);
});

const authMiddleware = (req, res, next) => {
const token = req.headers.authorization;
if (!token) return res.status(401).send("Access Denied");
try {
const verified = jwt.verify(token, JWT_SECRET);
req.user = verified;
next();
} catch (err) {
res.status(400).send("Invalid Token");
}
};

app.post("/api/register", (req, res) => {
const { username, password } = req.body;
const hashedPassword = bcrypt.hashSync(password, 10);
db.run(
"INSERT INTO users (username, password) VALUES (?, ?)",
[username, hashedPassword],
(err) => {
if (err) {
return res.status(400).send("Username already exists");
}
res.send("User Registered!");
}
);
});

app.post("/api/login", (req, res) => {
const { username, password } = req.body;
db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
const validPass = bcrypt.compareSync(password, user.password);
if (err || !user || !validPass) {
return res.status(400).send("Invalid username or password");
}
const token = jwt.sign(
{ id: user.id, username: user.username },
JWT_SECRET
);
res.header("auth-token", token).send(token);
});
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));