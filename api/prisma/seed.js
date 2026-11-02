import { PrismaClient } from '@prisma/client';
import { hashPassword, digest } from '../src/security.js';

const password = process.env.DEMO_PASSWORD;
const flag = process.env.LAB_FLAG;
if (!password || password.length < 12 || !flag || flag.length < 12) throw new Error('Defina DEMO_PASSWORD e LAB_FLAG com pelo menos 12 caracteres.');
const db = new PrismaClient();
try {
  const passwordHash = hashPassword(password);
  await db.$transaction(async tx => {
    for (const account of [
      { id: 'user-recruiter', email: 'recrutador@purpletalent.local', name: 'Camila Rocha', role: 'RECRUITER' },
      { id: 'user-mateus', email: 'candidato@purpletalent.local', name: 'Mateus Santos', role: 'CANDIDATE' },
      { id: 'user-bia', email: 'bia@purpletalent.local', name: 'Beatriz Lima', role: 'CANDIDATE' },
      { id: 'user-lucas', email: 'lucas@purpletalent.local', name: 'Lucas Silveira', role: 'CANDIDATE' }
    ]) await tx.user.upsert({ where: { email: account.email }, update: {}, create: { ...account, passwordHash } });
    for (const candidate of [
      { id: 'mateus', userId: 'user-mateus', handle: 'm4teus', track: 'PURPLE', bio: 'Estudante de Segurança da Informação em busca da primeira oportunidade.', location: 'São Paulo, SP', skills: ['Linux', 'Análise de logs', 'Segurança web'] },
      { id: 'bia', userId: 'user-bia', handle: 'cipherbia', track: 'BLUE', bio: 'Perfil fictício para demonstração de investigação e defesa.', location: 'São Paulo, SP', skills: ['Análise de logs', 'Redes', 'Resposta a incidentes'] },
      { id: 'lucas', userId: 'user-lucas', handle: 'nullbyte', track: 'RED', bio: 'Perfil fictício para demonstração de segurança de aplicações.', location: 'Santo André, SP', skills: ['Segurança web', 'HTTP', 'Linux'] }
    ]) await tx.candidate.upsert({ where: { id: candidate.id }, update: {}, create: candidate });
    for (const challenge of [
      { id: 'web-investigation', title: 'Operação Breach & Patch', description: 'Investigue a aplicação do laboratório local, encontre a evidência e descreva a correção. O organizador fornece o acesso ao ambiente.', track: 'PURPLE', points: 300, difficulty: 'Júnior', flagHash: digest(flag) },
      { id: 'log-triage', title: 'Triagem de logs HTTP', description: 'Identifique uma sequência suspeita em logs de exemplo e documente uma resposta defensiva. A atividade depende do material fornecido pelo avaliador.', track: 'BLUE', points: 200, difficulty: 'Estágio', flagHash: digest(`${flag}:blue`), active: false },
      { id: 'web-recon', title: 'Reconhecimento de aplicação', description: 'Analise as respostas HTTP no laboratório autorizado e relate a exposição encontrada.', track: 'RED', points: 200, difficulty: 'Estágio', flagHash: digest(`${flag}:red`), active: false }
    ]) await tx.challenge.upsert({ where: { id: challenge.id }, update: {}, create: challenge });
    for (const job of [
      { id: 'soc-intern', title: 'Estágio em Segurança / SOC', company: 'Empresa demonstração', description: 'Oportunidade fictícia para validar a consulta de vagas. Não recebe candidaturas reais.', track: 'BLUE', location: 'São Paulo · Híbrido', requirements: ['Análise de logs', 'Redes', 'Comunicação'] },
      { id: 'appsec-junior', title: 'Analista AppSec Júnior', company: 'Empresa demonstração', description: 'Vaga fictícia voltada à investigação de falhas e proposta de correções.', track: 'PURPLE', location: 'Remoto', requirements: ['Segurança web', 'HTTP', 'Documentação'] }
    ]) await tx.job.upsert({ where: { id: job.id }, update: {}, create: job });
  });
  console.log('Dados fictícios preparados. Contas existentes e suas senhas foram preservadas.');
} finally { await db.$disconnect(); }
