using System.ComponentModel.DataAnnotations;

namespace WebAPISalo.Models.Account;

// Модель для фінального кроку зміни пароля
public class ResetPasswordModel
{
    // Пошта користувача, якому змінюємо пароль
    [Required(ErrorMessage = "Вкажіть електронну пошту")]
    [EmailAddress(ErrorMessage = "Некоректна електронна пошта")]
    public string Email { get; set; } = null!;

    // 6-значний код із листа (регулярний вираз пропускає лише 6 цифр)
    [Required(ErrorMessage = "Вкажіть код із листа")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "Код має складатися з 6 цифр")]
    public string Code { get; set; } = null!;

    // Новий пароль (мінімум 6 символів, як налаштовано в Identity)
    [Required(ErrorMessage = "Вкажіть новий пароль")]
    [MinLength(6, ErrorMessage = "Пароль має бути мін 6 символів")]
    public string NewPassword { get; set; } = null!;
}
