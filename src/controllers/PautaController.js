const prisma = require('../config/prisma');

class PautaController {
  // Criar nova pauta
 async salvarRedacao(req, res) {
  try {
    const { tema, corpo, totalLinhas, totalPalavras, totalCaracteres, marcacoes } = req.body;
    
    const pauta = await prisma.pauta.create({
      data: {
        tema,
        corpo,
        totalLinhas,
        totalPalavras,
        totalCaracteres,
        marcacoes
      }
    });
    
    return res.status(201).json(pauta);
  } catch (error) {
    return res.status(400).json({ error: 'Falha ao salvar redação' });
  }
}

  // Listar todas as pautas
  async listarRedacoes(req, res) {
    try {
      const pautas = await prisma.pauta.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.json(pautas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar pautas' });
    }
  }

  // Buscar uma pauta específica por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const pauta = await prisma.pauta.findUnique({
        where: { id: Number(id) }
      });
      if (!pauta) return res.status(404).json({ error: 'Pauta não encontrada' });
      return res.json(pauta);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar pauta' });
    }
  }
}

module.exports = new PautaController();