const { Router } = require('express');
const PautaController = require('../controllers/PautaController');

const routes = new Router();

routes.post('/pautas', PautaController.store);
routes.get('/pautas', PautaController.index);
routes.get('/pautas/:id', PautaController.show);

module.exports = routes;