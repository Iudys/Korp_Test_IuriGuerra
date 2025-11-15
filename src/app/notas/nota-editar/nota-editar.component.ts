import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Produto } from '../../models/produto.model';
import { ProdutoService } from '../../produtos/produto.service';
import { NotaFiscal, ItemNota } from '../../models/nota-fiscal.model';
import { NotaFiscalService } from '../nota-fiscal.service';

@Component({
  selector: 'app-nota-editar',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, RouterLink ],
  templateUrl: './nota-editar.component.html',
  styleUrls: ['./nota-editar.component.scss'] //o mesmo estilo
})
export class NotaEditarComponent implements OnInit {

  notaForm: FormGroup;
  produtosDisponiveis$: Observable<Produto[]>;
  errorMessage: string | null = null;
  notaId!: number;
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private notaService: NotaFiscalService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.produtosDisponiveis$ = this.produtoService.getProdutos();
    
    this.notaForm = this.fb.group({
      itens: this.fb.array([], Validators.required) 
    });
  }

  ngOnInit(): void {
    // Carrega os dados da nota para preencher o formulário
    this.route.paramMap.pipe(
      tap(params => {
        this.notaId = Number(params.get('id'));
      }),
      // Carrega a nota e a lista de produtos em paralelo
      switchMap(params => {
        if (!this.notaId) return of(null);
        
        return forkJoin({
          nota: this.notaService.getNotaById(this.notaId),
          produtos: this.produtosDisponiveis$ // Usa o observable já existente
        });
      })
    ).subscribe(dados => {
      if (dados) {
        // Preenche o formulário com os itens da nota
        this.preencherFormulario(dados.nota, dados.produtos);
      }
      this.isLoading = false;
    });
  }
  
  // Preenche o FormArray com os itens existentes
  preencherFormulario(nota: NotaFiscal, produtos: Produto[]): void {
    const itensFormGroups = nota.itens.map(item => {
      // Encontra o objeto 'Produto' completo para o dropdown
      const produtoCompleto = produtos.find(p => p.id === item.produtoId);
      
      return this.fb.group({
        produto: [produtoCompleto, Validators.required],
        quantidade: [item.quantidade, [Validators.required, Validators.min(1)]]
      });
    });
    // Define o FormArray com os grupos preenchidos
    this.notaForm.setControl('itens', this.fb.array(itensFormGroups));
  }

  get itens(): FormArray {
    return this.notaForm.get('itens') as FormArray;
  }

  novoItem(): FormGroup {
    return this.fb.group({
      produto: [null, Validators.required],
      quantidade: [1, [Validators.required, Validators.min(1)]]
    });
  }

  adicionarItem(): void {
    this.itens.push(this.novoItem());
  }

  removerItem(index: number): void {
    this.itens.removeAt(index);
  }

  compararProdutos(p1: Produto, p2: Produto): boolean {
    return p1 && p2 ? p1.id === p2.id : p1 === p2;
  }

  // Ação de Salvar (chama ATUALIZAR, não CRIAR)
  onSubmit(): void {
    if (this.notaForm.invalid) {
      this.errorMessage = "Formulário inválido.";
      return;
    }

    const formValues = this.notaForm.value.itens;

    const payload = {
      itens: formValues.map((item: any) => ({
        produtoId: item.produto.id,
        descricaoProduto: item.produto.descricao,
        quantidade: item.quantidade
      }))
    };

    // Chama o serviço de ATUALIZAR
    this.notaService.atualizarNota(this.notaId, payload).subscribe({
      next: (notaAtualizada) => {
        // Sucesso! Volta para a tela de detalhe
        this.router.navigate(['/nota', notaAtualizada.id]);
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || err.error || "Erro ao salvar a nota.";
      }
    });
  }
}