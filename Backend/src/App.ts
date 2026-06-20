import express from 'express';

const app = express();

app.get('/',(request,response)=>{
    response.send('get method');    
})

app.listen(3000,()=>{
    console.log('server started')
})