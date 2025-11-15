import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; 
import { Observable } from 'rxjs'; 
import { NotaFiscal } from '../../models/nota-fiscal.model';
import { NotaFiscalService } from '../nota-fiscal.service';

@Component({
  selector: 'app-nota-lista',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink    
  ],
  templateUrl: './nota-lista.component.html', 
  styleUrls: ['./nota-lista.component.scss']
})
export class NotaListaComponent implements OnInit {

  //
  //
  // Adicionamos o '!' depois de 'notas$' para dizer q sera inicializada
 
  notas$!: Observable<NotaFiscal[]>;
  //
  //

  constructor(private notaService: NotaFiscalService) {
    
  }

  // ngOnInit() é chamado quando o componente é carregado
  // e aqui nós damos o valor para 'notas$'.
  ngOnInit(): void {
    this.notas$ = this.notaService.getNotas();
  }
}