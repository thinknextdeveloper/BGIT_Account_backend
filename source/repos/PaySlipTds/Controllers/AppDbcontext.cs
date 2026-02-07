using Microsoft.EntityFrameworkCore;
using PaySlipTds.Models;


namespace PaySlipTds.Dbcontext
{
    public class AppDbcontext : DbContext
    {
        public AppDbcontext(DbContextOptions<AppDbcontext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

        }
       
        public DbSet<TEst> Attendance { get; set; }

    }
}
