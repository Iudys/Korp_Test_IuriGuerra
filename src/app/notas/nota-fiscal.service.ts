import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotaFiscal } from '../models/nota-fiscal.model';

// DTO para criar/atualizar a nota
interface NotaRequest {
  itens: {
    produtoId: number;
    descricaoProduto: string;
    quantidade: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class NotaFiscalService {
  
  // Porta 5217 (ServicoFaturamento)
  private apiUrl = 'http://localhost:5217/notas';

  constructor(private http: HttpClient) { }

  getNotas(): Observable<NotaFiscal[]> {
    return this.http.get<NotaFiscal[]>(this.apiUrl);
  }

  getNotaById(id: number): Observable<NotaFiscal> {
    return this.http.get<NotaFiscal>(`${this.apiUrl}/${id}`);
  }

  criarNota(request: NotaRequest): Observable<NotaFiscal> {
    return this.http.post<NotaFiscal>(this.apiUrl, request);
  }


  // Chama o PUT /notas/{id}
  atualizarNota(id: number, request: NotaRequest): Observable<NotaFiscal> {
    return this.http.put<NotaFiscal>(`${this.apiUrl}/${id}`, request);
  }

  imprimirNota(id: number): Observable<NotaFiscal> {
    return this.http.post<NotaFiscal>(`${this.apiUrl}/${id}/imprimir`, {});
  }

  reabrirNota(id: number): Observable<NotaFiscal> {
    return this.http.post<NotaFiscal>(`${this.apiUrl}/${id}/reabrir`, {});
  }

  cancelarNota(id: number): Observable<NotaFiscal> {
    return this.http.post<NotaFiscal>(`${this.apiUrl}/${id}/cancelar`, {});
  }
}