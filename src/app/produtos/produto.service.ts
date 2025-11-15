import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Produto } from '../models/produto.model';

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  
  // URL do ServicoEstoque (porta 5104)
  private apiUrl = 'http://localhost:5104/produtos'; 

  constructor(private http: HttpClient) { }

  getProdutos(): Observable<Produto[]> {
    return this.http.get<Produto[]>(this.apiUrl);
  }

  adicionarProduto(produto: Omit<Produto, 'id'>): Observable<Produto> {
    return this.http.post<Produto>(this.apiUrl, produto);
  }

  adicionarEstoque(id: number, quantidade: number): Observable<Produto> {
    const request = { quantidade: quantidade };
    return this.http.post<Produto>(`${this.apiUrl}/${id}/adicionar-estoque`, request);
  }

  // --- NOVO MÉTODO (1) ---
  // Chama o POST /produtos/{id}/remover-estoque
  removerEstoque(id: number, quantidade: number): Observable<Produto> {
    const request = { quantidade: quantidade };
    return this.http.post<Produto>(`${this.apiUrl}/${id}/remover-estoque`, request);
  }

  // --- NOVO MÉTODO (2) ---
  // Chama o DELETE /produtos/{id}
  deletarProduto(id: number): Observable<void> {
    // DELETE retorna 204 NoContent, então o Observable é <void>
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}