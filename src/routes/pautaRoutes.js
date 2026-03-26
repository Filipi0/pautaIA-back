const { Router } = require('express');
const PautaController = require('../controllers/PautaController');

const routes = new Router();

// rotas de redações
routes.post('/redacoes', PautaController.salvarRedacao);
routes.get('/redacoes', PautaController.listarRedacoes);
routes.get('/redacoes/:id', PautaController.buscarPorId);
routes.put('/redacoes/:id', PautaController.atualizarRedacao);
routes.delete('/redacoes/:id', PautaController.deletarRedacao);
routes.get('/redacoes/:id/pdf', (req, res) => PautaController.exportarPDF(req, res));

// rotas de temas
routes.post('/temas', PautaController.criarTema);
routes.get('/temas', PautaController.listarTemas);
routes.get('/temas/:id', PautaController.buscarTemaComRedacoes);

module.exports = routes;