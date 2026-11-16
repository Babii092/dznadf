// Мітка, яка прив'язує код суто до скидання пароля (щоб його не використали для інших дій, як-от підтвердження пошти)
private const string ResetPasswordPurpose = "ResetPassword";

[HttpPost]
public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordModel model, CancellationToken cancellationToken)
{
    // Шукаємо користувача в базі за вказаним email
    var user = await userManager.FindByEmailAsync(model.Email);

    // Якщо акаунт існує — генеруємо код і пробуємо відправити лист
    if (user is not null)
    {
        // Генеруємо одноразовий 6-значний код через стандартний EmailProvider в ASP.NET Identity
        var code = await userManager.GenerateUserTokenAsync(
            user, TokenOptions.DefaultEmailProvider, ResetPasswordPurpose);

        try
        {
            // Відправляємо код користувачу на пошту через наш поштовий сервіс
            await emailService.SendPasswordResetCodeAsync(user.Email!, code, cancellationToken);
        }
        catch (Exception ex)
        {
            // Якщо поштовий сервер впав — пишемо помилку в лог за ID користувача (сам email не логуємо задля приватності),
            // але не «валимо» запит помилкою 500
            logger.LogError(ex, "Не вдалося надіслати код відновлення пароля для користувача {UserId}", user.Id);
        }
    }

    // Завжди повертаємо 200 OK з однаковим повідомленням, навіть якщо пошти немає в базі.
    // Це стандартний захист від перебору, щоб ніхто не міг перевірити, чи зареєстрований конкретний email.
    return Ok(new { message = "Якщо такий email зареєстровано, код відновлення надіслано на нього." });
}

[HttpPost]
public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordModel model)
{
    // Шукаємо користувача за поштою
    var user = await userManager.FindByEmailAsync(model.Email);

    // Перевіряємо одночасно, чи є такий користувач і чи підходить введений 6-значний код
    // (VerifyUserTokenAsync також перевіряє, чи не вийшов час дії коду)
    if (user is null ||
        !await userManager.VerifyUserTokenAsync(user, TokenOptions.DefaultEmailProvider, ResetPasswordPurpose, model.Code))
    {
        return BadRequest(new { error = "Невірний або прострочений код." });
    }

    // Код підійшов — генеруємо внутрішній повний токен скидання пароля для Identity
    var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);

    // Записуємо новий пароль у базу. Під час цього Identity автоматично оновлює SecurityStamp користувача,
    // тому старий 6-значний код миттєво стає недійсним (одноразовим).
    var result = await userManager.ResetPasswordAsync(user, resetToken, model.NewPassword);

    // Якщо новий пароль не пройшов вимоги безпеки (наприклад, занадто простий) — повертаємо список помилок
    if (!result.Succeeded)
    {
        return BadRequest(new
        {
            error = string.Join("; ", result.Errors.Select(e => e.Description))
        });
    }

    // Повертаємо підтвердження, що пароль успішно змінено
    return Ok(new { message = "Пароль успішно змінено." });
}
