using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Interfaces.ChatBot;
using WebApplication1.Models;
using WebApplication1.Models.ChatBot;

namespace WebApplication1.Repositories.ChatBot
{
    public class ModelKeyChatRepository : IChatRepository
    {
        private readonly IAiRepository _aiService;
        private readonly AirbnbDBContext _context;
        private readonly string _modelKey;

        public ModelKeyChatRepository(
            IAiRepository aiService,
            AirbnbDBContext context,
            IConfiguration configuration)
        {
            _aiService = aiService;
            _context = context;
            _modelKey = configuration["LLM:ApiKey"];
        }

        public async Task<string> CreateNewConversationAsync(string userId)
        {
            var conversationId = Guid.NewGuid().ToString();
            var conversation = new Conversation
            {
                Id = conversationId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            var welcomeMessage = new ChatMessage
            {
                UserId = userId,
                IsFromUser = false,
                Content = "Hello! I'm your Airbnb Q&A specialist. Ask me anything about vacation rentals, hosting, bookings, or Airbnb policies.",
                Timestamp = DateTime.UtcNow,
                ConversationId = conversationId
            };

            _context.Conversations.Add(conversation);
            _context.ChatMessages.Add(welcomeMessage);
            await _context.SaveChangesAsync();

            return conversationId;
        }

        public async Task<List<ChatMessage>> GetConversationHistoryAsync(string userId, string conversationId)
        {
            return await _context.ChatMessages
                .Where(m => m.UserId == userId && m.ConversationId == conversationId)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();
        }

        public async Task<ChatMessage> ProcessMessageAsync(string userId, string message, string conversationId)
        {
            var userMessage = new ChatMessage
            {
                UserId = userId,
                IsFromUser = true,
                Content = message,
                Timestamp = DateTime.UtcNow,
                ConversationId = conversationId
            };

            _context.ChatMessages.Add(userMessage);
            await _context.SaveChangesAsync();

            if (!IsAirbnbRelated(message))
            {
                return CreateRejectionMessage(userId, conversationId);
            }

            var history = await GetConversationHistoryAsync(userId, conversationId);
            var conversationText = string.Join("\n", history.Select(m => $"{m.Content}"));

            var responseContent = await _aiService.GenerateResponseAsync(message, conversationText);

            var assistantResponse = new ChatMessage
            {
                UserId = userId,
                IsFromUser = false,
                Content = responseContent,
                Timestamp = DateTime.UtcNow,
                ConversationId = conversationId
            };

            _context.ChatMessages.Add(assistantResponse);
            await _context.SaveChangesAsync();

            return assistantResponse;
        }

        private bool IsAirbnbRelated(string message)
        {
            var lowercaseMsg = message.ToLower();
            var airbnbKeywords = new[]
            {
                "airbnb", "booking", "listing", "host", "guest", "stay", "rental",
                "property", "reservation", "check-in", "check-out", "amenities",
                "cancellation policy", "security deposit", "cleaning fee",
                "vacation rental", "hosting", "superhost", "experience",
                "long-term stay", "short-term rental", "house rules"
            };

            var forbiddenPatterns = new[]
            {
                @"\b(weather|news|sports|stock market|politics|entertainment)\b",
                @"\b(how to make|create|build|invest in|buy|sell)\b",
                @"\b(history of|biography|science|math|physics|chemistry)\b"
            };

            // Check for explicit Airbnb keywords
            if (airbnbKeywords.Any(keyword => lowercaseMsg.Contains(keyword)))
                return true;

            // Check against forbidden topics
            if (forbiddenPatterns.Any(pattern => Regex.IsMatch(lowercaseMsg, pattern)))
                return false;

            // Final check using AI model
            return CheckWithAiModel(message).Result;
        }

        private async Task<bool> CheckWithAiModel(string message)
        {
            var prompt = $@"Is this question related to Airbnb or vacation rentals? 
                        Respond only with 'true' or 'false'.
                        Question: '{message}'
                        Response:";

            var response = await _aiService.GenerateResponseAsync(prompt, "");
            return response.Trim().Equals("true", StringComparison.OrdinalIgnoreCase);
        }

        private ChatMessage CreateRejectionMessage(string userId, string conversationId)
        {
            return new ChatMessage
            {
                UserId = userId,
                IsFromUser = false,
                Content = "I specialize exclusively in Airbnb-related questions. " +
                         "Please ask about:\n" +
                         "- Vacation rental listings\n" +
                         "- Booking policies\n" +
                         "- Hosting guidelines\n" +
                         "- Airbnb features\n" +
                         "- Payment and safety systems",
                Timestamp = DateTime.UtcNow,
                ConversationId = conversationId
            };
        }
    }
}