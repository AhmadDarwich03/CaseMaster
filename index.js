const express = require("express");
const app = express();
const indexRoutes = require("./routes/indexRoutes.js");
const path = require('path');
const port = 1331;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(
        `${new Date().toLocaleString} Got a request on ${req.path} (${
            req.method
        })`
    );
    next();
});

app.use("/", indexRoutes);

app.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
});
