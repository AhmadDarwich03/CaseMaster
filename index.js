const express = require("express");
const session = require("express-session");
const path = require("path");
const indexRoutes = require("./routes/indexRoutes.js");

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
app.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
});
