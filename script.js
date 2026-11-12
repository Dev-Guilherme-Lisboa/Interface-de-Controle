const URL_THINGSPEAK = 'https://api.thingspeak.com/channels/3575471/feeds/last.json?api_key=ZC5FDVUBBV4E2YG9';
let pausado = false;

function definirEstado(temperatura, vibracao, codigo) {
  if (codigo === '2' || temperatura >= 58 || vibracao >= 2.35) {
    return ['critico', 'Crítico'];
  }
  if (codigo === '1' || temperatura >= 48 || vibracao >= 1.8) {
    return ['atencao', 'Atenção'];
  }
  return ['normal', 'Normal'];
}

function mostrarDados(temperatura, vibracao, saude, codigo, mensagem) {
  const resultado = definirEstado(temperatura, vibracao, codigo);
  document.getElementById('estado').className = 'estado ' + resultado[0];
  document.getElementById('textoEstado').textContent = resultado[1];
  document.getElementById('mensagem').textContent = mensagem;
  document.getElementById('temperatura').innerHTML = temperatura.toFixed(1) + ' <span class="unidade">°C</span>';
  document.getElementById('vibracao').innerHTML = vibracao.toFixed(2) + ' <span class="unidade">g</span>';
  document.getElementById('saude').innerHTML = saude + '<span class="unidade">%</span>';
  const barraSaude = document.getElementById('barraSaude');
  barraSaude.style.width = saude + '%';
  barraSaude.className = 'barra ' + (saude >= 80 ? '' : saude >= 50 ? 'atencao' : 'critico');
}

async function carregarDados() {
  try {
    const resposta = await fetch(URL_THINGSPEAK + '&_=' + Date.now(), { cache: 'no-store' });
    if (!resposta.ok) throw new Error('Falha na leitura');

    const dados = await resposta.json();
    const temperatura = Number(dados.field1);
    const vibracao = Number(dados.field2);
    const saude = Math.max(0, Math.min(100, Math.round(Number(dados.field3))));

    if (![temperatura, vibracao, saude].every(Number.isFinite)) {
      throw new Error('Campos incompletos');
    }

    document.getElementById('conexao').className = 'conexao';
    document.getElementById('textoConexao').textContent = 'ThingSpeak conectado';

    const horario = dados.created_at
      ? new Date(dados.created_at).toLocaleTimeString('pt-BR')
      : 'agora';
    mostrarDados(temperatura, vibracao, saude, dados.field4, 'Última leitura: ' + horario);
  } catch (erro) {
    document.getElementById('conexao').className = 'conexao erro';
    document.getElementById('textoConexao').textContent = 'ThingSpeak indisponível';
    document.getElementById('mensagem').textContent = 'Não foi possível ler o canal agora';
  }
}

function mostrarCenario(nome) {
  const cenarios = {
    normal: [43.7, 1.12, 94, '0'],
    atencao: [51.6, 1.96, 76, '1'],
    critico: [61.4, 2.62, 38, '2']
  };
  const dados = cenarios[nome];

  document.getElementById('conexao').className = 'conexao';
  document.getElementById('textoConexao').textContent = 'Cenário local';
  mostrarDados(dados[0], dados[1], dados[2], dados[3], 'Cenário aplicado localmente');
}

function alternarPausa() {
  pausado = !pausado;
  document.getElementById('botaoPausa').textContent = pausado
    ? 'Retomar atualização'
    : 'Pausar atualização';
}

carregarDados();
setInterval(function () {
  if (!pausado) carregarDados();
}, 16000);