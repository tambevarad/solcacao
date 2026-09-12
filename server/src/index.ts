import 'dotenv/config';
import { app } from './app.js';
app.listen(Number(process.env.PORT || 4000), () => console.log('SolCacao API template listening'));
