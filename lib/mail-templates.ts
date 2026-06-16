export function getVerificationEmailHtml(url: string, userName: string): string {
  const displayUrl = url || "";
  const name = userName ? userName.toUpperCase() : "USER";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #FFFDF5; font-family: 'Courier New', Courier, monospace; color: #000000; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 500px; margin: 40px auto; background-color: #ffffff; border: 4px solid #000000; box-shadow: 8px 8px 0px #000000; padding: 24px;">
    <div style="border-bottom: 4px solid #000000; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px; font-family: 'Impact', 'Arial Black', sans-serif;">SUPEREA v1 α</h1>
      <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666666; letter-spacing: 1px;">EMAIL VERIFICATION REQUIRED</p>
    </div>
    
    <div style="font-size: 12px; line-height: 1.6; font-weight: bold; text-transform: uppercase;">
      <p style="margin: 0 0 16px 0;">HELLO ${name},</p>
      <p style="margin: 0 0 24px 0;">WELCOME TO SUPEREA. PLEASE CONFIRM AND VERIFY YOUR EMAIL ADDRESS BY CLICKING THE ACTION BUTTON BELOW TO FULLY ACTIVATE YOUR DELEGATED AI AGENT WORKFLOWS:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${displayUrl}" style="background-color: #FFD93D; border: 4px solid #000000; font-weight: 900; text-transform: uppercase; text-decoration: none; padding: 14px 28px; box-shadow: 4px 4px 0px #000000; display: inline-block; color: #000000; font-size: 12px; letter-spacing: 1px;">
          VERIFY ACCOUNT
        </a>
      </div>
      
      <p style="font-size: 9px; color: #666666; margin: 32px 0 0 0; border-top: 2px solid #000000; padding-top: 12px; text-transform: none;">
        IF THE BUTTON ABOVE DOES NOT WORK, COPY AND PASTE THIS URL INTO YOUR WEB BROWSER:
        <br/>
        <span style="word-break: break-all; text-decoration: underline; color: #000000;">${displayUrl}</span>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function getResetPasswordEmailHtml(url: string, userName: string): string {
  const displayUrl = url || "";
  const name = userName ? userName.toUpperCase() : "USER";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #FFFDF5; font-family: 'Courier New', Courier, monospace; color: #000000; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 500px; margin: 40px auto; background-color: #ffffff; border: 4px solid #000000; box-shadow: 8px 8px 0px #000000; padding: 24px;">
    <div style="border-bottom: 4px solid #000000; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px; font-family: 'Impact', 'Arial Black', sans-serif;">SUPEREA v1 α</h1>
      <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666666; letter-spacing: 1px;">PASSWORD RESET REQUESTED</p>
    </div>
    
    <div style="font-size: 12px; line-height: 1.6; font-weight: bold; text-transform: uppercase;">
      <p style="margin: 0 0 16px 0;">HELLO ${name},</p>
      <p style="margin: 0 0 24px 0;">WE RECEIVED A REQUEST TO RESET YOUR SUPEREA ACCESS PASSWORD. CLICK THE ACTION BUTTON BELOW TO ENTER A NEW PASSWORD:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${displayUrl}" style="background-color: #FF6B6B; border: 4px solid #000000; font-weight: 900; text-transform: uppercase; text-decoration: none; padding: 14px 28px; box-shadow: 4px 4px 0px #000000; display: inline-block; color: #ffffff; font-size: 12px; letter-spacing: 1px;">
          RESET PASSWORD
        </a>
      </div>
      
      <p style="font-size: 9px; color: #666666; margin: 32px 0 0 0; border-top: 2px solid #000000; padding-top: 12px; text-transform: none;">
        IF YOU DID NOT REQUEST THIS RESET, YOU CAN SAFELY IGNORE THIS EMAIL. THE LINK WILL EXPIRE IN 1 HOUR.
        <br/><br/>
        IF THE BUTTON FAILS, USE THE URL BELOW:
        <br/>
        <span style="word-break: break-all; text-decoration: underline; color: #000000;">${displayUrl}</span>
      </p>
    </div>
  </div>
</body>
</html>`;
}
