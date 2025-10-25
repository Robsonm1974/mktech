import Link from 'next/link'
import { ParallaxHero } from '@/components/layout/ParallaxHero'

export default function Home() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: '#2c3e50' }}>
      {/* Hero Section com Parallax Effect integrado */}
      <ParallaxHero />

      {/* Features Section - Por que Escolas Amam Nossa Plataforma */}
      <section id="recursos" className="py-20 px-8" style={{ background: '#f8f9fa' }}>
        <h2 className="text-center text-5xl font-extrabold mb-4" style={{ color: '#2c3e50' }}>
          Por que Escolas Amam Nossa Plataforma?
        </h2>
        <p className="text-center text-xl mb-16 max-w-3xl mx-auto" style={{ color: '#6c757d' }}>
          Diferencial que atrai e retém matrículas com economia e zero instalação
        </p>
        
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            { icon: '💰', title: 'Economia Real', desc: 'Conteúdos e trilhas incluídos. Economize com cursos externos e ofereça tecnologia de ponta.' },
            { icon: '🌐', title: 'Zero Instalação', desc: 'Roda em navegador. Funciona perfeitamente em Chromebooks, tablets e computadores.' },
            { icon: '🎯', title: 'Engajamento Total', desc: 'Sistema de pontos, badges e ranking que transforma aprendizado em aventura.' },
            { icon: '📚', title: 'Conteúdo Completo', desc: 'Programação + lógica + inglês aplicado integrados na rotina escolar.' },
            { icon: '🔒', title: '100% Seguro', desc: 'Dados isolados por escola com criptografia completa. Totalmente adequado à LGPD.' },
            { icon: '📊', title: 'Relatórios Detalhados', desc: 'Acompanhe o progresso de cada aluno com relatórios completos em CSV/PDF.' }
          ].map((feature, i) => (
            <div 
              key={i} 
              className="bg-white p-10 rounded-3xl text-center transition-all hover:shadow-2xl hover:-translate-y-2"
              style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
            >
              <span className="text-6xl block mb-6">{feature.icon}</span>
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#2c3e50' }}>{feature.title}</h3>
              <p style={{ color: '#6c757d', lineHeight: '1.7', fontSize: '1.05rem' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Learning Loop Section - Como Seu Aluno Aprende */}
      <section id="como-funciona" className="py-20 px-8 bg-white">
        <h2 className="text-center text-5xl font-extrabold mb-4" style={{ color: '#2c3e50' }}>
          Como Seu Aluno Aprende
        </h2>
        <p className="text-center text-xl mb-16 max-w-3xl mx-auto" style={{ color: '#6c757d' }}>
          Loop de aprendizado comprovado: Aprenda → Pratique → Jogue → Domine
        </p>
        
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { num: '1', icon: '📺', title: 'Microlição', desc: 'Vídeos e apresentações de 3-5 minutos que mantêm a atenção', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
            { num: '2', icon: '✏️', title: 'Prática Guiada', desc: 'Exercícios interativos com animações que facilitam o entendimento', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
            { num: '3', icon: '🎮', title: 'Jogos & Quiz', desc: 'Games Phaser, H5P e quizzes interativos com recompensas', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
            { num: '4', icon: '⚡', title: 'Feedback Imediato', desc: 'Pontos, conquistas e aprendizado instantâneo com cada resposta', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }
          ].map((step, i) => (
            <div 
              key={i} 
              className="p-8 rounded-2xl text-white text-center transition-transform hover:scale-105"
              style={{ background: step.gradient }}
            >
              <div className="text-4xl font-black mb-4" style={{ opacity: 0.9 }}>{step.num}</div>
              <h3 className="text-2xl font-bold mb-3">{step.icon} {step.title}</h3>
              <p style={{ opacity: 0.95, lineHeight: '1.6' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* Gamificação Section */}
      <section className="py-20 px-8 text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <h2 className="text-center text-5xl font-extrabold mb-4">
          Gamificação que Funciona
        </h2>
        <p className="text-center text-xl mb-16 max-w-3xl mx-auto" style={{ opacity: 0.95 }}>
          Engajamento através de recompensas e competição saudável
        </p>
        
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: '⭐', title: 'Sistema de Pontos', desc: 'Cada quiz gera pontos baseados em precisão e velocidade de resposta' },
            { icon: '🏆', title: 'Badges & Conquistas', desc: '"5 Aulas", "Primeira 100%", "Mestre em Programação" e muito mais!' },
            { icon: '📊', title: 'Ranking em Tempo Real', desc: 'Competição saudável com nomes abreviados para privacidade total' }
          ].map((item, i) => (
            <div 
              key={i} 
              className="p-8 rounded-2xl transition-all hover:-translate-y-2"
              style={{ 
                background: 'rgba(255,255,255,0.15)', 
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.2)' 
              }}
            >
              <span className="text-5xl block mb-4">{item.icon}</span>
              <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-20 px-8" style={{ background: '#f8f9fa' }}>
        <h2 className="text-center text-5xl font-extrabold mb-4" style={{ color: '#2c3e50' }}>
          Plano Único, Sem Pegadinhas
        </h2>
        <p className="text-center text-xl mb-16" style={{ color: '#6c757d' }}>
          Transparência total, sem surpresas
        </p>
        
        <div className="max-w-lg mx-auto bg-white p-12 rounded-3xl text-center" style={{ boxShadow: '0 15px 50px rgba(102, 126, 234, 0.3)', border: '3px solid #667eea' }}>
          <div className="text-xl font-bold mb-4" style={{ color: '#667eea' }}>🎉 PLANO ESCOLAR</div>
          <div className="text-6xl font-black mb-2" style={{ color: '#2c3e50' }}>R$ XXX</div>
          <div className="text-xl mb-8" style={{ color: '#6c757d' }}>por aluno/ano</div>
          
          <ul className="text-left mb-8 space-y-4">
            {[
              '1 aula demonstrativa 100% grátis',
              'Acesso completo a todas as trilhas',
              'Sistema de gamificação incluso',
              'Relatórios detalhados',
              'Suporte técnico por email e chat',
              '99.5% de uptime garantido',
              'Adequado à LGPD',
              'Exportação de dados em CSV/PDF'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: '#e9ecef' }}>
                <span className="text-2xl font-black" style={{ color: '#43e97b' }}>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          
          <a 
            href="https://wa.me/5541995999648" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full py-4 px-8 rounded-full font-bold text-xl text-white transition-all hover:shadow-2xl hover:-translate-y-1"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Começar Agora
          </a>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-8 bg-white">
        <h2 className="text-center text-5xl font-extrabold mb-16" style={{ color: '#2c3e50' }}>
          Perguntas Frequentes
        </h2>
        
        <div className="max-w-4xl mx-auto space-y-6">
          {[
            { q: '🔒 Como funciona a segurança dos dados?', a: 'Todos os dados são isolados por escola (tenant) com criptografia completa. Seguimos rigorosamente a LGPD para proteção de dados de menores.' },
            { q: '💻 Preciso instalar algum programa?', a: 'Não! Funciona em qualquer dispositivo com navegador moderno: tablets, Chromebooks, computadores. Zero instalação necessária.' },
            { q: '📊 Posso exportar os dados dos alunos?', a: 'Sim! Todos os dados podem ser exportados em CSV/PDF. Temos relatórios detalhados de progresso por aluno e turma.' },
            { q: '🆘 Como funciona o suporte técnico?', a: 'Suporte técnico incluído por email e chat durante horário comercial. Temos 99.5% de uptime garantido durante horário letivo.' }
          ].map((faq, i) => (
            <div 
              key={i} 
              className="p-6 rounded-2xl cursor-pointer transition-all hover:bg-gray-100"
              style={{ background: '#f8f9fa' }}
            >
              <div className="font-bold text-xl mb-3" style={{ color: '#2c3e50' }}>{faq.q}</div>
              <div style={{ color: '#6c757d', lineHeight: '1.7' }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-12 px-8 text-center" style={{ background: '#2c3e50' }}>
        <p style={{ opacity: 0.8 }}>&copy; 2025 MK-SMART - Preparando o Aluno para o Futuro</p>
        <p className="mt-4" style={{ opacity: 0.6 }}>Feito com 💜 para transformar a educação tecnológica</p>
        <div className="mt-6 flex justify-center gap-8 flex-wrap" style={{ opacity: 0.7 }}>
          <span>Email: makarispo@gmail.com</span>
          <span>Tel: (41) 99599-9648</span>
          <span>www.makarispo.com</span>
        </div>
      </footer>
    </div>
  )
}