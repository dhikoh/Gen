export const getBaseEmailTemplate = (content: string, title?: string) => `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f5;
      color: #18181b;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #7c3aed;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px 30px;
      font-size: 16px;
      line-height: 1.6;
      color: #3f3f46;
    }
    .content p {
      margin-top: 0;
      margin-bottom: 20px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      background-color: #7c3aed;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      display: inline-block;
    }
    .footer {
      background-color: #fafafa;
      padding: 20px 30px;
      text-align: center;
      font-size: 13px;
      color: #71717a;
      border-top: 1px solid #e4e4e7;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title || "Prompt Gen"}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Prompt Gen. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
