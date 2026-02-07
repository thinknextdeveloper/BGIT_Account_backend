using Microsoft.AspNetCore.Mvc;

namespace LoginPage.LoginArea.Login.LoginController
{
    public class LoginController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
