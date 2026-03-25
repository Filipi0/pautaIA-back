const { Router } = require('express');
const PautaController = require('../controllers/PautaController');

const routes = new Router();

routes.post('/pautas', PautaController.salvarRedacao);
routes.get('/pautas', PautaController.listarRedacoes);
routes.get('/pautas/:id', PautaController.buscarPorId);
routes.get('/redacoes/:id/pdf', (req, res) => PautaController.exportarPDF(req, res));

module.exports = routes;