using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

// ====================================================================
// 1. CONFIGURAÇÃO DE SERVIÇOS (CONTAINER)
// ====================================================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Registro de clientes HTTP
builder.Services.AddHttpClient(); // Para chamadas gerais (IA)
builder.Services.AddHttpClient("EstoqueClient", client => {
    client.BaseAddress = new Uri("http://localhost:5249");
});

// Banco de Dados SQLite
builder.Services.AddDbContext<FaturamentoDbContext>(options => 
    options.UseSqlite("Data Source=faturamento.db"));

var app = builder.Build();

// ====================================================================
// 2. MIDDLEWARES E INICIALIZAÇÃO
// ====================================================================
app.UseCors(policy => policy
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader());

// Cria o banco de dados e as tabelas caso não existam
using (var scope = app.Services.CreateScope()) 
{
    var db = scope.ServiceProvider.GetRequiredService<FaturamentoDbContext>();
    db.Database.EnsureCreated();
}

app.UseAuthorization();
app.MapControllers();

// ====================================================================
// 3. ENDPOINTS DE NEGÓCIO: NOTAS FISCAIS
// ====================================================================

// Listagem de todas as notas
app.MapGet("/api/notasfiscais", async (FaturamentoDbContext db) => 
    await db.NotasFiscais.Include(n => n.Itens).ToListAsync());

// Criação de nova nota fiscal (Aberta)
app.MapPost("/api/notasfiscais", async ([FromBody] NotaFiscal nota, FaturamentoDbContext db) => {
    nota.NumeroSequencial = new Random().Next(1000, 9999).ToString();
    nota.Status = "Aberta";
    db.NotasFiscais.Add(nota);
    await db.SaveChangesAsync();
    return Results.Created($"/api/notasfiscais/{nota.Id}", nota);
});

// Processamento: Impressão e Baixa de Estoque
app.MapPost("/api/notasfiscais/{id}/imprimir", async (int id, FaturamentoDbContext db, IHttpClientFactory factory) => {
    Console.WriteLine($"\n[LOG] Iniciando processamento da Nota ID: {id}");
    
    var nota = await db.NotasFiscais.Include(n => n.Itens).FirstOrDefaultAsync(x => x.Id == id);
    
    if (nota == null) {
        Console.WriteLine("[ERRO] Nota não encontrada.");
        return Results.NotFound("Nota fiscal não encontrada.");
    }
    if (nota.Status != "Aberta") {
        Console.WriteLine("[ERRO] Nota já fechada.");
        return Results.BadRequest("Atenção: Esta nota fiscal já foi processada.");
    }

    var clienteEstoque = factory.CreateClient("EstoqueClient");

    foreach (var item in nota.Itens) {
        Console.WriteLine($"[LOG] Consultando Produto ID: {item.ProdutoId}");
        
        var res = await clienteEstoque.GetAsync($"/api/produtos/{item.ProdutoId}");
        if (!res.IsSuccessStatusCode) {
            Console.WriteLine($"[ERRO] Produto {item.ProdutoId} inexistente no Estoque.");
            return Results.BadRequest($"Erro: O Produto {item.ProdutoId} não foi localizado.");
        }

        var p = await res.Content.ReadFromJsonAsync<ProdutoExterna>(new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        if (p!.Saldo < item.Quantidade) {
            Console.WriteLine($"[ERRO] Estoque insuficiente para {p.Descricao}.");
            return Results.BadRequest($"Saldo insuficiente para o item: {p.Descricao}.");
        }

        // Atualiza saldo localmente e envia o PUT para o outro microsserviço
        p.Saldo -= item.Quantidade;
        var putRes = await clienteEstoque.PutAsJsonAsync($"/api/produtos/{p.Id}", p);
        
        if(!putRes.IsSuccessStatusCode) {
            Console.WriteLine("[ERRO] Falha ao atualizar saldo no microsserviço de estoque.");
            return Results.BadRequest("Falha técnica ao sincronizar estoque.");
        }
    }

    nota.Status = "Fechada";
    await db.SaveChangesAsync();
    
    Console.WriteLine("[SUCESSO] Nota processada e impressa.");
    return Results.Ok("Nota fiscal impressa com sucesso!");
});

// ====================================================================
// 4. ENDPOINTS DE INTELIGÊNCIA ARTIFICIAL
// ====================================================================
app.MapGet("/api/notasfiscais/{id}/ia/cross-sell", async (int id, FaturamentoDbContext db, IHttpClientFactory factory) => {
    var nota = await db.NotasFiscais.Include(n => n.Itens).FirstOrDefaultAsync(x => x.Id == id);
    if (nota == null) return Results.NotFound();

    string prompt = $"Aja como um vendedor. O cliente comprou {nota.Itens.Count} itens. Sugira um complemento em uma frase curta.";
    
    string accessToken = "AQ.Ab8RN6Kjdl4BXGsCZkBtK-288y9RKw4W6cANeicfmYeHmk6ufw";
    string url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    
    var payload = new { contents = new[] { new { parts = new[] { new { text = prompt } } } } };
    
    try {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        
        var response = await client.PostAsJsonAsync(url, payload);
        if (!response.IsSuccessStatusCode) return Results.Ok(new { sugestao = "IA indisponível no momento." });
        
        var jsonDoc = await response.Content.ReadFromJsonAsync<JsonElement>();
        string texto = jsonDoc.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString()!;
                                      
        return Results.Ok(new { sugestao = "✨ " + texto.Replace("\n", "").Trim() });
    } catch {
        return Results.Ok(new { sugestao = "Erro de conexão com a IA." });
    }
});

app.Run();

// ====================================================================
// 5. CLASSES DE MODELO E PERSISTÊNCIA
// ====================================================================

public class FaturamentoDbContext : DbContext 
{ 
    public FaturamentoDbContext(DbContextOptions<FaturamentoDbContext> options) : base(options) { } 
    public DbSet<NotaFiscal> NotasFiscais { get; set; } 
    public DbSet<NotaFiscalItem> Itens { get; set; } 
}

public class NotaFiscal 
{ 
    public int Id { get; set; } 
    public string NumeroSequencial { get; set; } = string.Empty; 
    public string Status { get; set; } = string.Empty; 
    public List<NotaFiscalItem> Itens { get; set; } = new(); 
}

public class NotaFiscalItem 
{ 
    public int Id { get; set; } 
    public int NotaFiscalId { get; set; } 
    public int ProdutoId { get; set; } 
    public int Quantidade { get; set; } 
}

public class ProdutoExterna 
{ 
    public int Id { get; set; } 
    public string Codigo { get; set; } = string.Empty; 
    public string Descricao { get; set; } = string.Empty; 
    public int Saldo { get; set; } 
}