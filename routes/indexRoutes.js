const express = require("express");
const router = express.Router();
const index = require("../src/index.js");

router.get("/", (req, res) => {
    let data = {};
    data.title = "Layout";
    res.render("pages/layout.ejs", data);
});

router.get("/create", (req, res) => {
    let data = {};
    data.title = "Create Entry";
    res.render("pages/create.ejs", data);
});

router.post("/create", async (req, res) => {
    try {
        await index.addTicket(req.body);  // Add a new user to the database
        res.redirect("/tickets-list");  // Redirect to the list of tickets
    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/tickets-list", async (req, res) => {
    try {
        let data = {};
        data.title = "Tickets List";
        data.allTickets = await index.viewTickets();  // Fetch all users
        res.render("pages/tickets-list.ejs", data);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
