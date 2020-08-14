var app = require('express')();
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var path = require('path');
var routeSaya = require('./routes/route.js');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(routeSaya.app);
app.use(express.static('public'));

app.get('/', (req, res)=>{
    res.redirect('/login')
});

app.listen(3210, ()=>{
    console.log('Server aktif @port 3210')
});
