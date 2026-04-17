namespace Estoque.Api.Models;

// Classe para guardar os dados do produto
public class Produto
{
    // Identificador unico do produto (Chave Primaria)
    public int Id { get; set; }

    // Codigo que o usuario vai digitar
    public string Codigo { get; set; } = string.Empty;

    // Nome do produto
    public string Descricao { get; set; } = string.Empty;

    // Quantidade que sobrou no estoque
    public int Saldo { get; set; }
}