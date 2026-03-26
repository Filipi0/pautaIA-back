class RedacaoValidator {
  static dividirTextoEmLinhas(texto, maxCaracteres = 79, maxLinhas = Infinity) {
    const linhas = [];
    const palavras = (texto || "").split(/\s+/).filter(p => p.length > 0);
    let linhaAtual = "";

    for (let palavra of palavras) {
      if (linhas.length >= maxLinhas) break;

      if ((linhaAtual + " " + palavra).trim().length > maxCaracteres) {
        if (linhaAtual) {
          linhas.push(linhaAtual.trim());
        }
        linhaAtual = palavra;
      } else {
        linhaAtual += (linhaAtual ? " " : "") + palavra;
      }
    }

    if (linhaAtual && linhas.length < maxLinhas) {
      linhas.push(linhaAtual.trim());
    }

    return linhas;
  }

  static validar(texto, options = {}) {
    const erros = [];
    const avisos = [];

    if (!texto || typeof texto !== 'string') {
      erros.push('Texto da redação é obrigatório');
      return { válido: false, erros, avisos, linhas: [] };
    }

    const textSanitizado = this.sanitizarTexto(texto);
    const linhas = this.dividirTextoEmLinhas(textSanitizado, 79, 30);
    const totalLinhas = linhas.length;

    if (totalLinhas < 7) {
      avisos.push(`Aviso: A redação tem apenas ${totalLinhas} linhas. O ENEM anula redações com menos de 7 linhas.`);
    }

    if (totalLinhas > 30) {
      avisos.push(`Aviso: A redação excedeu 30 linhas (total: ${totalLinhas} linhas). O ENEM utiliza apenas 30 linhas.`);
    }

    const linhasComErro = [];
    linhas.forEach((linha, index) => {
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
        .map((l) => `Linha ${l.número}: ${l.caracteres} caracteres (${l.excesso} a mais)`)
        .join('; ');
      erros.push(`Erro: ${linhasComErro.length} linha(s) ultrapassaram 110 caracteres. ${detalhes}`);
    }

    const válido = erros.length === 0;

    return { válido, erros, avisos, totalLinhas, linhasComErro, linhas };
  }

  static validarStructureMap(structureMap, totalLinhas) {
    const mensagens = [];

    if (!structureMap) {
      return { válido: true, mensagens: [] };
    }

    const secoes = ['intro', 'dev1', 'dev2', 'conclusion'];
    const todasAsLinhasUsadas = new Set();

    for (const secao of secoes) {
      if (structureMap[secao]) {
        const linhas = structureMap[secao];

        if (!Array.isArray(linhas)) {
          mensagens.push(`${secao} deve ser um array de números`);
          continue;
        }

        linhas.forEach((numeroLinha) => {
          if (numeroLinha < 1 || numeroLinha > totalLinhas) {
            mensagens.push(`Linha ${numeroLinha} em '${secao}' está fora do intervalo [1, ${totalLinhas}]`);
          }
          todasAsLinhasUsadas.add(numeroLinha);
        });
      }
    }

    const válido = mensagens.length === 0;
    return { válido, mensagens, todasAsLinhasUsadas };
  }

  static sanitizarTexto(texto) {
    if (!texto) return '';

    let sanitizado = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    sanitizado = sanitizado
      .split('\n')
      .map((linha) => linha.trimEnd())
      .join('\n');

    return sanitizado;
  }
}

module.exports = RedacaoValidator;
