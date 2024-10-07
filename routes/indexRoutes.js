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

// function adminMiddleware(req, res, next) {
//     if (!req.session || req.session.userRole !== 'admin') {
//         return res.status(403).send('Access denied: Admins only');
//     }
//     next();
// }

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); // Ställ in destinationen för uppladdningar
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Ger varje fil ett unikt namn
    }
});

// Definiera vilka fält som Multer ska förvänta sig
const upload = multer({
    storage: storage,
});

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
router.post("/create", upload.single('attachment'), async (req, res) => {
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


// Route: View all tickets (Admin only)
router.get("/tickets-list", async (req, res) => {
    try {
        let data = {};
        data.title = "All Tickets";

        // Om användaren är en vanlig användare, visa endast deras egna tickets
        if (req.session.userRole === 'user') {
            data.filteredTickets = await index.viewTicketsByUser(req.session.userId);  // Visa endast användarens tickets
        } else {
            // Om användaren är admin, visa alla tickets
            data.filteredTickets = await index.viewTickets();
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
        // Försök hitta användaren antingen med användarnamn eller e-post
        const user = await index.getUserByUsernameOrEmail(username);  

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user.id;
            req.session.userRole = user.role;
            req.session.username = user.username;
            req.session.email = user.email;

            return res.redirect('/tickets-list');
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

router.get("/register", (req, res) => {
    res.render("pages/register.ejs", { message: "" });  // Skicka med en tom `message`
});


router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Hascha lösenordet innan det sparas i databasen
        const hashedPassword = await bcrypt.hash(password, 10);

        // Lägg till användaren i databasen
        await index.addUser(username, email, hashedPassword);

        res.redirect("/login");  // Skicka användaren till inloggningssidan efter registrering
    } catch (error) {
        console.error("Error registering new user:", error);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/tickets-list", async (req, res) => {
    try {
        let data = {};
        data.title = "All Tickets";
        data.allTickets = await index.viewTickets();  // Hämta alla tickets från databasen
        res.render("pages/tickets-list.ejs", data);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Route för att visa detaljerna för en specifik ticket
router.get("/ticket-details/:id", async (req, res) => {
    const ticketId = req.params.id;  // Hämta id från URL:en

    try {
        let data = {};
        data.title = "Ticket Details";
        data.ticket = await index.getTicketById(ticketId);  // Hämta detaljer för en specifik ticket
        res.render("pages/ticket-details.ejs", data);  // Rendera details-sidan
    } catch (error) {
        console.error("Error fetching ticket details:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
