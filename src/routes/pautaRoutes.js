const { Router } = require('express');
const PautaController = require('../controllers/PautaController');
const TemaController = require('../controllers/TemaController');

const routes = new Router();

// rotas de redações
routes.post('/redacoes', PautaController.salvarRedacao);
routes.get('/redacoes', PautaController.listarRedacoes);
routes.get('/redacoes/:id', PautaController.buscarPorId);
routes.put('/redacoes/:id', PautaController.atualizarRedacao);
routes.delete('/redacoes/:id', PautaController.deletarRedacao);
routes.get('/redacoes/:id/pdf', (req, res) => PautaController.exportarPDF(req, res));
routes.post('/redacoes/:id/corrigir', (req, res) => PautaController.corrigirRedacao(req, res));

// rotas de temas
routes.post('/temas', TemaController.criarTema);
routes.get('/temas', TemaController.listarTemas);
routes.get('/temas/:id', TemaController.buscarTemaComRedacoes);

// rota pra correção da redação com IA
routes.post('/redacoes/:id/correcao', (req, res) => PautaController.corrigirRedacao(req, res));
routes.post('/correcao', (req, res) => PautaController.corrigirRedacao(req, res));

module.exports = routes;