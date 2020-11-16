let connections;

class ConnectionPool {
    constructor() {
        connections = [];
    }

    get (key) {
        if (key && connections[key]) {
            return connections[key];
        }

        return null;
    }

    register (key, connection) {
        if (key && connection && connection.isConnected()) {
            connections[key] = connection;
        }
    }

    unregister (key) {
        if (key && connections[key]) {
            connections[key] = null;
        }
    }

    generateKey (username) {
        return username.toLowerCase();
    }
}

module.exports = new ConnectionPool();
