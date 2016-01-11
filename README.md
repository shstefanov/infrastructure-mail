# infrastructure-mail

## Configuration

```javascript
{
  "mail": {
    views: "mails",   // Rendering mustache files in specified directory (based on project root)
    cache: false,
  }
}

```

## Mailer class

```javascript
var Mailer = require("infrastructure-mail/Mailer");
module.exports = Mailer.extend("MyMailer", {
  account: "accounts.mail", // to resolve from config
  // nodemailer things - read what is passed to .createTransport first argument
  // https://github.com/nodemailer/nodemailer/blob/master/README.md
  account: { 
    service: "gmail",
    auth: {
      user: "aa@aa.com",
      pass: "secret",
    }
  },
  // The second argument for .createTransport()
  defaults: {
    from: "support@example.com",
    to:   "department@company.com"
  },

  subject: "Some string" // if views is set, it can be mustache inlined mustache template

  UsageStatistics: "auth/usage-statistics.mustache" // If views is set, will render
  UsersStatistics: "auth/users-statistics.mustache | Users statistics for {{date}}" // with subject template (if views is set)
})

```