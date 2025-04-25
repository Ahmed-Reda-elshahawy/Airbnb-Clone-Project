// Controllers/ChatController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebApplication1.Interfaces.ChatBot;
using WebApplication1.Models.ChatBot;
using WebApplication1.Repositories.ChatBot;

namespace AirbnbClone.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatRepository _chatService;

        public ChatController(IChatRepository chatService)
        {
            _chatService = chatService;
        }

        [HttpGet("conversation/{conversationId}")]
        public async Task<ActionResult<List<ChatMessage>>> GetConversation(string conversationId)
        {
            var userId = User.Identity.Name;
            var messages = await _chatService.GetConversationHistoryAsync(userId, conversationId);
            return Ok(messages);
        }

        [HttpPost("send")]
        public async Task<ActionResult<ChatMessage>> SendMessage([FromBody] SendMessageRequest request)
        {
            var userId = User.Identity.Name;
            var response = await _chatService.ProcessMessageAsync(userId, request.Message, request.ConversationId);
            return Ok(response);
        }

        [HttpPost("conversation")]
        public async Task<ActionResult<string>> CreateConversation()
        {
            var userId = User.Identity.Name;
            var conversationId = await _chatService.CreateNewConversationAsync(userId);
            return Ok(new { conversationId });
        }

        [HttpGet("most-recent-conversation")]
        public async Task<ChatMessage> GetMostRecentConversationAsync(string userId)
        {
            // Corrected the method to return ChatMessage instead of Conversation
            var messages = await _chatService.GetConversationHistoryAsync(userId, null); // Assuming null for conversationId to fetch all
            return messages
                .OrderByDescending(m => m.Timestamp)
                .FirstOrDefault();
        }
    }


    public class SendMessageRequest
    {
        public string Message { get; set; }
        public string ConversationId { get; set; }
    }
}