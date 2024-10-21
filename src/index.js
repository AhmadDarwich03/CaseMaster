"use strict";

const config = require("../db.json");
const mysql = require("promise-mysql");


// Funktion för att skapa en anslutning till databasen
async function connectDB() {
    return await mysql.createConnection(config);
}

// Hämta användare baserat på användarnamn
async function getUserByUsernameOrEmail(identifier) {
    const db = await mysql.createConnection(config);

    // Sök efter användare baserat på användarnamn eller e-post
    let sql = `SELECT * FROM users WHERE username = ? OR email = ?`;
    let res = await db.query(sql, [identifier, identifier]);

    await db.end();
    return res[0];  // Returnera första träffen
}



// Lägg till en användare i databasen
async function addUser(username, email, hashedPassword, role) {
    const db = await mysql.createConnection(config);

    let sql = `INSERT INTO users (username, email, password, role)
               VALUES (?, ?, ?, ?);`;

    await db.query(sql, [username, email, hashedPassword, role]);
    await db.end();
}


// Lägg till en ny ticket
async function addTicket(data) {
    const db = await mysql.createConnection(config);

    // Inkludera `user_id` vid skapandet av en ny ticket
    let sql = `INSERT INTO tickets (problem, description, category, imagePath, status, user_id)
               VALUES (?, ?, ?, ?, 'open', ?);`;

    await db.query(sql, [data.problem, data.description, data.category, data.imagePath || null, data.user_id]);
    await db.end();
}


// Hämta alla tickets
async function viewTickets() {
    const db = await connectDB();
    let sql = `CALL get_tickets();`;
    let res = await db.query(sql);
    await db.end();
    return res[0];
}

// Uppdatera status på en ticket
async function updateTicketStatus(id, status) {
    const db = await connectDB();
    let sql = `UPDATE tickets SET status = ? WHERE id = ?;`;
    let res = await db.query(sql, [status, id]);
    await db.end();
    return res;
}

async function getTicketById(ticketId) {
    const db = await mysql.createConnection(config);
    const sql = `SELECT * FROM tickets WHERE id = ?`; // This query should fetch the user_id along with other ticket data
    const result = await db.query(sql, [ticketId]);
    await db.end();
    return result[0]; // Return the first result (ticket)
}


async function filterTickets(category, status) {
    const db = await mysql.createConnection(config);

    // Grundläggande SQL-fråga
    let sql = `SELECT id, problem, description, tid, category, status FROM tickets WHERE 1=1`;

    // Lägg till kategorifilter om det är valt
    if (category) {
        sql += ` AND category = '${category}'`;
    }

    // Lägg till statusfilter om det är valt
    if (status) {
        sql += ` AND status = '${status}'`;
    }

    let res = await db.query(sql);
    await db.end();
    return res;
}
async function viewTicketsByUser(userId) {
    const db = await mysql.createConnection(config);

    // Hämta endast tickets som skapats av den inloggade användaren
    let sql = `SELECT id, problem, description, category, imagePath, tid, status FROM tickets WHERE user_id = ?;`;
    let res = await db.query(sql, [userId]);

    await db.end();
    return res;
}

async function addCategory(name) {
    const db = await mysql.createConnection(config);
    const sql = `INSERT INTO categories (name) VALUES (?);`;
    await db.query(sql, [name]);
    await db.end();
}

// Funktion för att hämta alla kategorier
async function viewCategories() {
    const db = await mysql.createConnection(config);
    const sql = `SELECT * FROM categories;`;
    const res = await db.query(sql);
    await db.end();
    return res;
}

// Funktion för att ta bort en kategori
async function deleteCategory(id) {
    const db = await mysql.createConnection(config);
    const sql = `DELETE FROM categories WHERE id = ?;`;
    await db.query(sql, [id]);
    await db.end();
}

async function getResolutionByTicketId(ticketId) {
    const db = await mysql.createConnection(config);
    const sql = `
        SELECT tp.*, u.username AS agent_name
        FROM ticket_progress tp
        JOIN users u ON tp.agent_id = u.id
        WHERE tp.ticket_id = ?
        ORDER BY tp.created_at ASC;
    `;
    const rows = await db.query(sql, [ticketId]);
    await db.end();
    return rows; // This now returns the agent's name in the result
}


async function addProgress (progressData) {
    const db = await mysql.createConnection(config);
    const sql = 'INSERT INTO ticket_progress (ticket_id, agent_id, action, comment) VALUES (?, ?, ?, ?)';
    const params = [progressData.ticket_id, progressData.agent_id, progressData.action, progressData.comment];
    await db.query(sql, params);
    await db.end();
}


// Fetch ticket details by ID
async function fetchTicketDetailsById(ticketId) {
    const db = await mysql.createConnection(config);
    const result = await db.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    await db.end();
    return result[0];
}

async function getUserById(userId) {
    const db = await mysql.createConnection(config);
    const sql = `SELECT * FROM users WHERE id = ?`;
    const result = await db.query(sql, [userId]);
    await db.end();
    return result[0]; // Return the first result (user)
}





// Exportera alla funktioner så att de kan användas i routes
module.exports = {
    deleteCategory,
    addCategory,
    viewCategories,
    connectDB,               // Exportera connectDB-funktionen
    getUserByUsernameOrEmail,       // Hämta användare baserat på användarnamn
    addUser,                 // Lägg till en ny användare
    addTicket,               // Lägg till en ny ticket
    viewTickets,             // Hämta alla tickets
    updateTicketStatus,      // Uppdatera ticket-status
    getTicketById,            // Hämta en ticket baserat på ID
    filterTickets,
    viewTicketsByUser,
    getResolutionByTicketId,
    addProgress,
    fetchTicketDetailsById,
    getUserById
};
