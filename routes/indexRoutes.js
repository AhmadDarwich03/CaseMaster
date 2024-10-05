const express = require("express");
const router = express.Router();
const index = require("../src/index.js");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");  // Lägg till bcrypt för lösenordshashning

// Middleware for session-based authentication
function authMiddleware(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');  // Redirect to login if not authenticated
    }
    next();
}

function adminMiddleware(req, res, next) {
    if (!req.session || req.session.userRole !== 'admin') {
        return res.status(403).send('Access denied: Admins only');
    }
    next();
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); // Set upload destination
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Generate unique filename
    }
});

// File upload middleware
const upload = multer({ storage: storage });

// Route: Homepage
router.get("/", authMiddleware, (req, res) => {
    let data = {};
    data.title = "Layout";
    res.render("pages/layout.ejs", data);
});

// Route: Create Ticket Page
router.get("/create", authMiddleware, (req, res) => {
    let data = {};
    data.title = "Create Entry";
    res.render("pages/create.ejs", data);
});

// Handle POST /create for ticket creation
router.post("/create", authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const ticketData = req.body;
        ticketData.user_id = req.session.userId; // Link the ticket to the logged-in user
        if (req.file) {
            ticketData.imagePath = req.file.path;  // Store image path if file is uploaded
        }

        await index.addTicket(ticketData);  // Call the function to insert the ticket into the DB
        res.redirect("/tickets-list");
    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Route: View all tickets (Admin only)
router.get("/tickets-list", authMiddleware, async (req, res) => {
    try {
        let data = {};
        data.title = "Tickets List";

        if (req.session.userRole === 'admin') {
            data.allTickets = await index.viewTickets();  // Admin can see all tickets
        } else {
            data.allTickets = await index.viewTicketsByUser(req.session.userId);  // Regular user can only see their own tickets
        }

        res.render("pages/tickets-list.ejs", data);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Route: Close a ticket (only accessible by the ticket owner or admin)
router.get('/ticket/close/:id', authMiddleware, async (req, res) => {
    const ticketId = req.params.id;

    try {
        // Check if the user has permission to close the ticket
        const ticket = await index.getTicketById(ticketId);

        if (ticket.user_id !== req.session.userId && req.session.userRole !== 'admin') {
            return res.status(403).send('Permission denied');
        }

        await index.updateTicketStatus(ticketId, 'Closed');
        res.redirect('/tickets-list');
    } catch (err) {
        console.error('Error closing ticket:', err);
        res.status(500).send('Error closing ticket');
    }
});

// Route: User login page
router.get('/login', (req, res) => {
    res.render('pages/login', { title: 'Login', message: '' });  // Se till att message alltid skickas
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await index.getUserByUsername(username);

        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.userId = user.id;
            req.session.userRole = user.role;
            return res.redirect('/');
        } else {
            res.render('pages/login', { title: 'Login', message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.render('pages/login', { title: 'Login', message: 'Internal Server Error' });
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

module.exports = router;
