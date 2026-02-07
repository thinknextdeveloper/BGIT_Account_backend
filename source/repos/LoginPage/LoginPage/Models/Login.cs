using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace LoginPage.Models
{
    public class Login
    {
        [Key]
        public string user_name { get; set; }
        public string password { get; set; }
    }
}
