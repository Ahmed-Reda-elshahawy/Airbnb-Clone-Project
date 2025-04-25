using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using WebApplication1.Interfaces;
using WebApplication1.Models;

namespace WebApplication1.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly IHttpContextAccessor _httpContextAccessor; 
        private readonly IWebHostEnvironment _environment;
        private readonly AirbnbDBContext _context;
        private readonly IRepository<ApplicationUser> irepo;

        public UserRepository(IWebHostEnvironment environment, AirbnbDBContext context, IRepository<ApplicationUser> _irepo, IHttpContextAccessor httpContextAccessor)
        {
            _environment = environment;
            _context = context;
            irepo = _irepo;
            _httpContextAccessor = httpContextAccessor; // Initialize IHttpContextAccessor
        }

        public Guid GetCurrentUserId()
        {
            var user = _httpContextAccessor.HttpContext?.User; 
            if (user == null)
                throw new InvalidOperationException("HttpContext or User is null");

            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                throw new InvalidOperationException("User ID claim not found");

            return Guid.Parse(userIdClaim.Value);
        }

        public async Task<ApplicationUser> GetCurrentUserAsync()
        {
            //var userId = GetCurrentUserId();
            //var user = await irepo.GetByIDAsync(userId);
            //return user;

            var context = _httpContextAccessor.HttpContext;
            if (context == null)
            {
                return null;
            }

            var identity = context.User.Identity as ClaimsIdentity;
            var allClaims = identity?.Claims.ToList();
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return null;
            }

            var user = await irepo.GetByIDAsync(Guid.Parse(userId));
            return user;
        }

        public async Task<ApplicationUser> GetUserAsync(Guid userId)
        {
            var user = await irepo.GetByIDAsync(userId);
            return user;
        }

        public string SaveProfilePicture(Stream imageStream, string fileName)
        {
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "profiles");
            Directory.CreateDirectory(uploadsFolder);

            string uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(fileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                imageStream.CopyTo(fileStream);
            }

            return $"/uploads/profiles/{uniqueFileName}";
        }

        public bool IsValidImageFile(IFormFile file)
        {
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (string.IsNullOrEmpty(fileExtension) || !allowedExtensions.Contains(fileExtension))
                return false;

            return true;
        }
    }
}
