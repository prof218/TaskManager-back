require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const adminRoutes = require('./routes/admin');

const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/taskmanager';

// Build normalized whitelist from env var (comma-separated). Normalize by:
// - trimming whitespace
// - removing trailing slash
// - lower-casing
const raw = process.env.CLIENT_URL || 'http://localhost:5173';
const CLIENT_URLS = raw.split(',')
  .map(u => u.trim().replace(/\/$/, '').toLowerCase())
  .filter(Boolean);

// Also keep a list of hostnames for hostname-based comparison
const CLIENT_HOSTNAMES = CLIENT_URLS.map(u => {
  try {
    return (new URL(u)).hostname;
  } catch (e) {
    // if not a full URL (e.g. '*.netlify.app'), just return the string
    return u;
  }
});

console.log('Allowed client origins:', CLIENT_URLS);
console.log('Allowed client hostnames/patterns:', CLIENT_HOSTNAMES);

// Helper to check wildcard patterns like *.netlify.app
function matchesWildcardPattern(pattern, hostname) {
  // pattern expected like '*.netlify.app'
  if (!pattern.startsWith('*.')) return false;
  const base = pattern.slice(2); // 'netlify.app'
  return hostname === base || hostname.endsWith('.' + base);
}

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (e.g., server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true);

    const normalized = origin.replace(/\/$/, '').toLowerCase();

    // direct exact match against full origin
    if (CLIENT_URLS.indexOf(normalized) !== -1) {
      return callback(null, true);
    }

    // Try comparing only hostname (handles http/https mismatch)
    try {
      const originHost = (new URL(normalized)).hostname;

      // direct hostname match
      if (CLIENT_HOSTNAMES.indexOf(originHost) !== -1) {
        return callback(null, true);
      }

      // check wildcard patterns in CLIENT_HOSTNAMES, e.g. '*.netlify.app'
      for (const pattern of CLIENT_HOSTNAMES) {
        if (pattern.startsWith('*.') && matchesWildcardPattern(pattern, originHost)) {
          return callback(null, true);
        }
      }
    } catch (err) {
      // fall through to reject if parse fails and no direct match found
      console.warn('CORS: failed to parse origin for hostname match', normalized, err.message);
    }

    const msg = 'Not allowed by CORS: ' + origin;
    console.warn(msg);
    return callback(new Error(msg));
  },
  credentials: true,
  exposedHeaders: ['Authorization', 'Content-Type'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);

mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> {
    console.log('MongoDB connected');
    app.listen(PORT, ()=> console.log('Server running on port', PORT));
  })
  .catch(err => {
    console.error('Mongo connection error', err);
  });
