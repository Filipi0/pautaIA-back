const { Router } = require('express');
const PautaController = require('../controllers/PautaController');

const routes = new Router();

routes.post('/pautas', PautaController.salvarRedacao);
routes.get('/pautas', PautaController.listarRedacoes);
routes.get('/pautas/:id', PautaController.buscarPorId);

module.exports = routes;