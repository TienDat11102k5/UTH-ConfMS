package edu.uth.backend.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.*;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;

@Service
public class MailService {

  private static final Logger logger = LoggerFactory.getLogger(MailService.class);

  private final JavaMailSender mailSender;

  @Value("${app.mail.from:${spring.mail.username:noreply@example.com}}")
  private String fromAddress;

  public MailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  public void sendResetPasswordEmail(String to, String fullName, String resetLink) {
    String name = (fullName == null || fullName.isBlank()) ? "" : fullName;
    String subject = "Hướng dẫn đặt lại mật khẩu - UTH-ConfMS";
    String plainText = buildResetPasswordText(name, resetLink);
    String html = buildResetPasswordHtml(name, resetLink);

    try {
      sendHtmlEmail(to, subject, html, plainText);
      logger.info("Đã gửi email đặt lại mật khẩu tới: {}", to);
    } catch (Exception ex) {
      logger.error("Gửi email đặt lại mật khẩu tới {} thất bại: {}", to, ex.getMessage(), ex);
    }
  }

  public void sendOtpEmail(String to, String fullName, String otp) {
    String name = (fullName == null || fullName.isBlank()) ? "Bạn" : fullName;
    String subject = "Mã OTP đặt lại mật khẩu - UTH-ConfMS";
    String plainText = buildOtpText(name, otp);
    String html = buildOtpHtml(name, otp);

    try {
      sendHtmlEmail(to, subject, html, plainText);
      logger.info("Đã gửi OTP tới: {}", to);
    } catch (MessagingException ex) {
      logger.error("Gửi OTP tới {} thất bại: {}", to, ex.getMessage(), ex);
      throw new RuntimeException("Không thể gửi email OTP", ex);
    }
  }

  public boolean trySendHtmlEmail(String to, String subject, String htmlBody, String textBody) {
    try {
      sendHtmlEmail(to, subject, htmlBody, textBody);
      return true;
    } catch (Exception ex) {
      logger.error("Gửi email HTML tới {} thất bại: {}", to, ex.getMessage(), ex);
      return false;
    }
  }

  public boolean trySendSimpleEmail(String to, String subject, String text) {
    try {
      SimpleMailMessage msg = new SimpleMailMessage();
      if (fromAddress != null && !fromAddress.isBlank())
        msg.setFrom(fromAddress);
      msg.setTo(to);
      msg.setSubject(subject);
      msg.setText(text);
      mailSender.send(msg);
      return true;
    } catch (Exception ex) {
      logger.error("Gửi email đơn giản tới {} thất bại: {}", to, ex.getMessage(), ex);
      return false;
    }
  }

  public void sendHtmlEmail(String to, String subject, String htmlBody, String textBody) throws MessagingException {
    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
        StandardCharsets.UTF_8.name());
    if (fromAddress != null && !fromAddress.isBlank())
      helper.setFrom(fromAddress);
    helper.setTo(to);
    helper.setSubject(subject);
    helper.setText(textBody, htmlBody);
    mailSender.send(message);
  }

  public void sendSimpleEmail(String to, String subject, String text) {
    try {
      SimpleMailMessage msg = new SimpleMailMessage();
      if (fromAddress != null && !fromAddress.isBlank())
        msg.setFrom(fromAddress);
      msg.setTo(to);
      msg.setSubject(subject);
      msg.setText(text);
      mailSender.send(msg);
    } catch (Exception ex) {
      logger.error("Gửi email đơn giản tới {} thất bại: {}", to, ex.getMessage(), ex);
    }
  }

  private String buildResetPasswordText(String name, String resetLink) {
    StringBuilder sb = new StringBuilder();
    sb.append("Xin chào ").append(name.isBlank() ? "" : name).append(",\n\n");
    sb.append("Vui lòng truy cập link sau để đặt lại mật khẩu:\n\n");
    sb.append(resetLink).append("\n\n");
    sb.append("Nếu bạn không yêu cầu, hãy bỏ qua email này.\n\nTrân trọng,\nUTH-ConfMS");
    return sb.toString();
  }

  private String buildResetPasswordHtml(String name, String resetLink) {
    String displayName = name.isBlank() ? "Bạn" : escapeHtml(name);
    return """
        <!doctype html>
        <html><head><meta charset="utf-8"/></head><body>
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:16px auto;padding:20px;border-radius:8px;">
          <h3>Đặt lại mật khẩu</h3>
          <p>Xin chào %s,</p>
          <p>Nhấn nút bên dưới để đặt lại mật khẩu (link có hạn):</p>
          <p><a href="%s" style="display:inline-block;padding:12px 18px;background:#0f62fe;color:#fff;border-radius:6px;text-decoration:none;">Đặt lại mật khẩu</a></p>
          <p>Nếu nút không hoạt động, dán link sau vào trình duyệt:</p>
          <p style="word-break:break-all">%s</p>
          <p>Trân trọng,<br/>UTH-ConfMS</p>
        </div></body></html>
        """
        .formatted(displayName, resetLink, resetLink);
  }

  private String buildOtpText(String name, String otp) {
    return """
        Xin chào %s,

        Mã OTP để đặt lại mật khẩu của bạn là:

        %s

        Mã có hiệu lực trong 5 phút.

        Nếu bạn không yêu cầu, hãy bỏ qua email này.

        Trân trọng,
        UTH-ConfMS
        """.formatted(name, otp);
  }

  private String buildOtpHtml(String name, String otp) {
    String displayName = escapeHtml(name);
    return """
        <!doctype html>
        <html><head><meta charset="utf-8"/></head><body>
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:20px auto;padding:30px;border:1px solid #e0e0e0;border-radius:8px;">
          <h2 style="color:#0f62fe;margin-bottom:20px;">Đặt lại mật khẩu</h2>
          <p>Xin chào <strong>%s</strong>,</p>
          <p>Mã OTP để đặt lại mật khẩu của bạn là:</p>
          <div style="background:#f4f4f4;padding:20px;text-align:center;margin:20px 0;border-radius:6px;">
            <h1 style="color:#0f62fe;letter-spacing:8px;margin:0;font-size:36px;">%s</h1>
          </div>
          <p style="color:#666;">Mã có hiệu lực trong <strong>5 phút</strong>.</p>
          <p style="color:#999;font-size:14px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;"/>
          <p style="color:#666;font-size:14px;">Trân trọng,<br/><strong>UTH-ConfMS</strong></p>
        </div>
        </body></html>
        """
        .formatted(displayName, otp);
  }

  private String escapeHtml(String input) {
    if (input == null)
      return "";
    return input.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'",
        "&#x27;");
  }
}
