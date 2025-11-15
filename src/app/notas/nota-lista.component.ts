import { Component, OnInit } from '@angular/core'; // <-- Importe OnInit
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; 
import { Observable } from 'rxjs'; 
import { NotaFiscal } from '../models/nota-fiscal.model'
import { NotaFiscalService } from '../notas/nota-fiscal.service';

@Component({
  selector: 'app-nota-lista',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink    
  ],
  templateUrl: '../notas/nota-lista/nota-lista.component.html', 
  styleUrls: ['../notas/nota-lista/nota-lista.component.scss']
})
export class NotaListaComponent implements OnInit { // <-- Implemente OnInit

  notas$!: Observable<NotaFiscal[]>; // <-- Use '!'
  
  constructor(private notaService: NotaFiscalService) {
    // Mantenha o construtor "limpo"
  }


  // ngOnInit() é chamado toda vez que você navega para esta página.
  ngOnInit(): void {
    this.notas$ = this.notaService.getNotas();
  }
}