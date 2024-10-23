const express = require("express");
const router = express.Router();
const index = require("../src/index.js");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");  // Lägg till bcrypt för lösenordshashning
const mysql = require("promise-mysql");
const config = require("../db.json");
const { sendTicketUpdateEmail } = require('../src/services/emailService');

// Middleware för session-baserad autentisering
function authMiddleware(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');  // Omdirigera till login om användaren inte är inloggad
    }
    next();
}

function adminOrAgentMiddleware(req, res, next) {
    if (req.session.userRole === 'admin' || req.session.userRole === 'agent') {
        return next(); // If user is admin or agent, proceed
    }
    return res.status(403).send('Access denied: Admins and Agents only');
}


// Konfigurera Multer för filuppladdningar
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); // Ställ in destinationen för uppladdningar
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Ger varje fil ett unikt namn
    }
});

// Definiera vilka fält som Multer ska förvänta sig
const upload = multer({ storage: storage });

// Route: Startsida (endast inloggade användare)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const db = await mysql.createConnection(config);

        // SQL query to fetch tickets unclaimed for more than 3 days
        const sql = `
            SELECT id, problem, description, category, tid, status, 
                   DATEDIFF(CURRENT_DATE, tid) AS days_since_created
            FROM tickets
            WHERE claimed = FALSE
            AND DATEDIFF(CURRENT_DATE, tid) >= 3
        `;

        const unclaimedTickets = await db.query(sql);
        await db.end();

        res.render('pages/layout.ejs', { unclaimedTickets });
    } catch (error) {
        console.error('Error fetching unclaimed tickets:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route: Create Ticket Page (endast inloggade användare)
router.get("/create", authMiddleware, async (req, res) => {
    try {
        const categories = await index.viewCategories();
        res.render("pages/create.ejs", { categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Hantera POST /create för att skapa en ticket
router.post("/create", authMiddleware, upload.single('attachment'), async (req, res) => {
    try {
        const ticketData = req.body;
        ticketData.user_id = req.session.userId;  // Använd sessionens `userId` för att koppla ticket till användaren

        // Spara bilduppladdningen om det finns en fil
        if (req.file) {
            ticketData.imagePath = req.file.path;  // Spara bildens sökväg i databasen
        }

        await index.addTicket(ticketData);  // Lägg till ticketen i databasen
        res.redirect("/tickets-list");  
    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).send("Internal Server Error");
    }
});




router.get('/tickets-list', authMiddleware, async (req, res) => {
    try {
        let data = {};
        data.title = "All Tickets";
        data.userRole = req.session.userRole; // Pass the user role for conditional actions

        // Get category, status, and claimed filters from query params
        const { category = "", status = "", claimed = "" } = req.query;
        data.category = category;
        data.status = status;
        data.claimed = claimed;

        // Fetch categories for the filter dropdown
        const categories = await index.viewCategories();
        data.categories = categories;

        // SQL query for fetching filtered tickets
        let sql = `
            SELECT *,
                   IF(claimed = FALSE, DATEDIFF(CURRENT_DATE, tid), NULL) AS days_since_created
            FROM tickets
            WHERE 1=1
        `;
        let queryParams = [];

        // Filter tickets for user role
        if (req.session.userRole !== 'admin' && req.session.userRole !== 'agent') {
            sql += ` AND user_id = ?`; // Show only tickets that belong to the logged-in user
            queryParams.push(req.session.userId);
        }

        // Apply category filter if set
        if (category && category !== "") {
            sql += ` AND category = ?`;
            queryParams.push(category);
        }

        // Apply status filter if set
        if (status && status !== "") {
            sql += ` AND status = ?`;
            queryParams.push(status);
        }

        // Apply claimed filter if set
        if (claimed === "Yes") {
            sql += ` AND claimed = TRUE`; // Only show claimed tickets
        } else if (claimed === "No") {
            sql += ` AND claimed = FALSE`; // Only show unclaimed tickets
        }

        // Fetch filtered tickets from the database
        const db = await mysql.createConnection(config);
        const filteredTickets = await db.query(sql, queryParams);
        await db.end();

        data.filteredTickets = filteredTickets; // Pass the filtered tickets to the view

        res.render('pages/tickets-list.ejs', data); // Render the tickets-list page with data
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).send('Internal Server Error');
    }
});





// Route: Hantera kategorier (endast för admin)
router.get("/categories", authMiddleware, adminOrAgentMiddleware, async (req, res) => {
    try {
        const categories = await index.viewCategories();
        res.render("pages/categories.ejs", { categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send("Internal Server Error");
    }
});


// Lägg till ny kategori (endast för admin)
router.post("/add-category", authMiddleware, adminOrAgentMiddleware,async (req, res) => {
    const { name } = req.body;
    try {
        await index.addCategory(name);
        res.redirect("/categories");
    } catch (error) {
        console.error("Error adding category:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Ta bort en kategori (endast för admin)
router.post("/delete-category/:id", authMiddleware, adminOrAgentMiddleware,async (req, res) => {
    const categoryId = req.params.id;
    try {
        await index.deleteCategory(categoryId);
        res.redirect("/categories");
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Route: Login Page
router.get('/login', (req, res) => {
    res.render('pages/login', { title: 'Login', message: '' });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await index.getUserByUsernameOrEmail(username);

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user.id;
            req.session.userRole = user.role;
            req.session.username = user.username;
            return res.redirect('/');
        } else {
            res.render('pages/login.ejs', { message: 'Invalid username, email, or password' });
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route: Handle logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Error logging out");
        }
        res.redirect('/login');
    });
});

// Route: Registration page
router.get("/register", (req, res) => {
    res.render("pages/register.ejs", { message: "" });
});

router.post("/register", async (req, res) => {
    const { username, email, password, role } = req.body;  // Make sure role is included

    try {
        // Hash the password before saving to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Add the user to the database
        await index.addUser(username, email, hashedPassword, role);

        res.redirect("/");  // Redirect to login after successful registration
    } catch (error) {
        console.error("Error registering new user:", error);
        res.status(500).send("Internal Server Error");
    }
});


router.post('/ticket/close/:id', authMiddleware, async (req, res) => {
    const ticketId = req.params.id;

    try {
        // Fetch the ticket from the database
        const ticket = await index.getTicketById(ticketId);
        console.log('Ticket Data:', ticket); // Check if ticket is valid and contains user_id

        // Check if the ticket exists and has a valid user_id
        if (!ticket || !ticket.user_id) {
            console.log('Ticket or user_id not found');
            return res.status(404).send('Ticket or associated user not found');
        }

        // Fetch the user who created the ticket using the user_id
        const user = await index.getUserById(ticket.user_id); // Use ticket.user_id
        console.log('User Data:', user); // Check if user is valid

        if (!user) {
            console.log('User not found');
            return res.status(404).send('User not found');
        }

        // Update the ticket's status to 'Closed'
        await index.updateTicketStatus(ticketId, 'Closed');

        // Send an email notification (assuming sendTicketUpdateEmail is defined)
        const message = `Your ticket (ID: ${ticket.id}) has been closed.`;
        await sendTicketUpdateEmail(user.email, ticketId, message); // Send email to the user

        res.redirect('/tickets-list');
    } catch (err) {
        console.error('Error closing ticket:', err);
        res.status(500).send('Error closing ticket');
    }
});

router.get("/ticket-details/:id", authMiddleware, async (req, res) => {
    const ticketId = req.params.id;
    try {
        let data = {};
        data.title = "Ticket Details";
        data.ticket = await index.getTicketById(ticketId); // Fetch ticket details
        data.userRole = req.session.userRole;

        // Fetch categories
        data.categories = await index.viewCategories(); // Ensure categories are fetched correctly

        // Fetch ticket progress (if available)
        data.progress = await index.getResolutionByTicketId(ticketId);
        
        console.log("Categories:", data.categories); // Log categories to ensure they are being fetched

        // Render the ticket details page
        res.render("pages/ticket-details.ejs", data);
    } catch (error) {
        console.error("Error fetching ticket details:", error);
        res.status(500).send("Internal Server Error");
    }
});


router.post('/ticket-details/:id/add-progress', authMiddleware, adminOrAgentMiddleware, async (req, res) => {
    const ticketId = req.params.id;
    const agentId = req.session.userId;
    const { action, comment } = req.body;

    try {
        // Add the progress update to the database
        await index.addProgress({
            ticket_id: ticketId,
            agent_id: agentId,
            action,
            comment
        });

        // Fetch ticket information
        const ticket = await index.getTicketById(ticketId);
        console.log('Ticket Data:', ticket); // Log ticket data to debug if necessary

        // Fetch user information
        const user = await index.getUserById(ticket.user_id); // Get the user who owns the ticket

        if (!user) {
            console.error(`User not found for ticket ${ticketId}`);
            return res.status(404).send('User not found');
        }

        // Prepare the email content
        const updateMessage = `A new progress update has been added to your ticket by ${req.session.username}: <strong>${action}</strong>.<br>Comment: ${comment || 'No comment'}`;
        await sendTicketUpdateEmail(user.email, ticketId, updateMessage); // Send the email

        // Redirect back to the ticket details page
        res.redirect(`/ticket-details/${ticketId}`);
    } catch (error) {
        console.error("Error adding progress update:", error);
        res.status(500).send("Internal Server Error");
    }
});


router.post('/ticket/:id/claim', authMiddleware, async (req, res) => {
    const ticketId = req.params.id;

    try {
        // Update the ticket's claimed status to TRUE
        const db = await mysql.createConnection(config);
        const sql = `UPDATE tickets SET claimed = TRUE WHERE id = ?`;
        await db.query(sql, [ticketId]);
        await db.end();

        // Redirect back to the ticket details page after claiming the ticket
        res.redirect(`/ticket-details/${ticketId}`);
    } catch (error) {
        console.error('Error claiming ticket:', error);
        res.status(500).send('Error claiming ticket');
    }
});


router.get('/users', authMiddleware, async (req, res) => {
    try {
        const db = await mysql.createConnection(config);
        const users = await db.query('SELECT * FROM users WHERE role != "admin"'); // Exclude admins
        await db.end();

        res.render('pages/users', { users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/edit-role/:id', authMiddleware, async (req, res) => {
    const userId = req.params.id;
    const newRole = req.body.role;

    try {
        const db = await mysql.createConnection(config);
        const sql = `UPDATE users SET role = ? WHERE id = ?`;
        await db.query(sql, [newRole, userId]);
        await db.end();

        res.redirect('/users'); // Redirect back to the users list after editing the role
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/delete-user/:id', authMiddleware, async (req, res) => {
    const userId = req.params.id;

    try {
        const db = await mysql.createConnection(config);
        const sql = `DELETE FROM users WHERE id = ? AND role != 'admin'`; // Ensure that admin users cannot be deleted
        await db.query(sql, [userId]);
        await db.end();

        res.redirect('/users'); // Redirect back to the users list after deletion
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.get("/signup", (req, res) => {
    res.render("pages/signup.ejs", { message: "" });
});

router.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;  // Make sure role is included

    try {
        // Hash the password before saving to the database
        const hashedPassword = await bcrypt.hash(password, 10);
            console.log("dasjshfhjshfhjhjfahfwahufygegdbbbbbbtyesyesyesyes");
        // Add the user to the database
        await index.addUser(username, email, hashedPassword, "user");

        res.redirect("/");  // Redirect to login after successful registration
    } catch (error) {
        console.error("Error registering new user:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Delete a ticket route
router.post('/ticket/:id/delete', authMiddleware, adminOrAgentMiddleware, async (req, res) => {
    const ticketId = req.params.id;
    
    try {
        // Call a function to delete the ticket from the database
        await index.deleteTicketById(ticketId);
        console.log(`Ticket with ID ${ticketId} deleted successfully`);
        
        // Redirect to the tickets list or home page after deletion
        res.redirect('/tickets-list');
    } catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).send('Error deleting ticket');
    }
});

router.post('/ticket/:id/edit-category', authMiddleware, async (req, res) => {
    const ticketId = req.params.id;
    const newCategory = req.body.category; // The selected category from the dropdown

    try {
        await index.updateTicketCategory(ticketId, newCategory);  // Update ticket category in the database
        res.redirect(`/ticket-details/${ticketId}`);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).send('Internal Server Error');
    }
});



module.exports = router;
