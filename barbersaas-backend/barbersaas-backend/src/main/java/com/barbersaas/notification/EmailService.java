package com.barbersaas.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    public void sendPasswordResetCode(String toEmail, String userName, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Recuperacion de contrasena - BarberSaaS");

            String html = """
                    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #121212; color: #ffffff; padding: 32px; border-radius: 12px;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <h1 style="color: #D4AF37; font-size: 28px; margin: 0;">💈 BarberSaaS</h1>
                        </div>
                        <h2 style="color: #ffffff; font-size: 20px;">Hola, %s</h2>
                        <p style="color: #aaaaaa; line-height: 1.6;">
                            Recibimos una solicitud para restablecer tu contrasena.
                            Usa el siguiente codigo para continuar:
                        </p>
                        <div style="background: #1E1E1E; border: 2px solid #D4AF37; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                            <p style="color: #888888; font-size: 13px; margin: 0 0 8px 0;">Tu codigo de verificacion</p>
                            <h1 style="color: #D4AF37; font-size: 48px; letter-spacing: 12px; margin: 0;">%s</h1>
                            <p style="color: #888888; font-size: 12px; margin: 12px 0 0 0;">Expira en 15 minutos</p>
                        </div>
                        <p style="color: #aaaaaa; font-size: 13px; line-height: 1.6;">
                            Si no solicitaste este cambio, puedes ignorar este correo.
                            Tu contrasena no sera modificada.
                        </p>
                        <hr style="border: none; border-top: 1px solid #2A2A2A; margin: 24px 0;">
                        <p style="color: #555555; font-size: 11px; text-align: center; margin: 0;">
                            BarberSaaS &mdash; Plataforma de gestion para barberias
                        </p>
                    </div>
                    """.formatted(userName, code);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Correo de recuperacion enviado a {}", toEmail);
        } catch (Exception e) {
            log.error("Error enviando correo de recuperacion a {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("No se pudo enviar el correo de recuperacion");
        }
    }
}