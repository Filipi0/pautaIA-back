const prisma = require("../config/prisma");
const PDFDocument = require("pdfkit");
const RedacaoValidator = require("../validators/redacaoValidator");

class PautaController {
  /**
   * Criar nova redação - Aceita array de linhas do frontend
   */
  async salvarRedacao(req, res) {
    try {
      const {
        tema,
        linhasFront,
        totalLinhas,
        totalPalavras,
        totalCaracteres,
        marcacoes,
        structure_map,
        themeId,
      } = req.body;

      if (!tema || tema.trim() === "") {
        return res
          .status(400)
          .json({ error: "Título/tema da redação é obrigatório" });
      }

      if (!linhasFront || linhasFront.length === 0) {
        return res.status(400).json({ error: "Texto da redação é obrigatório" });
      }

      // Validar regras do ENEM - passa o array direto
      const validacao = RedacaoValidator.validar(linhasFront);

      if (!validacao.válido) {
        return res.status(400).json({
          error: "Redação não atende aos critérios do ENEM",
          erros: validacao.erros,
          avisos: validacao.avisos,
        });
      }

      // Se houver avisos (ex: menos de 7 linhas), enviar como alerta
      if (validacao.avisos.length > 0) {
        console.warn("Avisos na redação:", validacao.avisos);
      }

      // Criar string para salvar no banco usando linhas sanitizadas
      const corpoParaSalvar = validacao.linhasSanitizadas ? validacao.linhasSanitizadas.join('\n') : "";

      // Validar structure_map se fornecido
      if (structure_map) {
        const validacaoStructure = RedacaoValidator.validarStructureMap(
          structure_map,
          validacao.totalLinhasEscritas
        );
        if (!validacaoStructure.válido) {
          return res.status(400).json({
            error: "structure_map inválido",
            mensagens: validacaoStructure.mensagens,
          });
        }
      }

      // Validar se o tema existe (se fornecido)
      if (themeId) {
        const temaExiste = await prisma.theme.findUnique({
          where: { id: Number(themeId) },
        });
        if (!temaExiste) {
          return res.status(400).json({ error: "Tema especificado não existe" });
        }
      }

      // Preparar dados para salvar
      const dadosRedacao = {
        tema: tema.trim(),
        corpo: corpoParaSalvar,
        totalLinhas: totalLinhas || validacao.totalLinhasEscritas,
        totalPalavras: totalPalavras || 0,
        totalCaracteres: totalCaracteres || 0,
        marcacoes: marcacoes || null,
        structure_map: structure_map || null,
      };

      // Adicionar theme_id se fornecido
      if (themeId) {
        dadosRedacao.themeId = Number(themeId);
      }

      const pauta = await prisma.pauta.create({
        data: dadosRedacao,
        include: {
          theme: true,
        },
      });

      return res.status(201).json({
        success: true,
        data: pauta,
        avisos: validacao.avisos,
      });
    } catch (error) {
      console.error("Erro ao salvar redação:", error);
      return res
        .status(500)
        .json({ error: "Falha ao salvar redação", detalhes: error.message });
    }
  }

  /**
   * Listar todas as redações
   */
  async listarRedacoes(req, res) {
    try {
      const pautas = await prisma.pauta.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          theme: true,
        },
      });
      return res.json(pautas);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar redações" });
    }
  }

  /**
   * Buscar uma redação específica por ID
   */
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const pauta = await prisma.pauta.findUnique({
        where: { id: Number(id) },
        include: {
          theme: true,
        },
      });

      if (!pauta)
        return res.status(404).json({ error: "Redação não encontrada" });
      return res.json(pauta);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar redação" });
    }
  }

  /**
   * Atualizar uma redação existente - Aceita linhasFront ou corpo
   */
  async atualizarRedacao(req, res) {
    try {
      const { id } = req.params;
      const {
        tema,
        corpo,
        linhasFront,
        totalLinhas,
        totalPalavras,
        totalCaracteres,
        marcacoes,
        structure_map,
        themeId,
      } = req.body;

      // Se linhasFront foi enviado, validar o array direto
      let validacao = null;
      if (linhasFront) {
        validacao = RedacaoValidator.validar(linhasFront);

        if (!validacao.válido) {
          return res.status(400).json({
            error: "Redação não atende aos critérios do ENEM",
            erros: validacao.erros,
            avisos: validacao.avisos,
          });
        }

        // Validar structure_map se fornecido
        if (structure_map) {
          const validacaoStructure = RedacaoValidator.validarStructureMap(
            structure_map,
            validacao.totalLinhasEscritas
          );
          if (!validacaoStructure.válido) {
            return res.status(400).json({
              error: "structure_map inválido",
              mensagens: validacaoStructure.mensagens,
            });
          }
        }
      }

      // Validar se o tema existe (se fornecido)
      if (themeId !== undefined && themeId !== null) {
        const temaExiste = await prisma.theme.findUnique({
          where: { id: Number(themeId) },
        });
        if (!temaExiste) {
          return res.status(400).json({ error: "Tema especificado não existe" });
        }
      }

      // Preparar dados para atualização
      const dadosAtualizacao = {};

      if (tema !== undefined) dadosAtualizacao.tema = tema.trim();
      
      // Se linhasFront foi alterado, usar linhas sanitizadas
      if (linhasFront !== undefined && validacao) {
        dadosAtualizacao.corpo = validacao.linhasSanitizadas ? validacao.linhasSanitizadas.join('\n') : "";
        dadosAtualizacao.totalLinhas = validacao.totalLinhasEscritas;
      } else if (corpo !== undefined) {
        dadosAtualizacao.corpo = corpo;
      } else if (totalLinhas !== undefined) {
        dadosAtualizacao.totalLinhas = totalLinhas;
      }
      if (totalPalavras !== undefined)
        dadosAtualizacao.totalPalavras = totalPalavras;
      if (totalCaracteres !== undefined)
        dadosAtualizacao.totalCaracteres = totalCaracteres;
      if (marcacoes !== undefined) dadosAtualizacao.marcacoes = marcacoes;
      if (structure_map !== undefined)
        dadosAtualizacao.structure_map = structure_map;
      if (themeId !== undefined) dadosAtualizacao.themeId = themeId;

      const pautaAtualizada = await prisma.pauta.update({
        where: { id: Number(id) },
        data: dadosAtualizacao,
        include: {
          theme: true,
        },
      });

      return res.json({
        success: true,
        data: pautaAtualizada,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Redação não encontrada" });
      }
      console.error("Erro ao atualizar redação:", error);
      return res
        .status(500)
        .json({ error: "Falha ao atualizar redação", detalhes: error.message });
    }
  }

  /**
   * Deletar uma redação
   */
  async deletarRedacao(req, res) {
    try {
      const { id } = req.params;

      const pautaDeletada = await prisma.pauta.delete({
        where: { id: Number(id) },
      });

      return res.json({
        success: true,
        mensagem: "Redação deletada com sucesso",
        data: pautaDeletada,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Redação não encontrada" });
      }
      return res.status(500).json({ error: "Erro ao deletar redação" });
    }
  }
    // EXPORTAR PDF PAUTADO - Loop simples de 30 linhas
  async exportarPDF(req, res) {
    try {
      const { id } = req.params;

      const redacao = await prisma.pauta.findUnique({
        where: { id: Number(id) },
      });

      if (!redacao)
        return res.status(404).json({ error: "Redação não encontrada" });

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const fontSize = 12;
      const lineHeight = 20;
      const leftColWidth = 40;
      const margin = 50;
      const startX = margin;
      const endX = doc.page.width - margin;
      const textX = startX + leftColWidth;

      res.setHeader("Content-disposition", `attachment; filename="redacao-${id}.pdf"`);
      res.setHeader("Content-type", "application/pdf");

      doc.pipe(res);

      // --- Título e Tema ---
      doc.fontSize(20).font("Helvetica-Bold").text("Simulador de Redação", { align: "center" });
      doc.moveDown(0.5);
      doc.moveTo(startX, doc.y).lineTo(endX, doc.y).strokeColor("#cccccc").stroke();
      doc.moveDown(1);

      doc.fontSize(12).fillColor("#333333").text("TEMA: ", { continued: true });
      doc.font("Helvetica").text(redacao.tema ? redacao.tema.toUpperCase() : "SEM TEMA DEFINIDO");
      doc.moveDown(1.5);

      // Quebra o corpo em linhas usando \n
      const linhasDoBanco = redacao.corpo ? redacao.corpo.split('\n') : [];

      let currentY = doc.y;
      const bottomMargin = 50;

      // --- Loop simples de 30 linhas ---
      for (let i = 0; i < 30; i++) {
        // Verificação de paginação
        if (currentY + lineHeight > doc.page.height - bottomMargin) {
          doc.addPage();
          currentY = margin;
        }

        // Desenha a linha horizontal (Pauta)
        doc.moveTo(startX, currentY + fontSize + 2)
           .lineTo(endX, currentY + fontSize + 2)
           .strokeColor("#e0e0e0")
           .stroke();

        // Numeração lateral
        doc.font("Helvetica").fontSize(11).fillColor("#999999")
           .text(`${String(i + 1).padStart(2, "0")} |`, startX, currentY, {
             width: leftColWidth - 5,
             align: "right",
           });

        // Conteúdo da linha (o que tiver em linhasDoBanco[i], ou string vazia)
        const textoDaLinha = linhasDoBanco[i] || "";
        if (textoDaLinha.trim()) {
          doc.fillColor("#000000").fontSize(fontSize)
             .text(textoDaLinha, textX, currentY, {
               width: endX - textX,
               lineBreak: false,
             });
        }

        currentY += lineHeight;
      }

      // --- Rodapé com Estatísticas ---
      if (currentY + 40 > doc.page.height - bottomMargin) {
        doc.addPage();
        currentY = margin;
      }

      const footerY = currentY + 10;
      doc.moveTo(startX, footerY).lineTo(endX, footerY).strokeColor("#eeeeee").stroke();

      const stats = `Palavras: ${redacao.totalPalavras}   |   Caracteres: ${redacao.totalCaracteres}`;

      doc.fontSize(10).fillColor("#666666")
         .text(stats, startX, footerY + 10, {
           align: "right",
           width: endX - startX,
         });

      doc.end();
    } catch (error) {
      console.error("Erro PDF:", error);
      res.status(500).json({ error: "Erro ao gerar arquivo PDF" });
    }
  }

  /**
   * Corrigir uma redação usando IA
   */
  async corrigirRedacao(req, res) {
    try {
      const { id } = req.params;
      const { tema, corpo } = req.body;

      // Forçar reload do módulo para pegar a versão mais recente
      const CorrecaoIAFresh = require("../services/CorrecaoIA");

      // Se ID for fornecido, buscar redação no banco
      let redacao = null;
      if (id) {
        redacao = await prisma.pauta.findUnique({
          where: { id: Number(id) },
        });

        if (!redacao) {
          return res.status(404).json({ error: "Redação não encontrada" });
        }
      } else if (!tema || !corpo) {
        // Se não tiver ID, tema e corpo são obrigatórios
        return res.status(400).json({
          error: "Forneça um ID de redação ou tema e corpo",
        });
      }

      // Usar dados da redação no banco ou do corpo enviado
      const temaParaCorrigir = redacao?.tema || tema;
      const corpoParaCorrigir = redacao?.corpo || corpo;

      if (!temaParaCorrigir || !corpoParaCorrigir) {
        return res.status(400).json({
          error: "Tema e corpo da redação são obrigatórios para correção",
        });
      }

      // Chamar o serviço de IA
      const correcao = await CorrecaoIAFresh.corrigirRedacao(
        temaParaCorrigir,
        corpoParaCorrigir
      );

      return res.json({
        success: true,
        data: correcao,
      });
    } catch (error) {
      console.error("Erro ao corrigir redação:", error);
      return res.status(500).json({
        error: "Falha ao corrigir redação com IA",
        detalhes: error.message,
      });
    }
  }
}

module.exports = new PautaController();
