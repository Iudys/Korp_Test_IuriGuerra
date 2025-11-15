import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; 
import { Observable, EMPTY } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { NotaFiscal } from '../../models/nota-fiscal.model';
import { NotaFiscalService } from '../nota-fiscal.service';

@Component({
  selector: 'app-nota-detalhe',
  standalone: true,
  imports: [ 
    CommonModule, 
    RouterLink // Necessário para o <a routerLink="...">
  ],
  templateUrl: './nota-detalhe.component.html',
  styleUrls: ['./nota-detalhe.component.scss']
})
export class NotaDetalheComponent implements OnInit {
  
  notaAtual?: NotaFiscal; 
  isLoading = true; 
  errorMessage: string | null = null; 

  constructor(
    private route: ActivatedRoute,
    private notaService: NotaFiscalService,
    private router: Router 
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregarNota(id);
  }

  carregarNota(id: number): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.notaService.getNotaById(id).pipe(
      tap(nota => { this.notaAtual = nota; }),
      catchError(err => {
        this.errorMessage = "Erro ao carregar a nota.";
        return EMPTY;
      }),
      finalize(() => { this.isLoading = false; })
    ).subscribe();
  }

  onImprimir(): void {
    if (!this.notaAtual || this.notaAtual.status !== 'Aberta' || this.isLoading) return; 

    this.isLoading = true; 
    this.errorMessage = null;

    this.notaService.imprimirNota(this.notaAtual.id).pipe(
      tap((notaAtualizada) => {
        if (this.notaAtual) { this.notaAtual.status = notaAtualizada.status; }
      }),
      catchError(err => {
        this.errorMessage = err.error?.detail || err.error || 'Erro ao processar a nota.';
        return EMPTY;
      }),
      finalize(() => { this.isLoading = false; })
    ).subscribe();
  }

  onReabrir(): void {
    if (!this.notaAtual || this.isLoading) return;
    if (!confirm(`Tem certeza que deseja REABRIR esta nota? O estoque será devolvido.`)) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.notaService.reabrirNota(this.notaAtual.id).pipe(
      tap((notaAtualizada) => {
        this.router.navigate(['/notas/editar', notaAtualizada.id]);
      }),
      catchError(err => {
        this.errorMessage = err.error?.detail || err.error || 'Erro ao reabrir a nota.';
        return EMPTY;
      }),
      finalize(() => { this.isLoading = false; })
    ).subscribe();
  }

  onCancelar(): void {
    if (!this.notaAtual || this.isLoading) return;
    if (!confirm(`Tem certeza que deseja CANCELAR esta nota?`)) { return; }
    
    this.isLoading = true;
    this.errorMessage = null;

    this.notaService.cancelarNota(this.notaAtual.id).pipe(
      tap((notaAtualizada) => {
        if (this.notaAtual) { this.notaAtual.status = notaAtualizada.status; }
      }),
      catchError(err => {
        this.errorMessage = err.error?.detail || err.error || 'Erro ao cancelar a nota.';
        return EMPTY;
      }),
      finalize(() => { this.isLoading = false; })
    ).subscribe();
  }
}