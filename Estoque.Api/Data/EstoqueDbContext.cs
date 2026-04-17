using Estoque.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Estoque.Api.Data;

// Arquivo que faz a conexao com o banco do estoque
public class EstoqueDbContext : DbContext
{
    // Passa as configuracoes para a classe pai (DbContext)
    public EstoqueDbContext(DbContextOptions<EstoqueDbContext> options) : base(options) { }

    // Representa a tabela de produtos no banco
    public DbSet<Produto> Produtos { get; set; }
}