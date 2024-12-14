// Variáveis globais
let carrinho = [];
let itemAtualAvaliacao = null;
let pedidoAtualRastreamento = null;

// Funções de Toggle
function toggleMenu() {
    document.querySelector('.menu-lateral').classList.toggle('active');
}

function toggleCarrinho() {
    document.getElementById('carrinho').classList.toggle('active');
}

function toggleHistorico() {
    document.getElementById('historico-pedidos').classList.toggle('active');
}

// Sistema de Avaliações
function abrirModalAvaliacao(itemId) {
    itemAtualAvaliacao = itemId;
    document.getElementById('modal-avaliacao').style.display = 'flex';
    document.getElementById('comentario-avaliacao').value = '';
    
    // Resetar estrelas
    document.querySelectorAll('#modal-avaliacao .estrelas i').forEach(estrela => {
        estrela.classList.remove('active');
    });
}

function fecharModalAvaliacao() {
    document.getElementById('modal-avaliacao').style.display = 'none';
    itemAtualAvaliacao = null;
}

function avaliarEstrelas(valor) {
    document.querySelectorAll('#modal-avaliacao .estrelas i').forEach(estrela => {
        const valorEstrela = parseInt(estrela.dataset.valor);
        estrela.classList.toggle('active', valorEstrela <= valor);
    });
}

function enviarAvaliacao() {
    const estrelas = document.querySelectorAll('#modal-avaliacao .estrelas i.active').length;
    const comentario = document.getElementById('comentario-avaliacao').value;
    
    if (estrelas === 0) {
        mostrarMensagem('Por favor, selecione ao menos uma estrela');
        return;
    }

    const avaliacoes = JSON.parse(localStorage.getItem('avaliacoes')) || {};
    if (!avaliacoes[itemAtualAvaliacao]) {
        avaliacoes[itemAtualAvaliacao] = [];
    }

    avaliacoes[itemAtualAvaliacao].push({
        estrelas,
        comentario,
        data: new Date().toISOString()
    });

    localStorage.setItem('avaliacoes', JSON.stringify(avaliacoes));
    atualizarMediaAvaliacoes(itemAtualAvaliacao);
    fecharModalAvaliacao();
    mostrarMensagem('Avaliação enviada com sucesso!');
}

function atualizarMediaAvaliacoes(itemId) {
    const avaliacoes = JSON.parse(localStorage.getItem('avaliacoes')) || {};
    const itemAvaliacoes = avaliacoes[itemId] || [];
    
    if (itemAvaliacoes.length === 0) return;
    
    const media = itemAvaliacoes.reduce((acc, av) => acc + av.estrelas, 0) / itemAvaliacoes.length;
    const elemento = document.querySelector(`#${itemId} .media-avaliacoes`);
    if (elemento) {
        elemento.textContent = `${media.toFixed(1)} (${itemAvaliacoes.length} avaliações)`;
    }
}

// Sistema de Sabores
function abrirModalSabores(itemNome, preco) {
    const sabores = {
        'Coxinha': ['Frango', 'Frango com Catupiry', 'Carne', 'Queijo'],
        'Batata Frita': ['Tradicional', 'Com Queijo', 'Com Bacon', 'Completa'],
        // Adicione mais opções conforme necessário
    };

    const saboresDisponiveis = sabores[itemNome] || ['Tradicional'];
    const saboresLista = document.getElementById('sabores-lista');
    
    saboresLista.innerHTML = saboresDisponiveis.map(sabor => `
        <div class="sabor-opcao" onclick="selecionarSabor('${itemNome}', '${sabor}', ${preco})">
            <h3>${sabor}</h3>
            <p>R$ ${preco.toFixed(2)}</p>
        </div>
    `).join('');

    document.getElementById('modal-sabores').style.display = 'flex';
}

function fecharModalSabores() {
    document.getElementById('modal-sabores').style.display = 'none';
}

function selecionarSabor(itemNome, sabor, preco) {
    adicionarAoCarrinho(`${itemNome} - ${sabor}`, preco);
    fecharModalSabores();
}

// Funções do Carrinho
function adicionarAoCarrinho(nome, preco) {
    carrinho.push({ nome, preco });
    atualizarCarrinho();
    document.getElementById('carrinho-contador').textContent = carrinho.length;
    mostrarMensagem(`${nome} adicionado ao carrinho!`);
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarCarrinho();
    document.getElementById('carrinho-contador').textContent = carrinho.length;
    mostrarMensagem('Item removido do carrinho!');
}

function atualizarCarrinho() {
    const carrinhoItens = document.getElementById('carrinho-itens');
    const carrinhoTotal = document.getElementById('carrinho-total');
    
    carrinhoItens.innerHTML = carrinho.map((item, index) => `
        <div class="carrinho-item">
            <div>
                <p>${item.nome}</p>
                <p>R$ ${item.preco.toFixed(2)}</p>
            </div>
            <button onclick="removerDoCarrinho(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    const total = carrinho.reduce((sum, item) => sum + item.preco, 0);
    carrinhoTotal.textContent = total.toFixed(2);
}

// Finalização de Pedido
function abrirModalFinalizar() {
    if (carrinho.length === 0) {
        mostrarMensagem('Adicione itens ao carrinho primeiro!');
        return;
    }
    document.getElementById('modal-finalizar').style.display = 'flex';
}

function fecharModalFinalizar() {
    document.getElementById('modal-finalizar').style.display = 'none';
}

function enviarPedido(event) {
    event.preventDefault();
    
    const pedido = {
        id: Date.now().toString(),
        cliente: document.getElementById('nome-cliente').value,
        telefone: document.getElementById('telefone').value,
        endereco: document.getElementById('endereco').value,
        formaPagamento: document.getElementById('forma-pagamento').value,
        itens: [...carrinho],
        total: carrinho.reduce((sum, item) => sum + item.preco, 0),
        status: 'Em preparo',
        data: new Date().toISOString()
    };

    // Salvar no histórico
    const historico = JSON.parse(localStorage.getItem('historicoPedidos')) || [];
    historico.push(pedido);
    localStorage.setItem('historicoPedidos', JSON.stringify(historico));

    // Limpar carrinho e formulário
    carrinho = [];
    atualizarCarrinho();
    document.getElementById('carrinho-contador').textContent = '0';
    document.getElementById('form-finalizar').reset();
    
    fecharModalFinalizar();
    mostrarMensagem('Pedido realizado com sucesso!');
    atualizarHistorico();

    // Simular atualizações de status
    iniciarRastreamento(pedido.id);
}

// Rastreamento
function iniciarRastreamento(pedidoId) {
    pedidoAtualRastreamento = pedidoId;
    
    // Simular mudanças de status
    setTimeout(() => atualizarStatusPedido(pedidoId, 'Saiu para entrega'), 5000);
    setTimeout(() => atualizarStatusPedido(pedidoId, 'Entregue'), 10000);
}

function atualizarStatusPedido(pedidoId, novoStatus) {
    const historico = JSON.parse(localStorage.getItem('historicoPedidos')) || [];
    const pedidoIndex = historico.findIndex(p => p.id === pedidoId);
    
    if (pedidoIndex >= 0) {
        historico[pedidoIndex].status = novoStatus;
        localStorage.setItem('historicoPedidos', JSON.stringify(historico));
        atualizarHistorico();
        
        if (pedidoId === pedidoAtualRastreamento) {
            atualizarVisualizacaoRastreamento(novoStatus);
        }
    }
}

function atualizarVisualizacaoRastreamento(status) {
    const steps = ['preparo', 'saiu', 'entregue'];
    const currentStep = steps.indexOf(status.toLowerCase().replace(' para ', '-'));
    
    steps.forEach((step, index) => {
        const elemento = document.getElementById(`status-${step}`);
        if (index <= currentStep) {
            elemento.classList.add('active');
        } else {
            elemento.classList.remove('active');
        }
    });
}

// Compartilhamento
function compartilharFacebook(itemNome) {
    const url = encodeURIComponent(window.location.href);
    const texto = encodeURIComponent(`Acabei de descobrir ${itemNome} no Good Salty!`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${texto}`);
}

function compartilharTwitter(itemNome) {
    const url = encodeURIComponent(window.location.href);
    const texto = encodeURIComponent(`Acabei de descobrir ${itemNome} no Good Salty! 😋`);
    window.open(`https://twitter.com/intent/tweet?text=${texto}&url=${url}`);
}

function compartilharWhatsApp(itemNome) {
    const texto = encodeURIComponent(`Olha só que delícia: ${itemNome} no Good Salty! 😋\n${window.location.href}`);
    window.open(`https://wa.me/?text=${texto}`);
}

// Histórico
function atualizarHistorico() {
    const historico = JSON.parse(localStorage.getItem('historicoPedidos')) || [];
    const historicoLista = document.getElementById('historico-lista');
    
    historicoLista.innerHTML = historico.map(pedido => `
        <div class="historico-item">
            <p><strong>Data:</strong> ${new Date(pedido.data).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${pedido.status}</p>
            <p><strong>Total:</strong> R$ ${pedido.total.toFixed(2)}</p>
            <button onclick="abrirRastreamento('${pedido.id}')" class="btn-rastrear">
                Rastrear Pedido
            </button>
        </div>
    `).join('');
}

// Utilidades
function mostrarMensagem(texto) {
    const mensagem = document.getElementById('mensagem');
    mensagem.textContent = texto;
    mensagem.classList.add('active');
    setTimeout(() => mensagem.classList.remove('active'), 3000);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar avaliações
    const itens = document.querySelectorAll('.item');
    itens.forEach(item => {
        atualizarMediaAvaliacoes(item.id);
    });

    // Inicializar histórico
    atualizarHistorico();

    // Event listeners para estrelas
    document.querySelectorAll('#modal-avaliacao .estrelas i').forEach(estrela => {
        estrela.addEventListener('click', () => {
            avaliarEstrelas(parseInt(estrela.dataset.valor));
        });
    });
});