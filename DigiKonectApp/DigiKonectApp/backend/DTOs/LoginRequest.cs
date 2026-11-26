namespace DigiKonect.Api.DTOs;

// Contains only the information required to authenticate a user.
public record LoginRequest(string Email, string Password);
