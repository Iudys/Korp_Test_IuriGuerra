using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Configuração de Serviços 
builder.Services.AddDbContext<FaturamentoDb>(opt => opt.UseInMemoryDatabase("FaturamentoDB"));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAngular",
        builder => builder.WithOrigins("http://localhost:4200", "http://127.0.0.1:4200")
                          .AllowAnyHeader()
                          .AllowAnyMethod());
});
builder.Services.AddHttpClient("EstoqueService", client =>
{
    client.BaseAddress = new Uri("http://localhost:5104"); // Porta do ServicoEstoque
});

//  Configuração do App 
var app = builder.Build();
app.UseCors("AllowAngular");
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//  Endpoints 
app.MapGet("/notas", async (FaturamentoDb db) =>
    await db.NotasFiscais.Include(n => n.Itens).ToListAsync());

app.MapGet("/notas/{id}", async (int id, FaturamentoDb db) =>
{
    var nota = await db.NotasFiscais
        .Include(n => n.Itens)
        .FirstOrDefaultAsync(n => n.Id == id);
    return nota == null ? Results.NotFound("Nota fiscal não encontrada.") : Results.Ok(nota);
});

app.MapPost("/notas", async (CriarNotaRequest req, FaturamentoDb db) =>
{
    var novaNota = new NotaFiscal
    {
        Status = NotaStatus.Aberta,
        Itens = req.Itens.Select(i => new ItemNota
        {
            ProdutoId = i.ProdutoId,
            DescricaoProduto = i.DescricaoProduto,
            Quantidade = i.Quantidade
        }).ToList()
    };
    db.NotasFiscais.Add(novaNota);
    await db.SaveChangesAsync();
    return Results.Created($"/notas/{novaNota.Id}", novaNota);
});

app.MapPut("/notas/{id}", async (int id, CriarNotaRequest req, FaturamentoDb db) =>
{
    var nota = await db.NotasFiscais
        .Include(n => n.Itens)
        .FirstOrDefaultAsync(n => n.Id == id);

    if (nota == null) { return Results.NotFound("Nota fiscal não encontrada."); }

    if (nota.Status != NotaStatus.Aberta)
    {
        return Results.BadRequest($"Não é possível editar uma nota com status '{nota.Status}'.");
    }

    db.ItensNota.RemoveRange(nota.Itens);

    nota.Itens = req.Itens.Select(i => new ItemNota
    {
        ProdutoId = i.ProdutoId,
        DescricaoProduto = i.DescricaoProduto,
        Quantidade = i.Quantidade
    }).ToList();

    nota.Status = NotaStatus.Aberta;

    await db.SaveChangesAsync();
    return Results.Ok(nota);
});

app.MapPost("/notas/{id}/imprimir", async (int id, FaturamentoDb db, IHttpClientFactory clientFactory) =>
{
    var nota = await db.NotasFiscais.Include(n => n.Itens).FirstOrDefaultAsync(n => n.Id == id);
    if (nota == null) return Results.NotFound("Nota fiscal não encontrada.");

    if (nota.Status != NotaStatus.Aberta)
    {
        return Results.BadRequest($"Esta nota não pode ser impressa (status: {nota.Status}).");
    }

    var httpClient = clientFactory.CreateClient("EstoqueService");
    var payload = new { Itens = nota.Itens.Select(i => new { i.ProdutoId, i.Quantidade }).ToList() };
    HttpResponseMessage response;
    try { response = await httpClient.PutAsJsonAsync("/produtos/atualizar-estoque", payload); }
    catch (HttpRequestException) { return Results.Problem("Serviço de Estoque indisponível.", statusCode: 503); }
    if (!response.IsSuccessStatusCode) { return Results.BadRequest(await response.Content.ReadAsStringAsync()); }

    nota.Status = NotaStatus.Fechada;
    await db.SaveChangesAsync();
    return Results.Ok(nota);
});

app.MapPost("/notas/{id}/reabrir", async (int id, FaturamentoDb db, IHttpClientFactory clientFactory) =>
{
    var nota = await db.NotasFiscais.Include(n => n.Itens).FirstOrDefaultAsync(n => n.Id == id);
    if (nota == null) return Results.NotFound("Nota fiscal não encontrada.");

    if (nota.Status != NotaStatus.Fechada)
    {
        return Results.BadRequest($"Esta nota não pode ser reaberta (status: {nota.Status}).");
    }

    var httpClient = clientFactory.CreateClient("EstoqueService");
    var payload = new { Itens = nota.Itens.Select(i => new { i.ProdutoId, i.Quantidade }).ToList() };
    HttpResponseMessage response;
    try { response = await httpClient.PutAsJsonAsync("/produtos/devolver-estoque", payload); }
    catch (HttpRequestException) { return Results.Problem("Serviço de Estoque indisponível.", statusCode: 503); }
    if (!response.IsSuccessStatusCode) { return Results.BadRequest(await response.Content.ReadAsStringAsync()); }

    nota.Status = NotaStatus.Aberta;
    await db.SaveChangesAsync();
    return Results.Ok(nota);
});

app.MapPost("/notas/{id}/cancelar", async (int id, FaturamentoDb db, IHttpClientFactory clientFactory) =>
{
    var nota = await db.NotasFiscais.Include(n => n.Itens).FirstOrDefaultAsync(n => n.Id == id);
    if (nota == null) return Results.NotFound("Nota fiscal não encontrada.");
    if (nota.Status == NotaStatus.Cancelada) { return Results.BadRequest("Esta nota já está cancelada."); }

    if (nota.Status == NotaStatus.Fechada)
    {
        var httpClient = clientFactory.CreateClient("EstoqueService");
        var payload = new { Itens = nota.Itens.Select(i => new { i.ProdutoId, i.Quantidade }).ToList() };
        HttpResponseMessage response;
        try { response = await httpClient.PutAsJsonAsync("/produtos/devolver-estoque", payload); }
        catch (HttpRequestException) { return Results.Problem("Serviço de Estoque indisponível.", statusCode: 503); }
    }

    nota.Status = NotaStatus.Cancelada;
    await db.SaveChangesAsync();
    return Results.Ok(nota);
});

//  Execução 
app.Run();

//  Classes 


public static class NotaStatus
{
    public const string Aberta = "Aberta";
    public const string Fechada = "Fechada";
    public const string Cancelada = "Cancelada";
}

public class NotaFiscal
{
    public int Id { get; set; }
    public int Numero { get; set; }
    public string Status { get; set; } = NotaStatus.Aberta;
    public List<ItemNota> Itens { get; set; } = new();
}

public class ItemNota
{
    public int Id { get; set; }
    public int ProdutoId { get; set; }
    public string DescricaoProduto { get; set; } = string.Empty;
    public int Quantidade { get; set; }
}

public class FaturamentoDb : DbContext
{
    public FaturamentoDb(DbContextOptions<FaturamentoDb> options) : base(options) { }
    public DbSet<NotaFiscal> NotasFiscais { get; set; }
    public DbSet<ItemNota> ItensNota { get; set; } 
}

public class CriarNotaRequest
{
    public List<ItemNotaDto> Itens { get; set; } = new();
}

public class ItemNotaDto
{
    public int ProdutoId { get; set; }
    public string DescricaoProduto { get; set; } = string.Empty;
    public int Quantidade { get; set; }
}