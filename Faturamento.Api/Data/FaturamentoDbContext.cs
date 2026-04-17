using Faturamento.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Faturamento.Api.Data;

// Arquivo que faz a conexao com o banco do faturamento
public class FaturamentoDbContext : DbContext
{
    // Repassa as opcoes de configuracao
    public FaturamentoDbContext(DbContextOptions<FaturamentoDbContext> options) : base(options) { }

    // Representa as tabelas de notas e itens
    public DbSet<NotaFiscal> NotasFiscais { get; set; }
    public DbSet<NotaFiscalItem> NotasFiscaisItens { get; set; }
}