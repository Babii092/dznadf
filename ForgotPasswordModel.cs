using System.ComponentModel.DataAnnotations;

namespace WebAPISalo.Models.Account;

// Модель для запиту на скидання пароля (приймає лише пошту)
public class ForgotPasswordModel
{
    // Обов'язкове поле + перевірка, що це дійсно формат email
    [Required(ErrorMessage = "Вкажіть електронну пошту")]
    [EmailAddress(ErrorMessage = "Некоректна електронна пошта")]
    public string Email { get; set; } = null!;
}
