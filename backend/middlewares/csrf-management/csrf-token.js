/**
 * CSRF Token management.
 * For more information and options: https://www.npmjs.com/package/csurf
 */
function initializeCSRFToken (app) {
    /**
     * This middleware checks for valid CSRF token in all incoming requests
     * We have provided a value function which returns CSRF token from request to validate
     * If CSRF token is not valid then it will call next callback with error code 'EBADCSRFTOKEN'
     */
    app.use((req, res, next) => {
        require('csurf')({
            cookie: false,
            value: (req) => req.cookies['XSRF-TOKEN']
        })(req, res, next);
    });

    /**
     * Sets CSRF token for each and every requests.
     * We can set it for individual request too
     * Filter out requests if we don't want CSRF in some request urls
     */
    app.use((req, res, next) => {
        res.cookie('XSRF-TOKEN', req.csrfToken());
        next();
    });
}

module.exports = initializeCSRFToken;
