import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  
  { 
    path: 'produtos', 
    loadComponent: () => import('./produtos/produto-lista/produto-lista.component')
                           .then(m => m.ProdutoListaComponent) 
  },
  
  { 
    path: 'notas', 
    loadComponent: () => import('./notas/nota-lista/nota-lista.component')
                         .then(m => m.NotaListaComponent) 
  },
  {
    path: 'notas/novo',
    loadComponent: () => import('./notas/nota-cadastro/nota-cadastro.component')
                           .then(m => m.NotaCadastroComponent)
  },

  // --- NOVA ROTA (PARA A TELA DE EDIÇÃO) ---
  {
    path: 'notas/editar/:id',
    loadComponent: () => import('./notas/nota-editar/nota-editar.component')
                           .then(m => m.NotaEditarComponent) // Novo componente
  },

  { 
    path: 'nota/:id', 
    loadComponent: () => import('./notas/nota-detalhe/nota-detalhe.component')
                         .then(m => m.NotaDetalheComponent) 
  },

  { path: '**', redirectTo: '' }
];