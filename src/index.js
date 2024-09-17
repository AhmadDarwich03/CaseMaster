"use strict";

const config = require("../config/tickting.json");
const mysql = require("promise-mysql");

async function addTicket(data) { 
    const db = await mysql.createConnection(config);
    let sql = `CALL create_ticket(?, ?);`;
    await db.query(sql, [data.problem, data.description]);
    await db.end();
}

async function viewTickets() { 
    const db = await mysql.createConnection(config);
    let sql = `CALL get_tickets();`; 
    let res = await db.query(sql);
    await db.end();
    return res[0];
}

module.exports = {
    addTicket: addTicket,  
    viewTickets: viewTickets,  
};
