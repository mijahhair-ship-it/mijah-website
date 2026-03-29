---
name: security-guidance
description: "Use when: reviewing code for vulnerabilities, implementing authentication/authorization, securing APIs, protecting sensitive data, preventing common security attacks, conducting security audits, implementing secure coding practices"
---

# Security Guidance Skill

Comprehensive security best practices and vulnerability prevention guidance for building secure applications.

## When to Use

Use this skill when:
- Reviewing code for security vulnerabilities
- Implementing authentication & authorization
- Securing APIs and endpoints
- Protecting sensitive data (passwords, tokens, PII)
- Preventing common attacks (SQL injection, XSS, CSRF, etc.)
- Conducting security audits
- Implementing secure coding practices
- Building secure applications from scratch
- Handling secrets and environment variables
- Implementing encryption and hashing

## Core Security Principles

### 1. Defense in Depth
- Multiple layers of security controls
- Don't rely on single security measure
- Redundant protections for critical systems
- Fail securely if one layer is breached

### 2. Principle of Least Privilege
- Users have minimum permissions needed
- Services run with minimal required access
- Restrict data access on need-to-know basis
- Regular permission audits

### 3. Secure by Default
- Default configurations are secure
- Require explicit opt-in for risky operations
- Safe defaults for sensitive operations
- Secure choice should be easiest choice

### 4. Fail Securely
- Handle errors without exposing sensitive info
- Graceful error handling
- Log security events
- Default to deny if uncertain

## Authentication & Authorization

### Password Security

❌ **WRONG**:
```javascript
// Never store plaintext passwords
users.password = password;

// Never log passwords
console.log("User password:", password);

// Don't use MD5 or SHA1
crypto.createHash('md5').update(password).digest('hex');
```

✅ **RIGHT**:
```javascript
const bcrypt = require('bcrypt');
const saltRounds = 12;

// Hash passwords with bcrypt
const hashedPassword = await bcrypt.hash(password, saltRounds);
users.password = hashedPassword;

// Verify passwords
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
```

### Session Management

```javascript
// Use secure session tokens
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');

// Set secure cookie flags
res.cookie('sessionToken', token, {
  httpOnly: true,        // Prevent JavaScript access
  secure: true,          // HTTPS only
  sameSite: 'Strict',    // CSRF protection
  maxAge: 3600000,       // 1 hour expiration
  signed: true           // Sign to prevent tampering
});

// Implement session timeout
// Clear sessions after inactivity
// Regenerate session ID after login
```

### Multi-Factor Authentication (MFA)
```javascript
// Implement 2FA/MFA
const speakeasy = require('speakeasy');

// Generate secret for TOTP
const secret = speakeasy.generateSecret({
  name: 'MyApp (user@example.com)',
  issuer: 'MyApp',
  length: 32
});

// Verify TOTP code
const verified = speakeasy.totp.verify({
  secret: userSecret,
  encoding: 'base32',
  token: userToken,
  window: 2  // Allow 30-second window
});
```

## API Security

### Input Validation

```javascript
// Always validate and sanitize input
const xss = require('xss');
const validator = require('validator');

function validateUserInput(input) {
  // Check type
  if (typeof input !== 'string') {
    throw new Error('Invalid input type');
  }
  
  // Limit length
  if (input.length > 100) {
    throw new Error('Input too long');
  }
  
  // Validate format
  if (!validator.isEmail(input)) {
    throw new Error('Invalid email format');
  }
  
  // Sanitize for XSS
  const clean = xss(input, {
    whiteList: {},
    stripIgnoredTag: true
  });
  
  return clean;
}
```

### SQL Injection Prevention

```javascript
// ❌ VULNERABLE
const user = db.query(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ SAFE - Use parameterized queries
const user = db.query('SELECT * FROM users WHERE id = ?', [userId]);

// ✅ SAFE - ORM with prepared statements
const user = User.findById(userId);
```

### Authentication & Authorization

```javascript
// Check authentication before protected routes
app.get('/api/profile', authenticate, (req, res) => {
  res.json(req.user);
});

// Implement role-based access control
app.delete('/api/users/:id', 
  authenticate, 
  authorize('admin'), 
  (req, res) => {
  // Only authenticated admins can delete users
});

function authorize(requiredRole) {
  return (req, res, next) => {
    if (!req.user.roles.includes(requiredRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// Prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  message: 'Too many login attempts, try again later',
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/api/login', loginLimiter, (req, res) => {
  // Login logic
});
```

### CORS (Cross-Origin Resource Sharing)

```javascript
const cors = require('cors');

// ❌ INSECURE - Allow all origins
app.use(cors());

// ✅ SECURE - Only allow specific origins
app.use(cors({
  origin: 'https://example.com',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Data Protection

### Encryption

```javascript
const crypto = require('crypto');

// Encrypt sensitive data
function encryptData(data, encryptionKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt sensitive data
function decryptData(encryptedData, encryptionKey) {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
  
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Sensitive Data in Logs

```javascript
// ❌ WRONG - Logging sensitive data
logger.info(`User ${email} logged in with password ${password}`);

// ✅ RIGHT - Never log passwords, tokens, or PII
logger.info(`User ${email} logged in successfully`);

// ✅ Mask sensitive data if needed for debugging
function maskSensitive(str) {
  return str.length > 4 ? '*'.repeat(str.length - 4) + str.slice(-4) : '*';
}
```

### Environment Variables

```javascript
// ❌ NEVER commit secrets to version control
process.env.DATABASE_PASSWORD = "secretpassword123";

// ✅ Use .env files (add to .gitignore)
// .env (never commit!)
// DATABASE_PASSWORD=secretpassword123
// API_KEY=xxxx

// ✅ Load from environment
require('dotenv').config();
const dbPassword = process.env.DATABASE_PASSWORD;

// .gitignore
.env
.env.local
*.secret
```

## Common Vulnerabilities & Prevention

### SQL Injection
```javascript
// ❌ Vulnerable
db.query(`SELECT * FROM users WHERE email='${email}'`);

// ✅ Protected - Use parameterized queries
db.query('SELECT * FROM users WHERE email = ?', [email]);
```

### Cross-Site Scripting (XSS)
```javascript
// ❌ Vulnerable - User input directly in HTML
res.send(`<h1>${userInput}</h1>`);

// ✅ Protected - Escape HTML
const escapeHtml = require('escape-html');
res.send(`<h1>${escapeHtml(userInput)}</h1>`);

// ✅ Use security headers
app.use(helmet.xssFilter());
```

### Cross-Site Request Forgery (CSRF)
```javascript
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(csrf({ cookie: true }));

// Include CSRF token in forms
app.get('/form', (req, res) => {
  res.send(`<form method="POST" action="/submit">
    <input type="hidden" name="_csrf" value="${req.csrfToken()}">
    <input type="text" name="data">
    <button type="submit">Submit</button>
  </form>`);
});
```

### Insecure Direct Object References (IDOR)
```javascript
// ❌ Vulnerable - No authorization check
app.get('/api/profile/:id', (req, res) => {
  const profile = User.findById(req.params.id);
  res.json(profile);
});

// ✅ Protected - Verify ownership/permission
app.get('/api/profile/:id', authenticate, (req, res) => {
  if (req.params.id !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const profile = User.findById(req.params.id);
  res.json(profile);
});
```

## Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet()); // Enables multiple security headers

// Specific headers
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
  },
}));

// X-Frame-Options (prevent clickjacking)
app.use(helmet.frameguard({ action: 'deny' }));

// X-Content-Type-Options
app.use(helmet.noSniff());

// Strict-Transport-Security (HTTPS enforcement)
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
```

## Dependency Security

### Keep Dependencies Updated
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update packages
npm update

# Check outdated packages
npm outdated
```

### Lock Dependencies
```bash
# Use package-lock.json (commit it!)
npm ci  # Install from lock file

# Or use yarn.lock with Yarn
yarn install
```

## Security Checklist

- [ ] All user inputs are validated and sanitized
- [ ] Passwords hashed with bcrypt (or similar)
- [ ] HTTPS enforced in production
- [ ] Security headers configured (Helmet.js or equivalent)
- [ ] API rate limiting implemented
- [ ] CORS properly configured
- [ ] Authentication required for protected routes
- [ ] Authorization checks enforced
- [ ] Sensitive data not logged
- [ ] Secrets in environment variables, not code
- [ ] SQL queries parameterized
- [ ] CSRF protection enabled
- [ ] XSS protection in place
- [ ] Dependencies audited and updated
- [ ] Error messages don't expose system info
- [ ] Session timeouts implemented
- [ ] Secure cookie flags set
- [ ] No hardcoded credentials
- [ ] Encryption for sensitive data at rest
- [ ] Security testing automated

## Tools & Resources

- **Dependency Auditing**: `npm audit`, Snyk, WhiteSource
- **SAST (Static Analysis)**: SonarQube, ESLint security plugins
- **DAST (Dynamic Analysis)**: OWASP ZAP, Burp Suite
- **Secret Detection**: detect-secrets, git-secrets
- **Load Testing**: Apache JMeter, Locust
- **Documentation**: OWASP Top 10, CWE Top 25

## Common Mistakes to Avoid

❌ **DON'T**:
- Store passwords in plaintext
- Hardcode secrets in code
- Trust user input
- Skip input validation
- Use weak hashing (MD5, SHA1)
- Ignore security updates
- Log sensitive data
- Expose detailed error messages
- Use HTTP in production
- Implement custom crypto

✅ **DO**:
- Use proven security libraries
- Validate everything
- Use strong hashing (bcrypt, Argon2)
- Update dependencies regularly
- Implement defense in depth
- Test for vulnerabilities
- Follow security standards
- Conduct code reviews
- Use security headers
- Keep security practices current

## Reporting Security Issues

If you discover a vulnerability:
1. **Don't publicize it** - responsible disclosure
2. **Report privately** to the maintainer
3. **Allow time to fix** - typically 90 days
4. **Document thoroughly** - include reproduction steps
5. **Follow their security policy** - check SECURITY.md
