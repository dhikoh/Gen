import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (data: EmailPayload) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, 
      pass: process.env.SMTP_PASSWORD, 
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Prompt Gen" <noreply@promptgen.id>',
    to: data.to,
    subject: data.subject,
    html: data.html,
  };

  try {
    // If SMTP is not fully configured, log instead of failing in dev/test,
    // but in production, we should enforce it.
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('SMTP_USER and SMTP_PASSWORD are required in production');
      }
      console.warn("[Email Mock - SMTP Not Configured]", mailOptions);
      return { success: true, message: "Mocked (SMTP Not Configured)" };
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false, error };
  }
};
