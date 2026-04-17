import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  produtos: any[] = [];
  notas: any[] = [];
  novoProduto = { codigo: '', descricao: '', saldo: 0 };
  produtoIdSelecionado: number = 0;
  quantidadeVenda: number = 1;
  
  mensagemErro: string = '';
  mensagemSucesso: string = '';
  
  // Controles de Animação (Loading)
  carregandoImpressao: boolean = false;
  carregandoDescricao: boolean = false;
  carregandoRelatorio: boolean = false;
  carregandoAuditoria: { [key: number]: boolean } = {};

  // Respostas da IA
  relatorioIA: string = '';
  sugestoesNota: { [key: number]: string } = {}; 

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.carregarListas(); }

  carregarListas() {
    this.api.getProdutos().subscribe((dados: any) => {
      this.produtos = dados;
      this.cdr.detectChanges();
    });
    this.api.getNotas().subscribe((dados: any) => {
      this.notas = dados;
      this.cdr.detectChanges();
    });
  }

  salvarProduto() {
    this.api.cadastrarProduto(this.novoProduto).subscribe(() => {
      this.carregarListas();
      this.mostrarSucesso('Produto salvo com sucesso!');
    });
  }

  alterarQuantidade(produto: any, valor: number) {
    const novoSaldo = produto.saldo + valor;
    if (novoSaldo >= 0) {
      const produtoAtualizado = { ...produto, saldo: novoSaldo };
      this.api.atualizarProduto(produto.id, produtoAtualizado).subscribe(() => { 
        produto.saldo = novoSaldo; 
        this.cdr.detectChanges(); 
      });
    }
  }

  excluirProduto(id: number) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      this.api.excluirProduto(id).subscribe(() => { 
        this.mostrarSucesso('Produto excluído com sucesso.'); 
        this.carregarListas(); 
      });
    }
  }

  abrirNovaNota() {
    const nota = { itens: [{ produtoId: this.produtoIdSelecionado, quantidade: this.quantidadeVenda }] };
    this.api.abrirNota(nota).subscribe(() => {
      this.carregarListas();
      this.mostrarSucesso('Nota fiscal aberta!');
    });
  }

  imprimir(notaId: number) {
    this.carregandoImpressao = true;
    this.mensagemErro = ''; this.mensagemSucesso = '';

    this.api.imprimirNota(notaId).subscribe({
      next: (resposta: any) => {
        this.mostrarSucesso(resposta);
        this.carregarListas();
        this.carregandoImpressao = false;
        this.sugestoesNota[notaId] = ''; // Limpa a sugestão de cross-sell após imprimir
        this.cdr.detectChanges();
      },
      error: (erro: any) => {
        this.mensagemErro = erro.message;
        this.carregandoImpressao = false;
        this.cdr.detectChanges();
      }
    });
  }

  // =======================================================
  // FUNÇÕES DE INTELIGÊNCIA ARTIFICIAL
  // =======================================================
  
  pedirAjudaIA() {
    if (!this.novoProduto.codigo) {
      this.mensagemErro = "Digite pelo menos um nome provisório no código para a IA analisar!";
      setTimeout(() => this.mensagemErro = '', 4000);
      return;
    }
    this.carregandoDescricao = true;
    this.cdr.detectChanges();

    this.api.gerarDescricaoIA(this.novoProduto.codigo).subscribe({
      next: (retorno: any) => {
        this.novoProduto.descricao = retorno.descricaoSugerida;
        this.carregandoDescricao = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregandoDescricao = false;
        this.cdr.detectChanges();
      }
    });
  }

  gerarRelatorioReposicao() {
    this.carregandoRelatorio = true;
    this.cdr.detectChanges();

    this.api.gerarRelatorioReposicao().subscribe({
      next: (retorno: any) => {
        this.relatorioIA = retorno.relatorio;
        this.carregandoRelatorio = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregandoRelatorio = false;
        this.cdr.detectChanges();
      }
    });
  }

  auditarCrossSell(notaId: number) {
    this.carregandoAuditoria[notaId] = true;
    this.cdr.detectChanges();

    this.api.auditarCrossSell(notaId).subscribe({
      next: (retorno: any) => {
        this.sugestoesNota[notaId] = retorno.sugestao;
        this.carregandoAuditoria[notaId] = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregandoAuditoria[notaId] = false;
        this.cdr.detectChanges();
      }
    });
  }

  private mostrarSucesso(msg: string) {
    this.mensagemErro = ''; this.mensagemSucesso = msg; this.cdr.detectChanges();
    setTimeout(() => { this.mensagemSucesso = ''; this.cdr.detectChanges(); }, 4000);
  }
}