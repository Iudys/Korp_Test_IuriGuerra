import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Produto } from '../../models/produto.model';
import { ProdutoService } from '../../produtos/produto.service';
import { NotaFiscalService } from '../nota-fiscal.service';

@Component({
  selector: 'app-nota-cadastro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, 
    RouterLink
  ],
  templateUrl: './nota-cadastro.component.html', // Corrigido
  styleUrls: ['./nota-cadastro.component.scss']
})
export class NotaCadastroComponent implements OnInit {

  notaForm: FormGroup;
  produtosDisponiveis$: Observable<Produto[]>;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private notaService: NotaFiscalService,
    private router: Router
  ) {
    this.produtosDisponiveis$ = this.produtoService.getProdutos();
    
    this.notaForm = this.fb.group({
      itens: this.fb.array([], Validators.required) 
    });
  }

  ngOnInit(): void {
    this.adicionarItem(); 
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
    if (this.itens.length > 1) {
      this.itens.removeAt(index);
    }
  }

  compararProdutos(p1: Produto, p2: Produto): boolean {
    return p1 && p2 ? p1.id === p2.id : p1 === p2;
  }

  onSubmit(): void {
    if (this.notaForm.invalid) {
      this.errorMessage = "Formulário inválido. Verifique os campos.";
      return;
    }

    
    //'get('itens')' nunca será nulo.
    const formValues: { produto: Produto, quantidade: number }[] = this.notaForm.get('itens')!.value;

    const payload = {
      itens: formValues.map(item => ({
        produtoId: item.produto.id,
        descricaoProduto: item.produto.descricao,
        quantidade: item.quantidade
      }))
    };

    this.notaService.criarNota(payload).subscribe({
      next: (notaCriada) => {
        this.router.navigate(['/notas']);
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || err.error || "Erro ao salvar a nota.";
      }
    });
  }
}