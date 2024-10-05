"use strict";


const config = require("../db.json");
const mysql = require("promise-mysql");

async function addTicket(data) { 
    const db = await mysql.createConnection(config);
    let sql = 'CALL create_ticket(?, ?, ?);';
    await db.query(sql, [data.problem, data.description, data.department]);
    await db.end();
}

async function viewTickets() { 
    const db = await mysql.createConnection(config);
    let sql = 'CALL get_tickets();'; 
    let res = await db.query(sql);
    await db.end();
    return res[0];
}

async function updateTicketStatus(id, status) {
    const db = await mysql.createConnection(config);
    let sql = 'UPDATE tickets SET status = ? WHERE id = ?;'; 
    let res = await db.query(sql, [status, id]);
    await db.end();
    return res[0];
}
function viewTicketsByUser(userId) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM tickets WHERE user_id = ?';
        connection.query(query, [userId], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

// Funktion för att hämta en specifik ticket
function getTicketById(ticketId) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
}


module.exports = {
    addTicket: addTicket,  
    viewTickets: viewTickets, 
    updateTicketStatus: updateTicketStatus,
    viewTicketsByUser: viewTicketsByUser,
    getTicketById: getTicketById,
};
