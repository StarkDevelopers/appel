/**
 * For more config options: https://github.com/coopernurse/node-pool
 */

module.exports = (server, username, password, database = 'appelDB', port = 27017) => {
    const user = encodeURIComponent(username);
    const pwd = encodeURIComponent(password);

    const connectionOptions = new ConnectionOptions()
        .setAuthSource(database)
        .setAuthMechanism('DEFAULT')
        .setKeepAlive(true)
        .setPoolSize(30)
        .setAutoReconnect(true)
        .setSocketTimeoutMS(360000)
        .setConnectTimeoutMS(360000)
        .getOptions();

    return [
        `mongodb://${user}:${pwd}@${server}:${port}/${database}?${connectionOptions}`,
        { useUnifiedTopology: true }
    ];
}

class ConnectionOptions {
    constructor() {
        this.options = [];
    }

    getOptions() {
        return this.options.join('&');
    }

    setAuthSource(authSource = 'expense-manager') {
        this.options.push(`authSource=${authSource}`);
        return this;
    }

    setAuthMechanism(authMechanism = 'DEFAULT') {
        this.options.push(`authMechanism=${authMechanism}`);
        return this;
    }

    setKeepAlive(keepAlive = true) {
        this.options.push(`keepAlive=${keepAlive}`);
        return this;
    }

    setPoolSize(poolSize = 30) {
        this.options.push(`poolSize=${poolSize}`);
        return this;
    }

    setAutoReconnect(autoReconnect = true) {
        this.options.push(`autoReconnect=${autoReconnect}`);
        return this;
    }

    setSocketTimeoutMS(socketTimeoutMS = 360000) {
        this.options.push(`socketTimeoutMS=${socketTimeoutMS}`);
        return this;
    }

    setConnectTimeoutMS(connectTimeoutMS = 360000) {
        this.options.push(`connectTimeoutMS=${connectTimeoutMS}`);
        return this;
    }
}
