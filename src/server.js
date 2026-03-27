const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express'); // Importa a lib
const pautaRoutes = require('./routes/pautaRoutes');

// Importa o seu arquivo JSON de documentação direto pra cá
const swaggerDocument = require('../swagger.json'); // Ajuste o caminho se precisar

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// A mágica: Injeta o Swagger UI na rota /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(pautaRoutes);

app.listen(port, () => {
  console.log(`🚀 Backend do Simulador rodando em http://localhost:${port}`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/api-docs`);
});