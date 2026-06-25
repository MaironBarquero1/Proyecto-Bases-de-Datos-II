import express from 'express';
import clienteRutas from './routes/ClienteRutas';


const app = express();

app.use('/api/clientes',clienteRutas);

app.listen(3000,()=>{
    console.log('server started')
})