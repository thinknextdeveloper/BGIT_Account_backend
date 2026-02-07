
using LoginPage.Models;
using Microsoft.EntityFrameworkCore;

namespace LoginPage.Data
{
    public class ApplicationDbcontext : DbContext
    {
        public class ApplicationDbContext : DbContext
        {
            public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
                : base(options)
            {
            }

            DbSet<User> user { get; set; }
        }
    }
}
