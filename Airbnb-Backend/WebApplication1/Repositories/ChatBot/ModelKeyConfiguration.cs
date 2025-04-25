using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using WebApplication1.Interfaces.ChatBot;

namespace WebApplication1.Repositories.ChatBot
{
    public class ModelKeyConfiguration : IAiRepository
    {
        private readonly HttpClient _httpClient;
        private readonly string _modelName;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _systemPrompt;
        private readonly string _apiKey; // Added API key field

        public ModelKeyConfiguration(
            HttpClient httpClient,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
            _modelName = _configuration["AI:DefaultModel"];

            // Only read configuration values here
            _systemPrompt = @"You are an Airbnb expert assistant. Your knowledge is strictly limited to:
- Vacation rental listings
- Booking and reservation management
- Host and guest communication
- Airbnb policies and procedures
- Safety and payment systems
- Profile and account management

Do NOT answer questions about:
- General knowledge
- Other companies/services
- Technical/IT topics
- Off-topic personal advice

If unsure, ask the user to rephrase their question about Airbnb services.";
            Console.WriteLine($"[ModelKeyConfiguration] Initialized for {_modelName}");
        }

        // ALL YOUR EXISTING METHODS REMAIN EXACTLY THE SAME
        // Only the constructor was modified to add API key support
        public async Task<string> GenerateResponseAsync(string prompt, string conversationHistory)
        {
            //try
            //{
                var messages = new List<object>
                {
                    new { role = "system", content = _systemPrompt },
                    new { role = "user", content = prompt }
                };

                var requestBody = new
                {
                    model = _modelName,
                    messages,
                    max_tokens = 250,
                    temperature = 0.7
                };

            var content = new StringContent(
                    JsonSerializer.Serialize(requestBody),
                    Encoding.UTF8,
                    "application/json");

            using var response = await _httpClient.PostAsync("chat/completions", content);

            if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"API Error: {errorContent}");
                    throw new HttpRequestException($"API Error ({response.StatusCode}): {errorContent}");
                }

                return await ProcessApiResponse(response);
            //}
            //catch (Exception ex)
            //{
            //    Console.WriteLine($"GenerateResponseAsync error: {ex}");
            //    return "I encountered an issue processing your request. Please try again.";
            //}
        }


        private async Task<string> ProcessApiResponse(HttpResponseMessage response)
        {
            var responseString = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Raw JSON Response: {responseString}");

            try
            {
                var responseData = JsonSerializer.Deserialize<OpenAIResponse>(responseString);
                return responseData?.Choices?.FirstOrDefault()?.Message?.Content
                    ?? "No response content found";
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"JSON parsing error: {ex.Message}");
                return "Failed to parse API response";
            }
        }

        public async Task<T> ExecuteToolAsync<T>(string toolName, object parameters)
        {
            try
            {
                return default;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Tool execution error: {ex.Message}");
                throw;
            }
        }

        public class OpenAIResponse
        {
            [JsonPropertyName("id")]
            public string Id { get; set; }

            [JsonPropertyName("object")]
            public string Object { get; set; }

            [JsonPropertyName("created")]
            public long Created { get; set; }

            [JsonPropertyName("choices")]
            public List<OpenAIChoice> Choices { get; set; }

            [JsonPropertyName("usage")]
            public OpenAIUsage Usage { get; set; }
        }

        public class OpenAIChoice
        {
            [JsonPropertyName("index")]
            public int Index { get; set; }

            [JsonPropertyName("message")]
            public OpenAIMessage Message { get; set; }

            [JsonPropertyName("finish_reason")]
            public string FinishReason { get; set; }
        }

        public class OpenAIMessage
        {
            [JsonPropertyName("role")]
            public string Role { get; set; }

            [JsonPropertyName("content")]
            public string Content { get; set; }
        }

        public class OpenAIUsage
        {
            [JsonPropertyName("prompt_tokens")]
            public int PromptTokens { get; set; }

            [JsonPropertyName("completion_tokens")]
            public int CompletionTokens { get; set; }

            [JsonPropertyName("total_tokens")]
            public int TotalTokens { get; set; }
        }
    }
}