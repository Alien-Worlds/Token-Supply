import * as dotenv from 'dotenv';
dotenv.config();

import { app } from './app';

const SERVER_PORT = process.env.SERVER_PORT;

app.listen(SERVER_PORT, () => {
  console.log(`Server is running on port ${SERVER_PORT}`);
});
