import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db';

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Database connection successful:', res.rows[0]);
  }
});
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Alumni API is running!');
});

export default app;