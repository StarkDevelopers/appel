const MongoClient = require('mongodb').MongoClient;

const connectionPool = require('./connection-pool');
const buildConfig = require('../config/mongodb-config');

class DBConnection {
    constructor () {}

    /**
     * @returns {MongoClient} MongoDB Connection
     */
    async getConnection () {
        const server = process.env.MONGODB_SERVER;
        const admin = process.env.MONGODB_DATABASE_ADMIN;
        const password = process.env.MONGODB_DATABASE_ADMIN_PASSWORD;
        const database = process.env.MONGODB_DATABASE;
        const port = process.env.MONGODB_PORT;

        const connectionKey = connectionPool.generateKey(admin);

        let connection = connectionPool.get(connectionKey);

        if (connection && connection.isConnected()) {
            return connection;
        }

        const config = buildConfig(server, admin, password, database, port);

        connection = await this.makeConnection(config);

        connectionPool.register(connectionKey, connection);

        return connection;
    }

    /**
     * @param {string[]} config
     * @returns {MongoClient} MongoDB Connection
     */
    async makeConnection (config) {
        const client = new MongoClient(...config);
        try {
            return await client.connect();
        } catch (exception) {
            throw exception;
        }
    }

    removeConnection(admin) {
        const connectionKey = connectionPool.generateKey(admin);

        connectionPool.unregister(connectionKey);
    }
}

module.exports = new DBConnection();
