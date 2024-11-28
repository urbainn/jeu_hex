express = require('express');

module.exports = function routesServeurHTTP(app) {

    app.get('/', (req, res) => {
        res.sendFile('html/client.html', {root: __dirname});
    });

    app.get('/test', (req, res) => {
        res.sendFile('html/partie.html', {root: __dirname});
    });

    app.use('/public', express.static('./src/public'));

}