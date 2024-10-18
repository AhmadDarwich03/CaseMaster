"use strict";
const express = require("express");
const session = require("express-session");
const path = require("path");
const indexRoutes = require("./routes/indexRoutes.js");
require('dotenv').config();


const app = express();
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

// Start the server
app.listen(port, logStartUpDetailsToConsole);

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
    console.info('Server is on http://localhost:1337/');
    console.info("Available routes are:");
    console.info(routes);
}

