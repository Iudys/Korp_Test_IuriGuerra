import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Produto } from '../../models/produto.model';
import { ProdutoService } from '../produto.service';

@Component({
  selector: 'app-produto-lista',
  standalone: true,
  imports: [ 
    CommonModule, 
    ReactiveFormsModule
  ],
  templateUrl: './produto-lista.component.html',
  styleUrls: ['./produto-lista.component.scss']
})
export class ProdutoListaComponent implements OnInit {

  // BehaviorSubject é a "lista viva" de produtos na tela
  private produtosSubject = new BehaviorSubject<Produto[]>([]);
  produtos$: Observable<Produto[]> = this.produtosSubject.asObservable();
  
  produtoForm: FormGroup;
  isLoading = false;

  constructor(
    private produtoService: ProdutoService,
    private fb: FormBuilder
  ) {
    this.produtoForm = this.fb.group({
      codigo: ['', Validators.required],
      descricao: ['', Validators.required],
      saldo: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.isLoading = true;
    this.produtoService.getProdutos().pipe(
      tap(() => this.isLoading = false)
    ).subscribe(produtos => this.produtosSubject.next(produtos));
  }

  onSubmit(): void {
    if (this.produtoForm.invalid) return;

    this.produtoService.adicionarProduto(this.produtoForm.value).subscribe(
      produtoSalvo => {
        const listaAtual = this.produtosSubject.value;
        this.produtosSubject.next([...listaAtual, produtoSalvo]);
        this.produtoForm.reset({ saldo: 0 });
      }
    );
  }

  onAdicionarEstoque(produto: Produto, quantidadeStr: string): void {
    const quantidade = Number(quantidadeStr);
    if (isNaN(quantidade) || quantidade <= 0) {
      alert('Por favor, insira uma quantidade válida.');
      return;
    }

    this.produtoService.adicionarEstoque(produto.id, quantidade).subscribe({
      next: (produtoAtualizado) => {
        this.atualizarProdutoNaLista(produtoAtualizado);
      },
      error: (err) => {
        alert('Erro ao ATUALIZAR o estoque: ' + (err.error.detail || err.error));
      }
    });
  }

  // --- NOVO MÉTODO (1) ---
  onRemoverEstoque(produto: Produto, quantidadeStr: string): void {
    const quantidade = Number(quantidadeStr);
    if (isNaN(quantidade) || quantidade <= 0) {
      alert('Por favor, insira uma quantidade válida.');
      return;
    }

    this.produtoService.removerEstoque(produto.id, quantidade).subscribe({
      next: (produtoAtualizado) => {
        this.atualizarProdutoNaLista(produtoAtualizado);
      },
      error: (err) => {
        // Ex: Captura o erro "Saldo insuficiente" do backend
        alert('Erro ao REMOVER do estoque: ' + (err.error.detail || err.error));
      }
    });
  }

  
  onDeletarProduto(produto: Produto): void {
    // Pergunta de confirmação
    if (!confirm(`Tem certeza que deseja remover o produto "${produto.descricao}"?`)) {
      return;
    }

    this.produtoService.deletarProduto(produto.id).subscribe({
      next: () => {
        // Remove o produto da lista local (BehaviorSubject)
        const listaAtual = this.produtosSubject.value;
        const novaLista = listaAtual.filter(p => p.id !== produto.id);
        this.produtosSubject.next(novaLista);
      },
      error: (err) => {
        alert('Erro ao DELETAR o produto: ' + (err.error.detail || err.error));
      }
    });
  }

  /**
   * Função auxiliar para atualizar o saldo de um produto na lista
   * sem precisar recarregar a página.
   */
  private atualizarProdutoNaLista(produtoAtualizado: Produto): void {
    const listaAtual = this.produtosSubject.value;
    const index = listaAtual.findIndex(p => p.id === produtoAtualizado.id);
    if (index !== -1) {
      listaAtual[index] = produtoAtualizado;
      this.produtosSubject.next([...listaAtual]); // Emite nova lista
    }
  }
}