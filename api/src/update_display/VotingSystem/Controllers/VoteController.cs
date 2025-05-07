using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using update_display.VotingSystem.Hubs;
using VotingSystem.Models;

[ApiController]
[Route("api/votes")]
public class VoteController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<VoteHub> _hub;

    public VoteController(AppDbContext context, IHubContext<VoteHub> hub)
    {
        _context = context;
        _hub = hub;
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetVotes() =>
        Ok(await _context.Votes.ToListAsync());

    [HttpPost("add")]
    public async Task<IActionResult> AddVote([FromBody] Vote vote)
    {
        _context.Votes.Add(vote);
        await _context.SaveChangesAsync();
        await _hub.Clients.All.SendAsync("NewVote", vote);
        return Ok(vote);
    }

    [HttpPut("update/{id}")]
    public async Task<IActionResult> UpdateVote(int id, [FromBody] Vote vote)
    {
        var existing = await _context.Votes.FindAsync(id);
        if (existing == null) return NotFound();

        existing.Text = vote.Text;
        await _context.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("VoteUpdated", existing);
        return Ok(existing);
    }

    [HttpDelete("delete/{id}")]
    public async Task<IActionResult> DeleteVote(int id)
    {
        var vote = await _context.Votes.FindAsync(id);
        if (vote == null) return NotFound();

        _context.Votes.Remove(vote);
        await _context.SaveChangesAsync();

        await _hub.Clients.All.SendAsync("VoteDeleted", id);
        return Ok();
    }
}