// ============================================================================
// Parser de Documentos de Planejamento (Markdown)
// ============================================================================

export interface ParsedMetadata {
  titulo: string
  disciplina: string
  turma: string
  codigoBase: string
  numBlocos: number
  pontosTotais: number
  pontosPorQuiz: number
  objetivoGeral: string
}

export interface ParsedQuiz {
  pergunta: string
  opcoes: string[]
  respostaCorreta: string
  respostaCorretaIndex: number
}

export interface ParsedBlock {
  numero: number
  titulo: string
  conteudo: string
  quiz: ParsedQuiz | null
}

export interface ParsedDocument {
  metadados: ParsedMetadata
  blocos: ParsedBlock[]
}

/**
 * Extrai metadados do cabeçalho do documento
 */
function extrairMetadados(documento: string): ParsedMetadata {
  const metadados: Partial<ParsedMetadata> = {}
  
  // Extrair cada campo usando regex
  const tituloMatch = documento.match(/\*\*Título do Planejamento:\*\*\s*(.+)/i)
  if (tituloMatch?.[1]) metadados.titulo = tituloMatch[1].trim()
  
  const disciplinaMatch = documento.match(/\*\*Disciplina:\*\*\s*(.+)/i)
  if (disciplinaMatch?.[1]) metadados.disciplina = disciplinaMatch[1].trim()
  
  const turmaMatch = documento.match(/\*\*Turma:\*\*\s*(.+)/i)
  if (turmaMatch?.[1]) metadados.turma = turmaMatch[1].trim()
  
  const codigoMatch = documento.match(/\*\*Código Base:\*\*\s*(.+)/i)
  if (codigoMatch?.[1]) metadados.codigoBase = codigoMatch[1].trim()
  
  const numBlocosMatch = documento.match(/\*\*Total de Blocos:\*\*\s*(\d+)/i)
  if (numBlocosMatch?.[1]) metadados.numBlocos = parseInt(numBlocosMatch[1])
  
  const pontosTotaisMatch = documento.match(/\*\*Pontos Totais:\*\*\s*(\d+)/i)
  if (pontosTotaisMatch?.[1]) metadados.pontosTotais = parseInt(pontosTotaisMatch[1])
  
  const pontosPorQuizMatch = documento.match(/\*\*Pontos por Quiz:\*\*\s*(\d+)/i)
  if (pontosPorQuizMatch?.[1]) metadados.pontosPorQuiz = parseInt(pontosPorQuizMatch[1])
  
  const objetivoMatch = documento.match(/\*\*Objetivo Geral:\*\*\s*(.+)/i)
  if (objetivoMatch?.[1]) metadados.objetivoGeral = objetivoMatch[1].trim()
  
  // Validar campos obrigatórios
  if (!metadados.titulo) throw new Error('Título do Planejamento não encontrado')
  if (!metadados.disciplina) throw new Error('Disciplina não encontrada')
  if (!metadados.turma) throw new Error('Turma não encontrada')
  if (!metadados.codigoBase) throw new Error('Código Base não encontrado')
  if (!metadados.numBlocos) throw new Error('Total de Blocos não encontrado')
  if (!metadados.pontosTotais) throw new Error('Pontos Totais não encontrados')
  if (!metadados.pontosPorQuiz) throw new Error('Pontos por Quiz não encontrados')
  
  return metadados as ParsedMetadata
}

/**
 * Extrai um quiz de um bloco
 */
function extrairQuiz(blocoTexto: string): ParsedQuiz | null {
  // Verificar se tem seção de quiz
  if (!blocoTexto.includes('### 🎯 Quiz:')) {
    return null
  }
  
  // Extrair pergunta
  const perguntaMatch = blocoTexto.match(/\*\*Pergunta:\*\*\s*(.+?)(?=\nA\))/)
  if (!perguntaMatch?.[1]) return null
  
  const pergunta = perguntaMatch[1].trim()
  
  // Extrair opções (A, B, C, D, etc.)
  const opcoesRegex = /([A-Z])\)\s*(.+?)(?=\n[A-Z]\)|✅|\n\*\*|$)/g
  const opcoes: string[] = []
  const opcoesMap: Record<string, string> = {}
  
  let match
  while ((match = opcoesRegex.exec(blocoTexto)) !== null) {
    const letra = match[1]
    const texto = match[2]
    if (letra && texto) {
      const textoLimpo = texto.trim().replace(/\s+/g, ' ')
      opcoes.push(textoLimpo)
      opcoesMap[letra] = textoLimpo
    }
  }
  
  console.log(`📊 Quiz parseado: ${pergunta} | Opções: ${opcoes.length}`, opcoes)
  
  // Extrair resposta correta
  const respostaMatch = blocoTexto.match(/✅\s*\*\*Resposta correta:\*\*\s*([A-Z])/i)
  if (!respostaMatch?.[1]) return null
  
  const respostaCorreta = respostaMatch[1]
  const respostaCorretaIndex = respostaCorreta.charCodeAt(0) - 65 // A=0, B=1, C=2, etc.
  
  return {
    pergunta,
    opcoes,
    respostaCorreta,
    respostaCorretaIndex
  }
}

/**
 * Extrai blocos individuais do documento
 */
function extrairBlocos(documento: string): ParsedBlock[] {
  const blocos: ParsedBlock[] = []
  
  // Dividir por ## Bloco X
  const blocoRegex = /##\s+Bloco\s+(\d+)\s+—\s+(.+?)\n([\s\S]+?)(?=##\s+Bloco\s+\d+|$)/g
  
  let match
  while ((match = blocoRegex.exec(documento)) !== null) {
    if (!match[1] || !match[2] || !match[3]) continue
    
    const numero = parseInt(match[1])
    const titulo = match[2].trim()
    const blocoTexto = match[3].trim()
    
    // Extrair conteúdo (entre ### 📚 Conteúdo: e ### 🎯 Quiz:)
    let conteudo = ''
    const conteudoMatch = blocoTexto.match(/###\s+📚\s+Conteúdo:\s*([\s\S]+?)(?=###\s+🎯\s+Quiz:|$)/i)
    if (conteudoMatch?.[1]) {
      conteudo = conteudoMatch[1].trim()
    }
    
    // Extrair quiz
    const quiz = extrairQuiz(blocoTexto)
    
    blocos.push({
      numero,
      titulo,
      conteudo,
      quiz
    })
  }
  
  return blocos
}

/**
 * Função principal: parsear documento completo
 */
export function parsearDocumentoPlanejamento(documento: string): ParsedDocument {
  try {
    const metadados = extrairMetadados(documento)
    const blocos = extrairBlocos(documento)
    
    console.log('✅ Parsing concluído:', {
      titulo: metadados.titulo,
      totalBlocos: blocos.length,
      blocosComQuiz: blocos.filter(b => b.quiz !== null).length
    })
    
    return {
      metadados,
      blocos
    }
  } catch (error) {
    console.error('❌ Erro ao parsear documento:', error)
    throw error
  }
}

/**
 * Validar se um documento tem a estrutura esperada
 */
export function validarEstruturaPlanejamento(documento: string): {
  valido: boolean
  erros: string[]
} {
  const erros: string[] = []
  
  // Verificar metadados obrigatórios
  if (!documento.includes('**Título do Planejamento:**')) {
    erros.push('Falta campo: Título do Planejamento')
  }
  if (!documento.includes('**Disciplina:**')) {
    erros.push('Falta campo: Disciplina')
  }
  if (!documento.includes('**Turma:**')) {
    erros.push('Falta campo: Turma')
  }
  if (!documento.includes('**Código Base:**')) {
    erros.push('Falta campo: Código Base')
  }
  
  // Verificar se tem pelo menos um bloco
  const blocoMatches = documento.match(/##\s+Bloco\s+\d+/g)
  if (!blocoMatches || blocoMatches.length === 0) {
    erros.push('Nenhum bloco encontrado (use formato: ## Bloco 1 — Título)')
  }
  
  return {
    valido: erros.length === 0,
    erros
  }
}

