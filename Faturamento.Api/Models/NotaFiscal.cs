namespace Faturamento.Api.Models;

public class NotaFiscal
{
    public int Id { get; set; }
    public int NumeroSequencial { get; set; }
    public string Status { get; set; } = "Aberta";
    public List<NotaFiscalItem> Itens { get; set; } = new();
}