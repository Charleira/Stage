const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const tournamentRoutes = require('./routes/tournamentRoutes');
const authRoutes = require('./routes/authRoutes');
const teamRoutes = require('./routes/teamRoutes');

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.use('/api', tournamentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/team', teamRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
