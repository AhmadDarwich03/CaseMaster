# Ticketing System

This project is a **Ticketing System** developed using **Node.js**, **Express**, **EJS**, and **MySQL** (MariaDB). It allows users to submit tickets regarding various issues, which are then managed by admins and agents. Users can track their ticket progress, and agents can update the status of tickets, add comments, and more.

## Features

- **Ticket Creation**: Users can submit tickets describing issues they are facing.
- **Ticket Management**: Admins and agents can view all tickets, filter them by status, and update ticket progress.
- **User Roles**:
  - **Users**: Can submit tickets and view their own tickets.
  - **Agents**: Can manage tickets (assign to themselves, add progress updates, etc.).
  - **Admins**: Have full control, including managing users and assigning roles.
- **Comment Section**: Agents and admins can add comments to tickets for status updates.
- **Notifications**: Users receive email notifications when their tickets are updated.
- **Unclaimed Tickets**: Admins and agents can view tickets that have not been claimed for more than 3 days.
- **Chat**: A basic chat interface for communication between users, agents, and admins.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Usage](#usage)
4. [File Structure](#file-structure)
5. [Database Setup](#database-setup)
6. [Routes](#routes)
7. [Contributing](#contributing)
8. [License](#license)

## prerequisites

1. Make sure to download Node.js, npm
    [ Node.js Official Website](https://nodejs.org/en)

2. MySQL or MariaDB
    MYSQL: https://dev.mysql.com/doc/mysql-installation-excerpt/5.7/en/

3. To verify installation, run the following commands:
    node -v
    npm -v
    mysql --version


## Installation

To get the project up and running, follow these steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/AhmadDarwich03/ticketing-system.git
    cd ticketing-system
    ```

2. Install dependencies:
    ```bash
    npm install
    ```


3. Create a `.env` file in the root directory and configure the following:
    ```
    DB_HOST=localhost
    DB_USER=root
    DB_PASS=yourpassword of your choice
    DB_NAME=ticketing
    EMAIL_USER=your-email@example.com
    EMAIL_PASS=your-email-password
    ```

4. Set up the database (see below).

5. Start the server:
    ```bash
    npm start
    ```

## Configuration

### Environment Variables

You can configure the following environment variables in your `.env` file:

- **DB_HOST**: Host of the database (e.g., `localhost`).
- **DB_USER**: Database user.
- **DB_PASS**: Database password.
- **DB_NAME**: Name of the database for the project.
- **EMAIL_USER**: Email address used to send notifications.
- **EMAIL_PASS**: Password for the email account.

## Usage

- **Users**: Create tickets by providing details of the issue and uploading relevant attachments (optional).
- **Agents**: Manage tickets, add progress updates, and claim unclaimed tickets.
- **Admins**: Full access to manage users, assign roles, and view all tickets.

Navigate to `http://localhost:1331` to access the system.

### Key Pages

- `/` - Home page.
- `/create` - Create a new ticket.
- `/tickets-list` - View all tickets.
- `/ticket-details/:id` - View details of a specific ticket.
- `/users` - Manage users and roles (admins only).

## File Structure


## Database Setup

1. Create a new MySQL or MariaDB database for the project:
    ```sql
    CREATE DATABASE ticketing;
    ```

2. Import the provided SQL files to set up the database structure:
    ```bash
    mysql -u root -p ticketing < sql/setup.sql
    ```

3. (Optional) Insert test data using the `insert.sql` file:
    ```bash
    mysql -u root -p ticketing < sql/insert.sql
    ```

## Routes

### Ticket Routes

- `GET /` - View the home page.
- `GET /tickets-list` - View a list of all tickets.
- `POST /create` - Create a new ticket.
- `GET /ticket-details/:id` - View details of a specific ticket.
- `POST /ticket/:id/claim` - Claim a ticket.
- `POST /ticket/close/:id` - Close a ticket.

### User Management Routes

- `GET /users` - View all users.
- `POST /edit-role/:id` - Edit a user's role.
- `POST /delete-user/:id` - Delete a user.

## Contributing

Contributions are welcome! Please fork this repository and submit pull requests for any improvements or new features.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
