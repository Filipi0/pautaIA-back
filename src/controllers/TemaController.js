const prisma = require("../config/prisma");

class TemaController {
  /**
   * Criar um novo tema
   */
  async criarTema(req, res) {
    try {
      const { title, description } = req.body;

      if (!title || title.trim() === "") {
        return res.status(400).json({ error: "Título do tema é obrigatório" });
      }

      const novoTema = await prisma.theme.create({
        data: {
          title: title.trim(),
          description: description || null,
        },
      });

      return res.status(201).json(novoTema);
    } catch (error) {
      if (error.code === "P2002") {
        return res
          .status(400)
          .json({ error: "Já existe um tema com este título" });
      }
      return res.status(400).json({ error: "Falha ao criar tema" });
    }
  }

  /**
   * Listar todos os temas
   */
  async listarTemas(req, res) {
    try {
      const temas = await prisma.theme.findMany({
        orderBy: { createdAt: "desc" },
      });
      return res.json(temas);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar temas" });
    }
  }

  /**
   * Buscar um tema específico com suas redações
   */
  async buscarTemaComRedacoes(req, res) {
    try {
      const { id } = req.params;

      const tema = await prisma.theme.findUnique({
        where: { id: Number(id) },
        include: {
          pautas: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!tema)
        return res.status(404).json({ error: "Tema não encontrado" });
      return res.json(tema);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar tema" });
    }
  }
}

module.exports = new TemaController();
