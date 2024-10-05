"use strict";

const config = require("../db.json");
const mysql = require("promise-mysql");

// Funktion för att skapa en anslutning till databasen
async function connectDB() {
    return await mysql.createConnection(config);
}

// Hämta användare baserat på användarnamn
async function getUserByUsername(username) {
    const db = await connectDB();  // Använder connectDB-funktionen för att ansluta till databasen

    let sql = `SELECT * FROM users WHERE username = ?`;
    let res = await db.query(sql, [username]);
    await db.end();
    return res[0];
}

// Lägg till en användare i databasen
async function addUser(user) {
    const db = await connectDB();
    let sql = `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`;
    await db.query(sql, [user.username, user.password, user.role]);
    await db.end();
}

// Lägg till en ny ticket
async function addTicket(data) {
    const db = await connectDB();
    let sql = `CALL create_ticket(?, ?, ?);`;
    await db.query(sql, [data.problem, data.description, data.department]);
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

// Hämta en specifik ticket baserat på ID
async function getTicketById(ticketId) {
    const db = await connectDB();
    let sql = `SELECT * FROM tickets WHERE id = ?`;
    let res = await db.query(sql, [ticketId]);
    await db.end();
    return res[0];
}

// Exportera alla funktioner så att de kan användas i routes
module.exports = {
    connectDB,               // Exportera connectDB-funktionen
    getUserByUsername,       // Hämta användare baserat på användarnamn
    addUser,                 // Lägg till en ny användare
    addTicket,               // Lägg till en ny ticket
    viewTickets,             // Hämta alla tickets
    updateTicketStatus,      // Uppdatera ticket-status
    getTicketById            // Hämta en ticket baserat på ID
};
