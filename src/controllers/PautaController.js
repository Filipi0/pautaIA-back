const prisma = require("../config/prisma");
const PDFDocument = require("pdfkit");

class PautaController {
  // Criar nova pauta
  async salvarRedacao(req, res) {
    try {
      const {
        tema,
        corpo,
        totalLinhas,
        totalPalavras,
        totalCaracteres,
        marcacoes,
      } = req.body;

      const pauta = await prisma.pauta.create({
        data: {
          tema,
          corpo,
          totalLinhas,
          totalPalavras,
          totalCaracteres,
          marcacoes,
        },
      });

      return res.status(201).json(pauta);
    } catch (error) {
      return res.status(400).json({ error: "Falha ao salvar redação" });
    }
  }

  // Listar todas as pautas
  async listarRedacoes(req, res) {
    try {
      const pautas = await prisma.pauta.findMany({
        orderBy: { createdAt: "desc" },
      });
      return res.json(pautas);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar pautas" });
    }
  }

  // Buscar uma pauta específica por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const pauta = await prisma.pauta.findUnique({
        where: { id: Number(id) },
      });
      if (!pauta)
        return res.status(404).json({ error: "Pauta não encontrada" });
      return res.json(pauta);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar pauta" });
    }
  }
  // Função para dividir texto em linhas com máximo de caracteres
  dividirTextoEmLinhas(texto, maxCaracteres = 79, maxLinhas = 30) {
    const linhas = [];
    const palavras = (texto || "").split(" ");
    let linhaAtual = "";

    for (let palavra of palavras) {
      if (linhas.length >= maxLinhas) break;

      // Se adicionar a palavra ultrapassar o limite, começa nova linha
      if ((linhaAtual + palavra).length > maxCaracteres) {
        if (linhaAtual) {
          linhas.push(linhaAtual.trim());
        }
        linhaAtual = palavra;
      } else {
        linhaAtual += (linhaAtual ? " " : "") + palavra;
      }
    }

    // Adiciona a última linha se houver conteúdo
    if (linhaAtual && linhas.length < maxLinhas) {
      linhas.push(linhaAtual.trim());
    }

    // Completa com linhas vazias até 30
    while (linhas.length < maxLinhas) {
      linhas.push("");
    }

    return linhas;
  }

  // 4. EXPORTAR PDF PAUTADO (Fiel ao Front-end)
  async exportarPDF(req, res) {
    try {
      const { id } = req.params;

      // Busca dados reais no Neon
      const redacao = await prisma.pauta.findUnique({
        where: { id: Number(id) },
      });

      if (!redacao)
        return res.status(404).json({ error: "Redação não encontrada" });

      // Configurações de Layout (Idênticas à sua imagem do Front)
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const fontSize = 12;
      const lineHeight = 20; // Espaçamento entre as linhas pautadas
      const numLines = 30; // Limite de 30 linhas como no simulador
      const leftColWidth = 40;
      const margin = 50;
      const startX = margin;
      const endX = doc.page.width - margin;
      const textX = startX + leftColWidth;
      const maxCaracteresPerLinha = 79;

      res.setHeader(
        "Content-disposition",
        `attachment; filename="redacao-${id}.pdf"`,
      );
      res.setHeader("Content-type", "application/pdf");

      doc.pipe(res);

      // --- Título e Tema ---
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("Simulador de Redação", { align: "center" });
      doc.moveDown(0.5);
      doc
        .moveTo(startX, doc.y)
        .lineTo(endX, doc.y)
        .strokeColor("#cccccc")
        .stroke();
      doc.moveDown(1);

      doc.fontSize(12).fillColor("#333333").text("TEMA: ", { continued: true });
      doc
        .font("Helvetica")
        .text(redacao.tema ? redacao.tema.toUpperCase() : "SEM TEMA DEFINIDO");
      doc.moveDown(1.5);

      const startY = doc.y;

      // --- Processamento do Corpo Real com Divisão de 79 Caracteres ---
      const linhasFormatadas = this.dividirTextoEmLinhas(
        redacao.corpo,
        maxCaracteresPerLinha,
        numLines,
      );

      // --- Desenho das 30 Linhas Pautadas ---
      for (let i = 0; i < numLines; i++) {
        const currentY = startY + i * lineHeight;

        // Desenha a linha horizontal (Pauta)
        doc
          .moveTo(startX, currentY + fontSize + 2)
          .lineTo(endX, currentY + fontSize + 2)
          .strokeColor("#e0e0e0")
          .stroke();

        // Numeração lateral (01 |)
        doc
          .font("Helvetica")
          .fontSize(11)
          .fillColor("#999999")
          .text(`${String(i + 1).padStart(2, "0")} |`, startX, currentY, {
            width: leftColWidth - 5,
            align: "right",
          });

        // Conteúdo da Redação na linha correspondente
        const linhaTexto = linhasFormatadas[i] || "";
        doc
          .fillColor("#000000")
          .fontSize(fontSize)
          .text(linhaTexto, textX, currentY, {
            width: endX - textX,
            lineBreak: false,
          });
      }

      // --- Rodapé com Estatísticas Reais ---
      const footerY = startY + numLines * lineHeight + 20;
      doc
        .moveTo(startX, footerY)
        .lineTo(endX, footerY)
        .strokeColor("#eeeeee")
        .stroke();

      const stats = `# Linhas: ${linhasFormatadas.filter((l) => l.trim()).length}/30   |   Palavras: ${redacao.totalPalavras}   |   Caracteres: ${redacao.totalCaracteres}`;
      doc
        .fontSize(10)
        .fillColor("#666666")
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
}

module.exports = new PautaController();
