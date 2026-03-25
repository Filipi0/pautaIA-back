const express = require('express');
const cors = require('cors'); // Importe o cors
const pautaRoutes = require('./routes/pautaRoutes');

const app = express();
const port = 4000;

app.use(cors()); // Libera para qualquer origem por enquanto (ambiente dev)
app.use(express.json());
app.use(pautaRoutes);

app.listen(port, () => {
  console.log(`🚀 Backend do Simulador rodando em http://localhost:${port}`);
});