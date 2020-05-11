const path = require('path');

const express = require('express');

function staticResourcesFromUtility(app, rootDirectory) {
    /**
     * Serving static files in Express from views/utils directory
     * Most of the requests for these kind of resources will be from EJS Templates
     */
    app.use('/utils', express.static(path.join(rootDirectory, 'views/utils')));
}

function serveEJSTemplates(app) {
    /**
     * Using EJS template engine for server side templating
     * For login, register, forgot password, error pages
     */
    app.set('view engine', 'ejs');
}

function frontendResources(app, rootDirectory) {
    /**
     * Serving static files in Express from client directory
     */
    app.use(express.static(path.join(rootDirectory, 'client')));

    /**
     * Serving Angular App for all other routes
     */
    app.get('*', function(req, res){
        res.sendFile(path.join(rootDirectory, 'client', 'index.html'));
    });
}

module.exports = {
    serveEJSTemplates,
    frontendResources,
    staticResourcesFromUtility
};
