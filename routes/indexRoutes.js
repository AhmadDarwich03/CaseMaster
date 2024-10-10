const express = require("express");
const router = express.Router();
const index = require("../src/index.js");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");  // Lägg till bcrypt för lösenordshashning
const mysql = require("promise-mysql");
const config = require("../db.json");

// Middleware för session-baserad autentisering
function authMiddleware(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');  // Omdirigera till login om användaren inte är inloggad
    }
    next();
}

// Middleware för admin-auktorisering
function adminMiddleware(req, res, next) {
    if (!req.session || req.session.userRole !== 'admin') {
        return res.status(403).send('Access denied: Admins only');  // Nekad åtkomst om inte admin
    }
    next();
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
router.get("/", authMiddleware, (req, res) => {
    let data = {};
    data.title = "Layout";
    res.render("pages/layout.ejs", data);
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

// Route: Visa alla tickets (endast inloggade användare)
router.get("/tickets-list", authMiddleware, async (req, res) => {
    try {
        let data = {};
        data.title = "All Tickets";
        data.userRole = req.session.userRole;

        // Hämta filtreringsparametrar från GET-förfrågan och använd tom sträng som standard
        const { category = "", status = "" } = req.query;
        data.category = category;
        data.status = status;

        // Hämta kategorierna från databasen för filtermenyn
        const categories = await index.viewCategories();
        data.categories = categories;

        // Skapa en grundläggande SQL-query
        let sql = `SELECT * FROM tickets WHERE user_id = ?`; // Visa endast tickets för den inloggade användaren som standard
        let queryParams = [req.session.userId];

        // Om användaren är admin, visa alla tickets
        if (req.session.userRole === 'admin') {
            sql = `SELECT * FROM tickets WHERE 1=1`; // Visa alla tickets för admins
            queryParams = [];
        }

        // Lägg till filtreringsvillkor beroende på om `category` eller `status` är ifyllda
        if (category && category !== "") {
            sql += ` AND category = ?`;
            queryParams.push(category);
        }

        if (status && status !== "") {
            sql += ` AND status = ?`;
            queryParams.push(status);
        }

        // Hämta de filtrerade resultaten från databasen
        const db = await mysql.createConnection(config);
        const filteredTickets = await db.query(sql, queryParams);
        await db.end();

        // Skicka de filtrerade tickets och filtreringsparametrar till EJS-filen
        data.filteredTickets = filteredTickets;

        res.render("pages/tickets-list.ejs", data);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).send("Internal Server Error");
    }
});


// Route: Hantera kategorier (endast för admin)
router.get("/categories", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const categories = await index.viewCategories();
        res.render("pages/categories.ejs", { categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Lägg till ny kategori (endast för admin)
router.post("/add-category", authMiddleware, adminMiddleware, async (req, res) => {
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
router.post("/delete-category/:id", authMiddleware, adminMiddleware, async (req, res) => {
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

// Route: Registration page
router.get("/register", (req, res) => {
    res.render("pages/register.ejs", { message: "" });
});

router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await index.addUser(username, email, hashedPassword);
        res.redirect("/login");
    } catch (error) {
        console.error("Error registering new user:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Route för att visa detaljerna för en specifik ticket
router.get("/ticket-details/:id", authMiddleware, async (req, res) => {
    const ticketId = req.params.id;

    try {
        let data = {};
        data.title = "Ticket Details";
        data.ticket = await index.getTicketById(ticketId);
        res.render("pages/ticket-details.ejs", data);
    } catch (error) {
        console.error("Error fetching ticket details:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
