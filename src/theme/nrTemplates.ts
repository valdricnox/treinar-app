export interface NRItem {
  id: string;
  texto: string;
  conforme: boolean | null;
  observacao?: string;
  foto?: string;
  critico?: boolean;
}

export interface NRGrupo {
  titulo: string;
  descricao: string;
  icone: string;
  itens: NRItem[];
}

export interface NRTemplate {
  norma: string;
  label: string;
  descricao: string;
  cor: string;
  icone: string;
  categoria: string;
  grupos: NRGrupo[];
  itens: NRItem[];
}

function flat(grupos: NRGrupo[]): NRItem[] {
  return grupos.flatMap(g => g.itens);
}

const _raw: Omit<NRTemplate, 'itens'>[] = [
  { norma:'NR-5', label:'NR-5 — CIPA', descricao:'Comissão Interna de Prevenção de Acidentes', cor:'#0A84FF', icone:'🛡️', categoria:'Gestão', grupos:[
    { titulo:'Constituição da CIPA', descricao:'Comissão legalmente constituída', icone:'📋', itens:[
      { id:'nr5-1', texto:'CIPA constituída e registrada no MTE', conforme:null, critico:true },
      { id:'nr5-2', texto:'Membros eleitos e designados conforme dimensionamento', conforme:null },
      { id:'nr5-3', texto:'Presidente e vice-presidente eleitos', conforme:null },
    ]},
    { titulo:'Funcionamento e registros', descricao:'Reuniões, atas e treinamentos', icone:'📅', itens:[
      { id:'nr5-4', texto:'Reuniões mensais realizadas e documentadas', conforme:null },
      { id:'nr5-5', texto:'Ata das reuniões arquivadas', conforme:null },
      { id:'nr5-6', texto:'Treinamento dos membros da CIPA realizado', conforme:null },
      { id:'nr5-7', texto:'Mapa de riscos elaborado e afixado', conforme:null, critico:true },
    ]},
  ]},
  { norma:'NR-6', label:'NR-6 — EPI', descricao:'Equipamentos de Proteção Individual', cor:'#30D158', icone:'🦺', categoria:'Proteção', grupos:[
    { titulo:'Disponibilidade e validade', descricao:'EPIs válidos e com CA', icone:'✅', itens:[
      { id:'nr6-1', texto:'EPIs adequados disponíveis para todos os trabalhadores', conforme:null, critico:true },
      { id:'nr6-2', texto:'EPIs dentro do prazo de validade', conforme:null, critico:true },
      { id:'nr6-3', texto:'CA (Certificado de Aprovação) válido para todos os EPIs', conforme:null, critico:true },
    ]},
    { titulo:'Uso, entrega e controle', descricao:'Treinamento, fichas e armazenamento', icone:'📝', itens:[
      { id:'nr6-4', texto:'Trabalhadores treinados para uso correto dos EPIs', conforme:null },
      { id:'nr6-5', texto:'Ficha de EPI preenchida e atualizada', conforme:null },
      { id:'nr6-6', texto:'Registro de entrega de EPIs assinado pelos trabalhadores', conforme:null },
      { id:'nr6-7', texto:'EPIs armazenados adequadamente e higienizados', conforme:null },
      { id:'nr6-8', texto:'EPIs danificados substituídos imediatamente', conforme:null, critico:true },
    ]},
  ]},
  { norma:'NR-7', label:'NR-7 — PCMSO', descricao:'Programa de Controle Médico de Saúde Ocupacional', cor:'#FF6B6B', icone:'🏥', categoria:'Saúde', grupos:[
    { titulo:'Programa e exames médicos', descricao:'PCMSO e exames em dia', icone:'📄', itens:[
      { id:'nr7-1', texto:'PCMSO elaborado por médico do trabalho', conforme:null, critico:true },
      { id:'nr7-2', texto:'Exames admissionais realizados', conforme:null, critico:true },
      { id:'nr7-3', texto:'Exames periódicos em dia para todos os funcionários', conforme:null, critico:true },
      { id:'nr7-4', texto:'Exames demissionais realizados', conforme:null },
    ]},
    { titulo:'Documentação e saúde', descricao:'ASOs, vacinas e relatórios', icone:'🗂️', itens:[
      { id:'nr7-5', texto:'ASO (Atestado de Saúde Ocupacional) arquivados', conforme:null },
      { id:'nr7-6', texto:'Programa de vacinação implementado quando necessário', conforme:null },
      { id:'nr7-7', texto:'Relatório anual do PCMSO elaborado', conforme:null },
    ]},
  ]},
  { norma:'NR-9', label:'NR-9 — PPRA', descricao:'Programa de Prevenção de Riscos Ambientais', cor:'#5E5CE6', icone:'🌿', categoria:'Ambiental', grupos:[
    { titulo:'Identificação de riscos', descricao:'Agentes físicos, químicos e biológicos', icone:'🔍', itens:[
      { id:'nr9-1', texto:'PPRA elaborado e implementado', conforme:null, critico:true },
      { id:'nr9-2', texto:'Agentes físicos, químicos e biológicos identificados', conforme:null, critico:true },
      { id:'nr9-3', texto:'Medições de agentes ambientais realizadas', conforme:null },
    ]},
    { titulo:'Controle e comunicação', descricao:'Medidas e informação aos trabalhadores', icone:'📢', itens:[
      { id:'nr9-4', texto:'Medidas de controle coletivas implementadas', conforme:null },
      { id:'nr9-5', texto:'Trabalhadores informados sobre os riscos', conforme:null },
      { id:'nr9-6', texto:'Documento Base do PPRA assinado pela empresa', conforme:null },
      { id:'nr9-7', texto:'PPRA revisado anualmente', conforme:null },
    ]},
  ]},
  { norma:'NR-10', label:'NR-10 — Eletricidade', descricao:'Segurança em Instalações e Serviços com Eletricidade', cor:'#FFD60A', icone:'⚡', categoria:'Elétrica', grupos:[
    { titulo:'Habilitação e EPIs elétricos', descricao:'Treinamento e proteção individual', icone:'🎓', itens:[
      { id:'nr10-1', texto:'Trabalhadores com treinamento NR-10 atualizado', conforme:null, critico:true },
      { id:'nr10-4', texto:'Ferramentas isoladas para trabalhos elétricos com CA', conforme:null },
      { id:'nr10-5', texto:'EPIs elétricos disponíveis (luvas, capacetes classe B)', conforme:null, critico:true },
    ]},
    { titulo:'Instalações e procedimentos', descricao:'Quadros, LOTO e aterramento', icone:'🔌', itens:[
      { id:'nr10-2', texto:'Quadros elétricos identificados, sinalizados e trancados', conforme:null, critico:true },
      { id:'nr10-3', texto:'Distâncias de segurança respeitadas', conforme:null, critico:true },
      { id:'nr10-6', texto:'Procedimentos LOTO (bloqueio e etiquetagem) implementados', conforme:null, critico:true },
      { id:'nr10-7', texto:'Instalações elétricas em conformidade com ABNT NBR 5410', conforme:null },
      { id:'nr10-8', texto:'Aterramento das instalações verificado e documentado', conforme:null },
      { id:'nr10-9', texto:'Prontuário das instalações elétricas atualizado', conforme:null },
    ]},
  ]},
  { norma:'NR-11', label:'NR-11 — Transporte', descricao:'Transporte, Movimentação, Armazenagem e Manuseio de Materiais', cor:'#FF9F0A', icone:'🏗️', categoria:'Operações', grupos:[
    { titulo:'Operadores e equipamentos', descricao:'Habilitação, manutenção e capacidade', icone:'🚜', itens:[
      { id:'nr11-1', texto:'Operadores de equipamentos com habilitação/treinamento', conforme:null, critico:true },
      { id:'nr11-2', texto:'Manutenção preventiva dos equipamentos em dia', conforme:null, critico:true },
      { id:'nr11-3', texto:'Capacidade de carga respeitada em todos os equipamentos', conforme:null, critico:true },
      { id:'nr11-6', texto:'Dispositivos de segurança dos equipamentos funcionando', conforme:null, critico:true },
    ]},
    { titulo:'Armazenagem e circulação', descricao:'Organização e sinalização de tráfego', icone:'📦', itens:[
      { id:'nr11-4', texto:'Sinalização de circulação de veículos e pedestres', conforme:null },
      { id:'nr11-5', texto:'Armazenagem de materiais de forma segura e organizada', conforme:null },
    ]},
  ]},
  { norma:'NR-12', label:'NR-12 — Máquinas', descricao:'Segurança no Trabalho em Máquinas e Equipamentos', cor:'#FF3B30', icone:'⚙️', categoria:'Máquinas', grupos:[
    { titulo:'Proteções e dispositivos de segurança', descricao:'Proteções físicas e parada de emergência', icone:'🛑', itens:[
      { id:'nr12-1', texto:'Proteções fixas e móveis instaladas em todas as máquinas', conforme:null, critico:true },
      { id:'nr12-2', texto:'Dispositivos de parada de emergência funcionando', conforme:null, critico:true },
      { id:'nr12-3', texto:'Distâncias de segurança respeitadas', conforme:null, critico:true },
      { id:'nr12-4', texto:'Sinalização de segurança nas máquinas e equipamentos', conforme:null },
    ]},
    { titulo:'Documentação e treinamento', descricao:'Manuais, laudos e capacitação', icone:'📚', itens:[
      { id:'nr12-5', texto:'Manual de operação disponível em português', conforme:null },
      { id:'nr12-6', texto:'Trabalhadores treinados para operação segura', conforme:null },
      { id:'nr12-7', texto:'Manutenção preventiva em dia com registro', conforme:null },
      { id:'nr12-8', texto:'Laudo de conformidade NR-12 atualizado', conforme:null, critico:true },
    ]},
  ]},
  { norma:'NR-17', label:'NR-17 — Ergonomia', descricao:'Ergonomia', cor:'#32ADE6', icone:'🧘', categoria:'Saúde', grupos:[
    { titulo:'Análise e postos de trabalho', descricao:'AET e adequação ergonômica', icone:'🔬', itens:[
      { id:'nr17-1', texto:'Análise ergonômica do trabalho realizada', conforme:null, critico:true },
      { id:'nr17-2', texto:'Postos de trabalho adaptados às características dos trabalhadores', conforme:null },
      { id:'nr17-3', texto:'Mobiliário ajustável e adequado', conforme:null },
      { id:'nr17-4', texto:'Equipamentos de trabalho adequados à tarefa', conforme:null },
    ]},
    { titulo:'Condições ambientais e pausas', descricao:'Ambiente e intervalos obrigatórios', icone:'⏰', itens:[
      { id:'nr17-5', texto:'Condições ambientais (iluminação, ruído, temperatura) adequadas', conforme:null },
      { id:'nr17-6', texto:'Pausas e intervalos respeitados conforme legislação', conforme:null },
      { id:'nr17-7', texto:'Trabalhadores treinados sobre posturas corretas', conforme:null },
    ]},
  ]},
  { norma:'NR-18', label:'NR-18 — Construção Civil', descricao:'Condições e Meio Ambiente na Construção', cor:'#FF6B35', icone:'🏚️', categoria:'Construção', grupos:[
    { titulo:'PCMAT e área de vivência', descricao:'Programa e instalações dos trabalhadores', icone:'🏠', itens:[
      { id:'nr18-1', texto:'PCMAT elaborado e implementado', conforme:null, critico:true },
      { id:'nr18-2', texto:'Instalações sanitárias: banheiros e vestiários adequados', conforme:null },
      { id:'nr18-3', texto:'Refeitório e local para refeição disponíveis', conforme:null },
      { id:'nr18-10', texto:'Área de vivência completa e em boas condições', conforme:null },
    ]},
    { titulo:'Proteções coletivas e sinalização', descricao:'Andaimes, redes e canteiro', icone:'🚧', itens:[
      { id:'nr18-4', texto:'Andaimes e escadas em boas condições e fixados', conforme:null, critico:true },
      { id:'nr18-5', texto:'Redes de proteção contra queda de materiais instaladas', conforme:null, critico:true },
      { id:'nr18-6', texto:'Sinalização perimetral do canteiro de obras', conforme:null },
      { id:'nr18-7', texto:'Almoxarifado organizado e seguro', conforme:null },
      { id:'nr18-8', texto:'Trabalhadores com NR-18 em dia', conforme:null },
      { id:'nr18-9', texto:'Descarte correto de resíduos da construção civil', conforme:null },
    ]},
  ]},
  { norma:'NR-20', label:'NR-20 — Inflamáveis', descricao:'Segurança e Saúde com Inflamáveis e Combustíveis', cor:'#FF3B30', icone:'🔥', categoria:'Risco', grupos:[
    { titulo:'Armazenamento e documentação', descricao:'Local seguro e FISPQs', icone:'🗄️', itens:[
      { id:'nr20-1', texto:'Inflamáveis armazenados em local adequado e sinalizado', conforme:null, critico:true },
      { id:'nr20-2', texto:'Fichas de informação de segurança (FISPQ) disponíveis', conforme:null, critico:true },
      { id:'nr20-6', texto:'Licenças e alvarás dos tanques em dia', conforme:null },
    ]},
    { titulo:'Equipamentos e treinamento', descricao:'Proteção antiexplosão e capacitação', icone:'⚠️', itens:[
      { id:'nr20-3', texto:'Equipamentos antiexplosão utilizados onde necessário', conforme:null, critico:true },
      { id:'nr20-4', texto:'Trabalhadores treinados para manipulação de inflamáveis', conforme:null, critico:true },
      { id:'nr20-5', texto:'Sistema de aterramento dos recipientes verificado', conforme:null },
    ]},
  ]},
  { norma:'NR-21', label:'NR-21 — Trabalho a Céu Aberto', descricao:'Trabalho a Céu Aberto', cor:'#30D158', icone:'☀️', categoria:'Ambiental', grupos:[
    { titulo:'Proteção contra intempéries', descricao:'Sol, calor, chuva e riscos climáticos', icone:'🌤️', itens:[
      { id:'nr21-1', texto:'Proteção contra insolação excessiva e calor', conforme:null, critico:true },
      { id:'nr21-2', texto:'Abrigos para proteção contra chuva e frio disponíveis', conforme:null },
      { id:'nr21-6', texto:'Atividades interrompidas em condições climáticas de risco', conforme:null },
    ]},
    { titulo:'Hidratação e pausas', descricao:'Água potável e intervalos de descanso', icone:'💧', itens:[
      { id:'nr21-3', texto:'Água potável fresca disponível no local de trabalho', conforme:null, critico:true },
      { id:'nr21-4', texto:'Protetor solar fornecido e aplicado pelos trabalhadores', conforme:null },
      { id:'nr21-5', texto:'Intervalos de descanso em local fresco respeitados', conforme:null },
    ]},
  ]},
  { norma:'NR-23', label:'NR-23 — Incêndio', descricao:'Proteção Contra Incêndios', cor:'#FF3B30', icone:'🧯', categoria:'Emergência', grupos:[
    { titulo:'Equipamentos de combate a incêndio', descricao:'Extintores, hidrantes e armazenamento', icone:'🚒', itens:[
      { id:'nr23-1', texto:'Extintores disponíveis, sinalizados e dentro do prazo', conforme:null, critico:true },
      { id:'nr23-4', texto:'Hidrantes e mangueiras em boas condições de uso', conforme:null },
      { id:'nr23-8', texto:'Materiais inflamáveis armazenados separados de ignição', conforme:null },
    ]},
    { titulo:'Rotas de fuga e brigada', descricao:'Saídas de emergência e treinamento', icone:'🚪', itens:[
      { id:'nr23-2', texto:'Sinalização de saídas de emergência visível e iluminada', conforme:null, critico:true },
      { id:'nr23-3', texto:'Rotas de fuga completamente desobstruídas', conforme:null, critico:true },
      { id:'nr23-5', texto:'Treinamento de combate a incêndio realizado', conforme:null },
      { id:'nr23-6', texto:'Brigada de incêndio formada e treinada', conforme:null, critico:true },
      { id:'nr23-7', texto:'Planta de evacuação afixada em locais visíveis', conforme:null },
    ]},
  ]},
  { norma:'NR-26', label:'NR-26 — Sinalização', descricao:'Sinalização de Segurança', cor:'#FFD60A', icone:'🚧', categoria:'Sinalização', grupos:[
    { titulo:'Instalação e padronização', descricao:'Sinalizações corretas e cores padrão', icone:'🟡', itens:[
      { id:'nr26-1', texto:'Sinalização de segurança instalada em todos os locais de risco', conforme:null, critico:true },
      { id:'nr26-2', texto:'Cores padronizadas conforme NR-26 (vermelho, amarelo, verde, azul)', conforme:null },
      { id:'nr26-6', texto:'Proibições e obrigatoriedades claramente sinalizadas', conforme:null },
    ]},
    { titulo:'Conservação e especificidades', descricao:'Estado de conservação e tubulações', icone:'🔧', itens:[
      { id:'nr26-3', texto:'Sinalização de tubulações e equipamentos', conforme:null },
      { id:'nr26-4', texto:'Sinalizações em bom estado de conservação e limpeza', conforme:null },
      { id:'nr26-5', texto:'Sinalização de áreas de circulação e armazenamento', conforme:null },
    ]},
  ]},
  { norma:'NR-33', label:'NR-33 — Espaços Confinados', descricao:'Segurança e Saúde em Espaços Confinados', cor:'#5E5CE6', icone:'🕳️', categoria:'Risco', grupos:[
    { titulo:'Identificação e autorização', descricao:'Cadastro de espaços e PET', icone:'📋', itens:[
      { id:'nr33-1', texto:'Espaços confinados identificados, cadastrados e sinalizados', conforme:null, critico:true },
      { id:'nr33-2', texto:'Permissão de Entrada e Trabalho (PET) emitida', conforme:null, critico:true },
      { id:'nr33-8', texto:'Trabalhadores com treinamento NR-33 atualizado', conforme:null, critico:true },
    ]},
    { titulo:'Equipamentos e operação segura', descricao:'Monitoramento, resgate e comunicação', icone:'🎯', itens:[
      { id:'nr33-3', texto:'Vigias treinados NR-33 e designados no local', conforme:null, critico:true },
      { id:'nr33-4', texto:'Equipamentos de monitoramento de gases disponíveis e calibrados', conforme:null, critico:true },
      { id:'nr33-5', texto:'Equipamentos de resgate disponíveis no local', conforme:null, critico:true },
      { id:'nr33-6', texto:'Ventilação mecânica adequada do espaço', conforme:null, critico:true },
      { id:'nr33-7', texto:'Comunicação contínua entre entrador e vigia', conforme:null },
    ]},
  ]},
  { norma:'NR-35', label:'NR-35 — Trabalho em Altura', descricao:'Trabalho em Altura (acima de 2 metros)', cor:'#0A84FF', icone:'🧗', categoria:'Altura', grupos:[
    { titulo:'Habilitação e EPIs de altura', descricao:'Treinamento e equipamentos obrigatórios', icone:'🎓', itens:[
      { id:'nr35-1', texto:'Trabalhadores com treinamento NR-35 atualizado', conforme:null, critico:true },
      { id:'nr35-2', texto:'Cinturão tipo paraquedista com CA válido', conforme:null, critico:true },
      { id:'nr35-3', texto:'Trava-quedas e talabarte duplo em boas condições', conforme:null, critico:true },
      { id:'nr35-9', texto:'Capacete com jugular em uso', conforme:null },
      { id:'nr35-10', texto:'Ferramentas com trava/cordão anti-queda', conforme:null },
    ]},
    { titulo:'Ancoragem e planejamento', descricao:'Pontos seguros, AR e plano de resgate', icone:'⚓', itens:[
      { id:'nr35-4', texto:'Pontos de ancoragem adequados, identificados e testados', conforme:null, critico:true },
      { id:'nr35-5', texto:'Plano de Resgate elaborado e comunicado a todos', conforme:null, critico:true },
      { id:'nr35-6', texto:'Análise de Risco (AR) realizada antes da atividade', conforme:null, critico:true },
      { id:'nr35-7', texto:'Sinalização e isolamento da área abaixo do trabalho', conforme:null },
      { id:'nr35-8', texto:'Condições climáticas avaliadas (sem chuva, raios ou ventos)', conforme:null, critico:true },
    ]},
  ]},
];

export const NR_TEMPLATES: Record<string, NRTemplate> = Object.fromEntries(
  _raw.map(t => [t.norma, { ...t, itens: flat(t.grupos) }])
);
export const NR_LIST = Object.values(NR_TEMPLATES);
export const NR_CATEGORIAS = ['Todas','Proteção','Saúde','Gestão','Construção','Elétrica','Máquinas','Risco','Emergência','Altura','Operações','Ambiental','Sinalização'];
