using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

//  Configuração de Serviços (Builder) 
builder.Services.AddDbContext<EstoqueDb>(opt => opt.UseInMemoryDatabase("EstoqueDB"));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options => {
    options.AddPolicy("AllowAngular",
        builder => builder.WithOrigins("http://localhost:4200", "http://127.0.0.1:4200")
                          .AllowAnyHeader()
                          .AllowAnyMethod());
});

// 2. Configuração do App
var app = builder.Build();
app.UseCors("AllowAngular");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Endpoints 
// Todos os endpoints estão usando 'async' e 'await'
app.MapGet("/produtos", async (EstoqueDb db) =>
    await db.Produtos.ToListAsync()); 

app.MapPost("/produtos", async (Produto produto, EstoqueDb db) =>
{
    db.Produtos.Add(produto);
    await db.SaveChangesAsync(); 
    return Results.Created($"/produtos/{produto.Id}", produto);
});

app.MapPut("/produtos/atualizar-estoque", async (AtualizarEstoqueRequest req, EstoqueDb db) =>
{
    foreach (var item in req.Itens)
    {
        var produtoDb = await db.Produtos.FirstOrDefaultAsync(p => p.Id == item.ProdutoId);
        if (produtoDb == null)
        {
            return Results.BadRequest($"Produto com ID {item.ProdutoId} não encontrado.");
        }
        if (produtoDb.Saldo < item.Quantidade)
        {
            return Results.BadRequest($"Saldo insuficiente para o produto '{produtoDb.Descricao}'.");
        }
        produtoDb.Saldo -= item.Quantidade;
    }
    await db.SaveChangesAsync(); 
    return Results.Ok("Estoque atualizado com sucesso.");
});

app.MapPut("/produtos/devolver-estoque", async (AtualizarEstoqueRequest req, EstoqueDb db) =>
{
    foreach (var item in req.Itens)
    {
        var produtoDb = await db.Produtos.FirstOrDefaultAsync(p => p.Id == item.ProdutoId);
        if (produtoDb != null)
        {
            produtoDb.Saldo += item.Quantidade;
        }
    }
    await db.SaveChangesAsync(); 
    return Results.Ok("Estoque devolvido com sucesso.");
});

app.MapPost("/produtos/{id}/adicionar-estoque", async (int id, AdicionarEstoqueRequest req, EstoqueDb db) =>
{
    var produtoDb = await db.Produtos.FirstOrDefaultAsync(p => p.Id == id);
    if (produtoDb == null)
    {
        return Results.NotFound("Produto não encontrado.");
    }
    if (req.Quantidade <= 0)
    {
        return Results.BadRequest("A quantidade a ser adicionada deve ser maior que zero.");
    }
    produtoDb.Saldo += req.Quantidade;
    await db.SaveChangesAsync();
    return Results.Ok(produtoDb);
});

app.MapPost("/produtos/{id}/remover-estoque", async (int id, AdicionarEstoqueRequest req, EstoqueDb db) =>
{
    var produtoDb = await db.Produtos.FirstOrDefaultAsync(p => p.Id == id);
    if (produtoDb == null)
    {
        return Results.NotFound("Produto não encontrado.");
    }
    if (req.Quantidade <= 0)
    {
        return Results.BadRequest("A quantidade a ser removida deve ser maior que zero.");
    }
    if (produtoDb.Saldo < req.Quantidade)
    {
        return Results.BadRequest($"Saldo insuficiente para remover. Saldo atual: {produtoDb.Saldo}, Remoção: {req.Quantidade}");
    }
    produtoDb.Saldo -= req.Quantidade;
    await db.SaveChangesAsync(); 
    return Results.Ok(produtoDb);
});

app.MapDelete("/produtos/{id}", async (int id, EstoqueDb db) =>
{
    var produto = await db.Produtos.FindAsync(id);
    if (produto == null)
    {
        return Results.NotFound("Produto não encontrado.");
    }
    db.Produtos.Remove(produto);
    await db.SaveChangesAsync(); 
    return Results.NoContent();
});

// Execução
app.Run();

// Definições de Classe

public class Produto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public int Saldo { get; set; }
}

public class AtualizarEstoqueRequest
{
    
    public List<ItemNotaDto> Itens { get; set; } = new();
}
public class AdicionarEstoqueRequest
{
    public int Quantidade { get; set; }
}
public class ItemNotaDto
{
    public int ProdutoId { get; set; }
    public int Quantidade { get; set; }
}
public class EstoqueDb : DbContext
{
    public EstoqueDb(DbContextOptions<EstoqueDb> options) : base(options) { }

    
    public DbSet<Produto> Produtos { get; set; }
}