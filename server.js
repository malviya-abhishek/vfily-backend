require("dotenv").config();
const express = require("express");
const busboy = require("connect-busboy");
const cors = require("cors");
const app = express();
const httpServer = require("http").createServer(app);

const Emitter = require("events");
const eventEmitter = new Emitter();
app.set("eventEmitter", eventEmitter);

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	})
);

// File upload middleware
app.use(
	busboy({
		highWaterMark: 2 * 1024 * 1024,
	})
);

require("./routes/routes.api.user").routesConfig(app);
require("./routes/routes.api.auth").routesConfig(app);
require("./routes/routes.api.video").routesConfig(app);
require("./routes/routes.api.comment").routesConfig(app);

// Cookie parser and Static file access Don't change the order
// const cookieParser = require("cookie-parser");
// app.use(cookieParser());

const CookieValidationMiddleware = require("./app/http/middleware/auth/cookie.validation.middleware");
app.use([
	cookieParser(),
	CookieValidationMiddleware.validCookieNeeded,
	express.static("public"),
]);

// Don't change the order

app.options("/", (req, res) => {
	res.status(200).send();
});

httpServer.listen(process.env.PORT, () => {
	console.log("Server started at", process.env.PORT);
});

// socket connection
const io = require("socket.io")(httpServer, {
	cors: {
		origin: "http://localhost:3000",
		credentials: true,
	},
});

io.on("connection", (socket) => {
	socket.on("join", (videoId) => {
		socket.join(videoId);
	});
});

eventEmitter.on("commentCreated", (data) => {
	io.to(`video_${data.videoId}`).emit("commentCreated", data);
});


