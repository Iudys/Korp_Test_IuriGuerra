import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Diz que esse servico pode ser usado no projeto todo
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // As portas que anotamos antes (Ajuste se no seu computador for diferente)
  private urlFaturamento = 'http://localhost:5000/api/notasfiscais';

  // O Angular injeta o HttpClient para fazermos os pedidos para o C#
  constructor(private http: HttpClient) { }

  // Funcao para mandar a nota ser impressa e pegar o retorno
  // Retorna um Observable (RxJS), que é como uma promessa de que os dados vao chegar
  imprimirNota(notaId: number): Observable<any> {
    
    return this.http.post(`${this.urlFaturamento}/${notaId}/imprimir`, {}).pipe(
      
      // catchError (RxJS): Se a API der erro (como a queda do Estoque), cai aqui!
      catchError((erro: HttpErrorResponse) => {
        let mensagem = 'Ocorreu um erro desconhecido.';
        
        // Se for o nosso erro 503 do Polly (disjuntor aberto), mostramos a mensagem bonita
        if (erro.status === 503) {
           mensagem = erro.error; // "O Serviço de Estoque está temporariamente indisponível..."
        }
        
        // Repassa o erro para a tela do usuario
        return throwError(() => new Error(mensagem));
      })
    );
  }
}