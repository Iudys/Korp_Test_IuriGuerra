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

// Necessário para fazer requisições à API do Gemini
builder.Services.AddHttpClient();

// Configuração do Entity Framework Core com SQLite local
builder.Services.AddDbContext<EstoqueDbContext>(options =>
    options.UseSqlite("Data Source=estoque.db"));

var app = builder.Build();

// ====================================================================
// 2. PIPELINE DE MIDDLEWARES
// ====================================================================
// CORS - Permite que o Angular (na porta 4200) acesse esta API
app.UseCors(policy => policy
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader());

// Garante a criação do banco de dados na inicialização
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EstoqueDbContext>();
    db.Database.EnsureCreated();
}

app.UseAuthorization();
app.MapControllers();

// ====================================================================
// 3. ROTEAMENTO: ENDPOINTS CRUD DO ESTOQUE
// ====================================================================

// GET: Listar todos os produtos
app.MapGet("/api/produtos", async (EstoqueDbContext db) => 
    await db.Produtos.ToListAsync());

// GET: Buscar UM produto específico pelo ID (A Rota que faltava para o Faturamento!)
app.MapGet("/api/produtos/{id}", async (int id, EstoqueDbContext db) => 
    await db.Produtos.FindAsync(id) is Produto p ? Results.Ok(p) : Results.NotFound());

// POST: Criar um novo produto
app.MapPost("/api/produtos", async (Produto p, EstoqueDbContext db) => {
    db.Produtos.Add(p); 
    await db.SaveChangesAsync(); 
    return Results.Created($"/api/produtos/{p.Id}", p);
});

// PUT: Atualizar um produto existente (Usado pela tela e pela baixa do Faturamento)
app.MapPut("/api/produtos/{id}", async (int id, Produto pAlt, EstoqueDbContext db) => {
    var p = await db.Produtos.FindAsync(id); 
    if (p is null) return Results.NotFound();
    
    p.Codigo = pAlt.Codigo; 
    p.Descricao = pAlt.Descricao; 
    p.Saldo = pAlt.Saldo;
    
    await db.SaveChangesAsync(); 
    return Results.NoContent();
});

// DELETE: Excluir um produto
app.MapDelete("/api/produtos/{id}", async (int id, EstoqueDbContext db) => {
    var p = await db.Produtos.FindAsync(id); 
    if (p is null) return Results.NotFound();
    
    db.Produtos.Remove(p); 
    await db.SaveChangesAsync(); 
    return Results.NoContent();
});

// ====================================================================
// 4. ROTEAMENTO: INTELIGÊNCIA ARTIFICIAL (GEMINI)
// ====================================================================

// IA: Gerar Descrição Comercial
app.MapPost("/api/produtos/gerar-descricao-ia", async ([FromBody] IaRequest req, IHttpClientFactory factory) => {
    string prompt = $"Crie uma descrição comercial técnica e curta para o produto: {req.Nome}";
    var resposta = await ConsultarGeminiAPI(prompt, factory);
    return Results.Ok(new { descricaoSugerida = resposta });
});

// IA: Relatório de Reposição
app.MapGet("/api/produtos/ia/relatorio-reposicao", async (EstoqueDbContext db, IHttpClientFactory factory) => {
    var baixos = await db.Produtos.Where(p => p.Saldo < 10).ToListAsync();
    if (!baixos.Any()) return Results.Ok(new { relatorio = "✅ O estoque está em níveis ideais." });
    
    string prompt = $"Gere um alerta profissional de reposição para estes itens: {string.Join(", ", baixos.Select(b => b.Descricao))}";
    var resposta = await ConsultarGeminiAPI(prompt, factory);
    return Results.Ok(new { relatorio = "⚠️ " + resposta });
});

app.Run();

// ====================================================================
// 5. FUNÇÃO CENTRAL DE COMUNICAÇÃO COM O GOOGLE GEMINI
// ====================================================================
async Task<string> ConsultarGeminiAPI(string promptText, IHttpClientFactory httpClientFactory)
{
    // Seu Token AQ atual
    string accessToken = "AQ.Ab8RN6Kjdl4BXGsCZkBtK-288y9RKw4W6cANeicfmYeHmk6ufw"; 
    string url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    var payload = new { contents = new[] { new { parts = new[] { new { text = promptText } } } } };

    try {
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.PostAsJsonAsync(url, payload);
        
        if (!response.IsSuccessStatusCode) {
            var erro = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"\n--- FALHA NA API GEMINI ---\nStatus: {response.StatusCode}\nErro: {erro}\n");
            return "Erro na IA: Verifique a validade do token AQ.";
        }

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        return result.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString() ?? "Sem resposta.";
    } catch (Exception ex) {
        return $"Erro de Conexão: {ex.Message}";
    }
}

// ====================================================================
// 6. MODELOS DE DOMÍNIO (ENTITIES E DTOS)
// ====================================================================

public class EstoqueDbContext : DbContext 
{
    public EstoqueDbContext(DbContextOptions<EstoqueDbContext> options) : base(options) { }
    public DbSet<Produto> Produtos { get; set; }
}

public class Produto 
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public int Saldo { get; set; }
}

public class IaRequest 
{ 
    public string Nome { get; set; } = string.Empty; 
}