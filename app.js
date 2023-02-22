const path = require('path');
const express = require('express');

const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
// const csrf = require('csurf');

// const wafDetectController = require('./controllers/authentication/wafDetect');
const userRouter = require('./routes/userRoutes');
const documentRouter = require('./routes/documentRoutes');
const statisticsRouter = require('./routes/statisticRoutes');
const requestRouter = require('./routes/requestRoutes');

const app = express();

app.use(express.json());
app.use(cookieParser());
// app.use(
//     csrf({
//         cookie: {
//             httpOnly: true,
//             secure: true,
//             maxAge: 3600,
//             sameSite: 'strict',
//         },
//     })
// );

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader(
//         'Access-Control-Allow-Headers',
//         'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token, X-CSRF-Token'
//     );
//     res.setHeader(
//         'Access-Control-Allow-Methods',
//         'GET, POST, OPTIONS, PUT, PATCH, DELETE'
//     );
//     res.setHeader('Access-Control-Allow-Credentials', true);

//     next();
// });
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', true);
  res.header(
    'Access-Control-Allow-Methods',
    'GET, PUT, POST, DELETE, PATCH, OPTIONS'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization'
  );
  if ('OPTIONS' == req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(
  cors({
    credentials: true,
    origin: true,
    optionsSuccessStatus: 200,
    // process.env.NODE_ENV === 'production'
    //     ? 'http://srebrenicamemorial.heorukuapp.com'
    //     : 'http://localhost:3000',
  })
);

// Limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// app.use(
//     helmet.contentSecurityPolicy({
//         directives: {
//             defaultSrc: [
//                 "'self'",
//                 'https://docs.google.com/',
//                 'https://memorialapp.s3.eu-central-1.amazonaws.com',
//             ],
//             // connectSrc: ["'self'", "'unsafe-inline'"],
//             scriptSrc: ["'self'", "'unsafe-inline'"],
//             styleSrc: [
//                 "'self'",
//                 "'unsafe-inline'",
//                 'https://fonts.googleapis.com',
//             ],
//             imgSrc: [
//                 "'self' blob: data:",
//                 'https://flagcdn.com/',
//                 'https://memorialapp.s3.eu-central-1.amazonaws.com',
//             ],
//             fontSrc: ["'self'", 'https://fonts.gstatic.com'],
//         },
//     })
// );

// app.use(helmet.dnsPrefetchControl());
// app.use(helmet.expectCt());
// app.use(helmet.frameguard());
// app.use(helmet.hidePoweredBy());
// app.use(helmet.hsts());
// app.use(helmet.ieNoOpen());
// app.use(helmet.noSniff());
// app.use(helmet.originAgentCluster());
// app.use(helmet.permittedCrossDomainPolicies());
// app.use(helmet.referrerPolicy());
// app.use(helmet.xssFilter());

// data sanitization against NoSQL query injection
app.use(mongoSanitize());
// data sanitization againt XSS
app.use(xss());

app.use(hpp());
// app.use((req, res, next) => {
//     const path = req.url;
//     if (wafDetectController.wafDetect(path) === false) {
//         next();
//     }
// });

app.use('/api/users', userRouter);
app.use('/api/documents', documentRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/requests/', requestRouter);

// serving static files
// app.use(express.static(path.join(__dirname, 'public')));

// app.use(express.static(path.join(__dirname, '/client/build')));

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, './client/build/index.html'));
// });

app.use(express.static(path.join(__dirname, '/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/build', 'index.html'));
});

module.exports = app;
