const { GoogleGenerativeAI } = require("@google/generative-ai");

class CorrecaoIA {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não configurada no .env");
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  // Função auxiliar para fazer o código "dormir" por X milissegundos
  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Corrige uma redação usando o modelo Gemini (com tratamento de erro 429)
   */
  async corrigirRedacao(tema, corpo, tentativaAtual = 1) {
    try {
      // 1. Instanciamos o modelo ativo mais atualizado
      const model = this.client.getGenerativeModel({
        model: "gemini-2.5-flash", // Modelo estável e ativo
        systemInstruction: `Você é um corretor especialista e rigoroso da redação do ENEM (Exame Nacional do Ensino Médio).
Sua missão é ler a redação do aluno e avaliá-la estritamente de acordo com as 5 competências oficiais do ENEM.

Regras de pontuação para cada competência:
- A nota deve ser obrigatoriamente: 0, 40, 80, 120, 160 ou 200.
- A nota total máxima é 1000.

Retorne EXCLUSIVAMENTE em formato JSON, seguindo exatamente esta estrutura:
{
  "notaTotal": 0,
  "competencias": {
    "1": { "nota": 0, "nome": "Domínio da modalidade escrita formal da Língua Portuguesa", "feedback": "..." },
    "2": { "nota": 0, "nome": "Compreensão da proposta e estrutura", "feedback": "..." },
    "3": { "nota": 0, "nome": "Seleção, relação e interpretação de informações", "feedback": "..." },
    "4": { "nota": 0, "nome": "Demonstração de conhecimento dos mecanismos linguísticos", "feedback": "..." },
    "5": { "nota": 0, "nome": "Elaboração de proposta de intervenção", "feedback": "..." }
  },
  "feedbackGeral": "...",
  "pontosFortes": ["..."],
  "pontosMelhoria": ["..."]
}`,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const prompt = `Tema da redação: "${tema}"\n\nRedação do aluno:\n${corpo}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const correcao = JSON.parse(text);

      if (!correcao.notaTotal || !correcao.competencias) {
        throw new Error("Estrutura da resposta JSON inválida");
      }

      return correcao;
    } catch (error) {
      // TRATAMENTO DE ERRO 429 (QUOTA EXCEDIDA)
      if (
        error.message.includes("429") ||
        error.message.includes("Quota exceeded")
      ) {
        const maxTentativas = 3;

        if (tentativaAtual < maxTentativas) {
          console.warn(
            `[Aviso] Limite de requisições atingido. Tentando novamente em 15 segundos... (Tentativa ${tentativaAtual} de ${maxTentativas})`,
          );

          // Espera 15 segundos (15000 ms) antes de tentar de novo
          await this.delay(15000);

          // Chama a função de novo recursivamente, aumentando a tentativa
          return this.corrigirRedacao(tema, corpo, tentativaAtual + 1);
        } else {
          throw new Error(
            "O servidor de correção está muito sobrecarregado no momento. Por favor, tente enviar sua redação novamente em 1 minuto.",
          );
        }
      }

      // Se for outro erro (como 404, 500, etc), joga o erro para frente
      console.error("Erro ao chamar API Gemini:", error);
      throw new Error(`Falha na correção com IA: ${error.message}`);
    }
  }
}

module.exports = new CorrecaoIA();
