import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private urlEstoque = 'http://localhost:5249/api/produtos'; 
  private urlFaturamento = 'http://localhost:5259/api/notasfiscais';

  constructor(private http: HttpClient) { }

  // --- ESTOQUE ---
  getProdutos(): Observable<any[]> { return this.http.get<any[]>(this.urlEstoque); }
  cadastrarProduto(produto: any): Observable<any> { return this.http.post(this.urlEstoque, produto); }
  atualizarProduto(id: number, produto: any): Observable<any> { return this.http.put(`${this.urlEstoque}/${id}`, produto); }
  excluirProduto(id: number): Observable<any> { return this.http.delete(`${this.urlEstoque}/${id}`); }

  // --- INTELIGÊNCIA ARTIFICIAL ---
  gerarDescricaoIA(nomeProduto: string): Observable<any> {
    // Envia um objeto JSON com a propriedade "nome"
    return this.http.post(`${this.urlEstoque}/gerar-descricao-ia`, { nome: nomeProduto });
  }
  gerarRelatorioReposicao(): Observable<any> {
    return this.http.get(`${this.urlEstoque}/ia/relatorio-reposicao`);
  }
  auditarCrossSell(notaId: number): Observable<any> {
    return this.http.get(`${this.urlFaturamento}/${notaId}/ia/cross-sell`);
  }

  // --- FATURAMENTO ---
  getNotas(): Observable<any[]> { return this.http.get<any[]>(this.urlFaturamento); }
  abrirNota(nota: any): Observable<any> { return this.http.post(this.urlFaturamento, nota); }
  imprimirNota(notaId: number): Observable<any> {
    return this.http.post(`${this.urlFaturamento}/${notaId}/imprimir`, {}, { responseType: 'text' }).pipe(
      catchError((erro: HttpErrorResponse) => {
        let mensagem = 'Erro desconhecido ao tentar imprimir.';
        if (erro.status === 503 || erro.status === 400) mensagem = erro.error; 
        return throwError(() => new Error(mensagem));
      })
    );
  }
}