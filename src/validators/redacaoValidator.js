class RedacaoValidator {
  static validar(linhasFront, options = {}) {
    const erros = [];
    const avisos = [];

    if (!linhasFront || !Array.isArray(linhasFront)) {
      erros.push("Formato inválido: As linhas da redação devem ser um array");
      return { válido: false, erros, avisos, totalLinhasEscritas: 0 };
    }

    const linhasSanitizadas = linhasFront.map((linha) =>
      this.sanitizarLinha(linha),
    );
    const linhasComTexto = linhasSanitizadas.filter(
      (linha) => linha.trim() !== "",
    );
    const totalLinhasEscritas = linhasComTexto.length;

    if (totalLinhasEscritas > 0 && totalLinhasEscritas < 7) {
      avisos.push(
        `Aviso: A redação tem apenas ${totalLinhasEscritas} linhas escritas. O ENEM anula redações com menos de 7 linhas.`,
      );
    }

    if (linhasSanitizadas.length > 30) {
      avisos.push(
        `Aviso: O texto excedeu 30 linhas (total enviado: ${linhasSanitizadas.length}). O ENEM avalia apenas até a linha 30.`,
      );
    }

    const linhasComErro = [];
    linhasSanitizadas.forEach((linha, index) => {
      if (linha.length > 110) {
        linhasComErro.push({
          número: index + 1,
          caracteres: linha.length,
          excesso: linha.length - 110,
        });
      }
    });

    if (linhasComErro.length > 0) {
      const detalhes = linhasComErro
        .map(
          (l) =>
            `Linha ${l.número}: ${l.caracteres} caracteres (${l.excesso} a mais)`,
        )
        .join("; ");
      erros.push(
        `Erro: ${linhasComErro.length} linha(s) ultrapassaram o limite visual de caracteres. ${detalhes}`,
      );
    }

    const válido = erros.length === 0;
    return {
      válido,
      erros,
      avisos,
      totalLinhasEscritas,
      linhasComErro,
      linhasSanitizadas,
    };
  }

  static validarStructureMap(structureMap, totalLinhasEnviadas) {
    const mensagens = [];

    if (!structureMap) {
      return { válido: true, mensagens: [] };
    }

    const secoes = ["intro", "dev1", "dev2", "conclusion"];
    const todasAsLinhasUsadas = new Set();

    for (const secao of secoes) {
      if (structureMap[secao]) {
        const linhas = structureMap[secao];

        if (!Array.isArray(linhas)) {
          mensagens.push(`'${secao}' deve ser um array de números`);
          continue;
        }

        linhas.forEach((numeroLinha) => {
          if (numeroLinha < 1 || numeroLinha > totalLinhasEnviadas) {
            mensagens.push(
              `Linha ${numeroLinha} em '${secao}' está fora do intervalo do rascunho`,
            );
          }
          todasAsLinhasUsadas.add(numeroLinha);
        });
      }
    }

    const válido = mensagens.length === 0;
    return { válido, mensagens, todasAsLinhasUsadas };
  }

  static sanitizarLinha(linha) {
    if (!linha || typeof linha !== "string") return "";
    return linha.replace(/[\r\n]+/g, " ").trimEnd();
  }
}

module.exports = RedacaoValidator;
