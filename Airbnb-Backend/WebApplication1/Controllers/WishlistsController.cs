using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication1.DTOS.WishList;
using WebApplication1.Interfaces;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize]
    public class WishlistsController : ControllerBase
    {

        private readonly IWishListRepository wishlistRepo;
        private readonly IUserRepository irepo;

        public WishlistsController(IWishListRepository _wishlistRepo, IUserRepository _irepo)
        {
            wishlistRepo = _wishlistRepo;
            irepo = _irepo;
        }

        [HttpGet]
        public async Task<ActionResult<List<WishlistDto>>> GetWishlist()
        {
            var userId = await GetCurrentUserIdAsync();
            var wishlist = await wishlistRepo.GetUserWishlistsAsync(userId);
            return Ok(wishlist);
        }
        
        //[HttpGet("{id}")]
        //[AllowAnonymous]
        //public async Task<ActionResult<WishlistDetailDto>> GetWishlist(Guid id)
        //{
        //    try
        //    {
        //        var userId = User.Identity.IsAuthenticated ? await GetCurrentUserIdAsync() : Guid.Empty;
        //        var wishlist = await wishlistRepo.GetWishlistByIdAsync(id, userId);
        //        return Ok(wishlist);
        //    }
        //    catch (KeyNotFoundException)
        //    {
        //        return NotFound();
        //    }
        //    catch (UnauthorizedAccessException)
        //    {
        //        return Forbid();
        //    }
        //}

        //[HttpPut("{id}")]
        //public async Task<ActionResult<WishlistDto>> UpdateWishlist(Guid id, [FromBody] UpdateWishlistDto dto)
        //{
        //    try
        //    {
        //        var userId = GetCurrentUserId();
        //        var wishlist = await wishlistRepo.UpdateWishlistAsync(id, userId, dto.Name, dto.IsPublic);
        //        return Ok(wishlist);
        //    }
        //    catch (KeyNotFoundException)
        //    {
        //        return NotFound();
        //    }
        //    catch (UnauthorizedAccessException)
        //    {
        //        return Forbid();
        //    }
        //}

        [HttpDelete]
        public async Task<ActionResult> DeleteWishlist()
        {
            try
            {
                var userId = await GetCurrentUserIdAsync();
                await wishlistRepo.DeleteWishlistAsync(userId);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPost("add")]
        public async Task<ActionResult<WishlistItemDto>> AddItemToWishlist(/*Guid wishlistId,*/ [FromBody] AddWishlistItemDto dto)
        {
            try
            {   
                var userId = await GetCurrentUserIdAsync();
                var wishlistDto = await wishlistRepo.GetUserWishlistsAsync(userId);
                var item = await wishlistRepo.AddItemToWishlistAsync(userId, dto.ListingId);
                return CreatedAtAction(nameof(GetWishlist), item);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{itemId}")]
        public async Task<ActionResult> RemoveItemFromWishlist(/*Guid wishlistId,*/ Guid itemId)
        {
            try
            {
                var userId = await GetCurrentUserIdAsync();
                await wishlistRepo.RemoveItemFromWishlistAsync(itemId, userId);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }
        private async Task<Guid> GetCurrentUserIdAsync()
        {
            var currentUser = await irepo.GetCurrentUserAsync();
            if (currentUser == null)
            {
                throw new UnauthorizedAccessException("User not authenticated");
            }
            Guid userId = currentUser.Id;
            return userId;
        }
    }
}

