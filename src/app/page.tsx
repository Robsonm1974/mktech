import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Aulas de Tecnologia que Preparam o Aluno para o Futuro!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Pensamento computacional, programação, lógica e inglês aplicado — tudo em microlições divertidas.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="px-8">
              <Link href="/auth/login">Agendar Demonstração</Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              Falar com Especialista
            </Button>
          </div>
        </div>
      </section>

      {/* Para Escolas Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Para Escolas
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Diferencial que atrai e retém matrículas com economia e zero instalação
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>🎯 Diferencial Competitivo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Atrate e retenha matrículas oferecendo educação tecnológica moderna.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>💰 Economia Garantida</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Conteúdos e trilhas incluídos. Economize com cursos externos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚡ Zero Instalação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Roda em navegador. Funciona em Chromebooks e tablets.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button asChild size="lg">
            <Link href="/auth/login">Ver Plano</Link>
          </Button>
        </div>
      </section>

      {/* Para Famílias Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Para Famílias
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Seu filho aprende programação + lógica + inglês aplicado na rotina escolar
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>🎓 Aprendizado Moderno</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Programação e lógica</li>
                  <li>• Inglês aplicado</li>
                  <li>• Pensamento computacional</li>
                  <li>• Preparação para o futuro</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🎮 Aprende Brincando</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Gamificação com badges</li>
                  <li>• Ranking e pontuação</li>
                  <li>• Microlições interativas</li>
                  <li>• Feedback imediato</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Prova Pedagógica */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Nossa Metodologia
          </h2>
          <p className="text-lg text-gray-600">
            Loop: Microlição → Prática Guiada → Jogo/Quiz com Recompensas → Feedback Imediato
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardHeader>
              <div className="text-4xl mb-2">📚</div>
              <CardTitle>Microlição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Vídeos e apresentações de 3-5 minutos
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="text-4xl mb-2">🎯</div>
              <CardTitle>Prática Guiada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Exercícios interativos e animações
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="text-4xl mb-2">🎮</div>
              <CardTitle>Jogo/Quiz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Games Phaser, H5P e quizzes MCQ
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="text-4xl mb-2">🏆</div>
              <CardTitle>Recompensas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Pontos, badges e ranking em tempo real
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Gamificação */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Gamificação Completa
            </h2>
            <p className="text-lg opacity-90">
              Engajamento através de recompensas e competição saudável
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold mb-2">Pontos por Participação</h3>
              <p className="opacity-90">
                Cada quiz respondido gera pontos baseados na precisão e velocidade
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">🏅</div>
              <h3 className="text-xl font-semibold mb-2">Badges por Marcos</h3>
              <p className="opacity-90">
                &quot;5 Aulas&quot;, &quot;Primeira 100%&quot;, &quot;Mestre em Programação&quot;
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Ranking com Privacidade</h3>
              <p className="opacity-90">
                Competição saudável com nomes abreviados para privacidade
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Investimento
          </h2>
          <p className="text-lg text-gray-600">
            Plano único, sem pegadinhas, sem surpresas
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <Card className="text-center">
            <CardHeader>
              <Badge className="w-fit mx-auto mb-4">Plano Único</Badge>
              <CardTitle className="text-4xl">R$ 50</CardTitle>
              <CardDescription className="text-lg">
                por aluno/mês
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-left">
                <li>✅ Aulas ilimitadas</li>
                <li>✅ Trilhas completas</li>
                <li>✅ Relatórios em tempo real</li>
                <li>✅ Suporte técnico incluído</li>
                <li>✅ Atualizações automáticas</li>
              </ul>
              <div className="pt-4">
                <Button size="lg" className="w-full" asChild>
                  <Link href="/auth/login">Começar Teste Gratuito</Link>
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Demonstração gratuita: 1 aula completa
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Como funciona a segurança?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Todos os dados são isolados por escola (tenant) com criptografia completa. 
                  Seguimos rigorosamente a LGPD para proteção de dados de menores.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Que dispositivos preciso?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Qualquer dispositivo com navegador moderno: tablets, Chromebooks, 
                  computadores. Não precisa instalar nada.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Posso exportar relatórios?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sim, todos os dados podem ser exportados em CSV/PDF. 
                  Relatórios detalhados de progresso por aluno e turma.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Como funciona o suporte?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Suporte técnico incluído por email e chat. 
                  Temos 99.5% de uptime durante horário letivo.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">MKTECH</h3>
              <p className="text-gray-400">
                Tecnologia gamificada para EF1/EF2
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/sobre" className="hover:text-white">Sobre</Link></li>
                <li><Link href="/contato" className="hover:text-white">Contato</Link></li>
                <li><Link href="/privacidade" className="hover:text-white">Privacidade</Link></li>
                <li><Link href="/termos" className="hover:text-white">Termos</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: makarispo@gmail.com</li>
                <li>Tel: (41) 99599-9648</li>
                <li>www.makarispo.com</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <p className="text-gray-400 text-sm">
                Makarispo Serviços Tecnológicos Ltda<br/>
                CNPJ: 00.123.548/0001-29<br/>
                São José dos Pinhais - PR
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 MKTECH. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}