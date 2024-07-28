const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
const server = http.createServer(app);
const port = 5000;
const JWT_SECRET = "fakeJWTtoken";

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const db = new sqlite3.Database(":memory:");

app.use(cors());
app.use(express.json());

db.serialize(() => {
  db.run(
    "CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)"
  );
  db.run(
    "CREATE TABLE messages (id INTEGER PRIMARY KEY, senderId INTEGER, receiverId INTEGER, message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)"
  );
});

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization
    if(!token){
        return res.status(401).send('Access Denied')
    }
    try {
        const verified = jwt.verify(token, JWT_SECRET)
        req.user = verified
        next()
    } catch (error) {
        res.status(400).send('Invalid Token')
    }
}

app.post('/api/register', (req, res) => {
    const [username, password] = req.body
    const hashedPassword = bcrypt.hashSync(password, 10)
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], (err) => {
        if(err){
            return res.status(400).send('Username already exists!')
        }
        res.send('User Registered Successfully!')
    })
})


app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
