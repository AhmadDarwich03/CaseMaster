"use strict";
const express = require("express");
const session = require("express-session");
const path = require("path");
const http = require("http"); // Add this for Socket.io to work
const socketIo = require("socket.io"); // Import socket.io
const indexRoutes = require("./routes/indexRoutes.js");
require('dotenv').config();

const app = express();
const server = http.createServer(app); // Use http server for socket.io
const io = socketIo(server); // Initialize Socket.io

const port = 1331;

// Configure session
app.use(session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Use true for HTTPS
}));
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));
// Middleware for serving static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("public"));

// Set EJS as template engine
app.set("view engine", "ejs");

// Middleware to handle POST requests
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toLocaleString()} Got a request on ${req.path} (${req.method})`);
    next();
});
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Use the routes from indexRoutes.js
app.use("/", indexRoutes);

// Setup Socket.io for real-time chat functionality
io.on("connection", (socket) => {
    console.log("A user connected: " + socket.id);

    // Listen for incoming messages from the client
    socket.on("sendMessage", (data) => {
        console.log(`Message from ${data.user}: ${data.message}`);
        
        // Broadcast the message to all connected clients
        io.emit("message", { user: data.user, message: data.message });
    });

    // Handle user disconnecting
    socket.on("disconnect", () => {
        console.log("A user disconnected: " + socket.id);
    });
});

// Start the server
server.listen(port, logStartUpDetailsToConsole); // Use `server` instead of `app.listen`

/**
 * Log app details to console when starting up.
 * @return {void}
 */
function logStartUpDetailsToConsole() {
    let routes = [];

    // Find what routes are supported
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            // Routes registered directly on the app
            routes.push(middleware.route);
        } else if (middleware.name === "router") {
            // Routes added as router middleware
            middleware.handle.stack.forEach((handler) => {
                let route;

                route = handler.route;
                route && routes.push(route);
            });
        }
    });

    console.info(`Server is listening on port ${port}.`);
    console.info('Server is on http://localhost:1331/'); // Corrected the port here
    console.info("Available routes are:");
    console.info(routes);
}
