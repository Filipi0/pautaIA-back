# Documentação da API PautaIA

## 📋 Índice

1. [Visualizando a Documentação](#visualizando-a-documentação)
2. [Estrutura da API](#estrutura-da-api)
3. [Autenticação](#autenticação)
4. [Guia de Implementação Frontend](#guia-de-implementação-frontend)
5. [Exemplos de Uso](#exemplos-de-uso)
6. [Modelos de Dados](#modelos-de-dados)

---

## 🔍 Visualizando a Documentação

### Opção 1: Abrir no Navegador (Recomendado)
```bash
# Abra o arquivo swagger-ui.html no seu navegador
# Clique duas vezes em: swagger-ui.html
# OU use um servidor local
npx http-server .
# Acesse: http://localhost:8080/swagger-ui.html
```

### Opção 2: Importar em Ferramentas
- **Postman**: File → Import → Cole o conteúdo do `swagger.json`
- **Insomnia**: File → Import → From URL → `swagger.json`
- **VS Code**: Instale a extensão "Swagger UI" e abra o arquivo

### Opção 3: Swagger Editor Online
Acesse https://editor.swagger.io e importe o arquivo `swagger.json`

---

## 📚 Estrutura da API

A API possui **3 categorias principais** de rotas:

### **1. Redações (CRUD)**
- Criar, listar, atualizar e deletar redações
- Exportar para PDF
- Contar linhas, palavras e caracteres

### **2. Temas**
- Criar temas de redações
- Listar todos os temas
- Buscar tema com suas redações associadas

### **3. Correção com IA**
- Corrigir redação usando Google Gemini
- Receber feedback automático

---

## 🔐 Autenticação

**Atualmente**: A API não possui autenticação.

Para adicionar autenticação no futuro, configure:
- JWT (JSON Web Tokens)
- OAuth 2.0
- API Keys

---

## 🚀 Guia de Implementação Frontend

### Configuração Básica

```javascript
// config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const apiClient = {
  async request(method, endpoint, data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusCode}`);
    }

    return response.json();
  },

  get(endpoint) {
    return this.request('GET', endpoint);
  },

  post(endpoint, data) {
    return this.request('POST', endpoint, data);
  },

  put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  },

  delete(endpoint) {
    return this.request('DELETE', endpoint);
  }
};
```

### Serviço de Redações

```javascript
// services/pautaService.js
import { apiClient } from '../config/api';

export const pautaService = {
  // Criar nova redação
  async criarRedacao(dados) {
    return apiClient.post('/redacoes', {
      tema: dados.tema,
      linhasFront: dados.linhas, // Array de linhas
      totalLinhas: dados.linhas.length,
      totalPalavras: dados.totalPalavras || 0,
      totalCaracteres: dados.totalCaracteres || 0,
      marcacoes: dados.marcacoes || null,
      structure_map: dados.structureMap || null,
      themeId: dados.themeId || null
    });
  },

  // Listar todas as redações
  async listar() {
    return apiClient.get('/redacoes');
  },

  // Buscar redação específica
  async buscarPorId(id) {
    return apiClient.get(`/redacoes/${id}`);
  },

  // Atualizar redação
  async atualizar(id, dados) {
    return apiClient.put(`/redacoes/${id}`, dados);
  },

  // Deletar redação
  async deletar(id) {
    return apiClient.delete(`/redacoes/${id}`);
  },

  // Exportar para PDF
  async exportarPDF(id) {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/redacoes/${id}/pdf`);
    const blob = await response.blob();
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redacao-${id}.pdf`;
    a.click();
  },

  // Corrigir com IA
  async corrigirComIA(id, promptCustomizado = null) {
    return apiClient.post(`/redacoes/${id}/correcao`, {
      promptCustomizado
    });
  }
};
```

### Serviço de Temas

```javascript
// services/temaService.js
import { apiClient } from '../config/api';

export const temaService = {
  // Criar novo tema
  async criar(title, description = null) {
    return apiClient.post('/temas', {
      title,
      description
    });
  },

  // Listar temas
  async listar() {
    return apiClient.get('/temas');
  },

  // Buscar tema com redações
  async buscarComRedacoes(id) {
    return apiClient.get(`/temas/${id}`);
  }
};
```

---

## 📝 Exemplos de Uso

### Exemplo 1: Criar Redação

```javascript
// React Component
import { useState } from 'react';
import { pautaService } from './services/pautaService';

export function NovaRedacao() {
  const [tema, setTema] = useState('');
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    
    try {
      // Dividir texto em linhas
      const linhas = texto.split('\n').filter(l => l.trim());
      
      const resultado = await pautaService.criarRedacao({
        tema,
        linhas,
        totalPalavras: texto.split(/\s+/).length
      });

      alert('Redação salva com sucesso!');
      setTema('');
      setTexto('');
      
      // Avisos de validação (se houver)
      if (resultado.avisos?.length > 0) {
        console.warn('Avisos:', resultado.avisos);
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Tema da redação"
        value={tema}
        onChange={(e) => setTema(e.target.value)}
        required
      />
      <textarea
        placeholder="Digite sua redação aqui..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        required
      />
      <button type="submit" disabled={carregando}>
        {carregando ? 'Salvando...' : 'Salvar Redação'}
      </button>
      {erro && <p style={{ color: 'red' }}>{erro}</p>}
    </form>
  );
}
```

### Exemplo 2: Listar Redações

```javascript
import { useState, useEffect } from 'react';
import { pautaService } from './services/pautaService';

export function ListaRedacoes() {
  const [redacoes, setRedacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarRedacoes();
  }, []);

  const carregarRedacoes = async () => {
    try {
      const dados = await pautaService.listar();
      setRedacoes(dados);
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) return <p>Carregando...</p>;

  return (
    <div>
      <h2>Minhas Redações</h2>
      {redacoes.map(redacao => (
        <div key={redacao.id}>
          <h3>{redacao.tema}</h3>
          <p>Linhas: {redacao.totalLinhas}</p>
          <p>Palavras: {redacao.totalPalavras}</p>
          <small>Criada em: {new Date(redacao.createdAt).toLocaleDateString('pt-BR')}</small>
        </div>
      ))}
    </div>
  );
}
```

### Exemplo 3: Corrigir com IA

```javascript
import { useState } from 'react';
import { pautaService } from './services/pautaService';

export function CorrecaoIA({ redacaoId }) {
  const [correcao, setCorrecao] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleCorrigir = async () => {
    setCarregando(true);
    try {
      const resultado = await pautaService.corrigirComIA(redacaoId);
      setCorrecao(resultado.correcao);
    } catch (err) {
      console.error('Erro na correção:', err);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div>
      <button onClick={handleCorrigir} disabled={carregando}>
        {carregando ? 'Corrigindo...' : 'Corrigir com IA'}
      </button>
      {correcao && (
        <div>
          <h3>Feedback da IA:</h3>
          <p>{correcao}</p>
        </div>
      )}
    </div>
  );
}
```

### Exemplo 4: Usar com fetch direto

```javascript
// Se não estiver usando React, pode usar fetch direto

// Criar redação
fetch('http://localhost:3000/redacoes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tema: 'Tema da Redação',
    linhasFront: ['Linha 1', 'Linha 2', 'Linha 3'],
    totalLinhas: 3
  })
})
.then(res => res.json())
.then(data => console.log('Redação criada:', data))
.catch(err => console.error('Erro:', err));

// Listar redações
fetch('http://localhost:3000/redacoes')
  .then(res => res.json())
  .then(data => console.log('Redações:', data))
  .catch(err => console.error('Erro:', err));

// Exportar PDF
fetch('http://localhost:3000/redacoes/1/pdf')
  .then(res => res.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'redacao.pdf';
    a.click();
  });
```

---

## 📊 Modelos de Dados

### Redação (Pauta)
```json
{
  "id": 1,
  "tema": "Inteligência Artificial",
  "corpo": "Texto da redação...",
  "totalLinhas": 30,
  "totalPalavras": 1500,
  "totalCaracteres": 8000,
  "marcacoes": null,
  "structure_map": {
    "intro": [1, 2, 3],
    "dev1": [4, 5, 6],
    "dev2": [7, 8, 9],
    "conclusion": [10, 11, 12]
  },
  "themeId": 1,
  "theme": { /* Objeto do tema */ },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

### Tema (Theme)
```json
{
  "id": 1,
  "title": "Inteligência Artificial",
  "description": "Tema sobre como a IA impacta a sociedade",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Resposta de Erro
```json
{
  "error": "Mensagem de erro descritiva"
}
```

### Resposta de Validação
```json
{
  "error": "Redação não atende aos critérios do ENEM",
  "erros": ["Erro 1", "Erro 2"],
  "avisos": ["Aviso 1", "Aviso 2"]
}
```

---

## 🔧 Variáveis de Ambiente

No seu frontend, configure:

```
# .env ou .env.local
REACT_APP_API_URL=http://localhost:3000
```

Ou para produção:
```
REACT_APP_API_URL=https://sua-api-em-producao.com
```

---

## 💡 Dicas Importantes

### 1. Tratamento de Erros
Sempre implemente tratamento de erros nas suas chamadas de API.

### 2. Loading States
Mostre feedback visual enquanto a API está processando (spinners, skeleton loaders).

### 3. Validação Frontend
Valide dados antes de enviar para a API para melhor UX.

### 4. Cache
Considere cachear dados que não mudam frequentemente.

### 5. CORS
Se estiver com problemas de CORS, o backend já está configurado com `cors` package.

---

## 📞 Suporte e Dúvidas

Para dúvidas sobre a API, consulte o arquivo `swagger.json` ou abra o `swagger-ui.html` para visualizar a documentação interativa.

---

## 📖 Referências

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.0)
- [Swagger UI Documentation](https://github.com/swagger-api/swagger-ui)
- [Express.js Documentation](https://expressjs.com)
- [Prisma Documentation](https://www.prisma.io/docs/)

