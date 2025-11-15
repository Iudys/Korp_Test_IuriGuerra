export interface NotaFiscal {
  id: number;
  numero: number;
 
  status: 'Aberta' | 'Fechada' | 'Cancelada';
  itens: ItemNota[];
}

export interface ItemNota {
  id: number;
  produtoId: number;
  descricaoProduto: string;
  quantidade: number;
}