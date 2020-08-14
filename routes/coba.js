// const mongoClient = require('mongodb').MongoClient;
// const uri = "mongodb+srv://yuesth:wzady2221@sistemizin.x6cwd.mongodb.net/sistemizin?retryWrites=true&w=majority"
// const app = require('express')();
// const path = require('path');
// const express = require('express')
// const bodyParser = require('body-parser');
// const { client } = require('./mongo');

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
// app.use(express.static("public"));
// app.set("views", path.join(__dirname, "../views"));
// app.set("view engine", "hbs");

// app.get('/', (req, res) => {
//     res.render('coba');
// })

// mongoClient.connect(uri, {
//     useUnifiedTopology: true
// }).then(client => {
//     app.post('/',(req,res)=>{
//         const coll = client.db('sistemizin').collection('coba');
//         coll.insertOne({
//             username: req.body.uname,
//             email: req.body.email,
//             passwd: req.body.passwd
//         }).then(result=>{
//             console.log(result);
//         });
//     });
// }).catch(err => {
//     console.log(err)
// })

// app.listen(3200, () => {
//     console.log('Server aktif @port 3200')
// });



// const mongoClient = require("mongodb").MongoClient;
// // Connection URI
// // const uri = "mongodb+srv://yuesth:wzady2221@sistemizin.x6cwd.mongodb.net/SistemIzin?retryWrites=true&w=majority&ssl=true";
// const uri = "mongodb://localhost:27017/"
// mongoClient.connect(uri, {useUnifiedTopology:true},(err, client) => {
//     if (err) {
//         console.log('error');
//     }
//     client.db('sistemizin').collection('Persons', function (err, collection) {
//         collection.insert({ id: 2, firstName: 'Bill', lastName: 'Gates' });
//         collection.insert({ id: 3, firstName: 'James', lastName: 'Bond' });
//         client.db('sistemizin').collection('Persons').count(function (err, count) {
//             if (err) throw err;
//             console.log('Total Rows: ' + count);
//         });
//     });
// });


const mongoClient = require("mongodb").MongoClient;
// Connection URI
// const uri = "mongodb+srv://yuesth:wzady2221@sistemizin.x6cwd.mongodb.net/SistemIzin?retryWrites=true&w=majority&ssl=true";
const uri = "mongodb://localhost:27017/"
mongoClient.connect(uri, { useUnifiedTopology: true }, (err, client) => {
    if (err) {
        console.log('error');
    }
    var role="", username="";
    const u = client.db('sistemizin').collection('izin').find({ userAuth: "5hI4KmLMR3SZva4v5eDq7JlQgY02" }).project({_id:0});
    const c = client.db('sistemizin').collection('users').find({
        userAuth: "5hI4KmLMR3SZva4v5eDq7JlQgY02",
    }).project({ role: 1, username: 1, matkul:1, _id: 0 });
    c.forEach(obj => {
        var idx;
        for (var j=0; j < obj.matkul.length; j++){
            if(obj.matkul[j].kodematkul == 'MII1211'){
                idx = j;
                break;
            }
        }
        u.forEach(obj2=>{
            var aktifizin = obj2.aktifIzin;
            role = obj.role; username = obj.username; dosen = obj.matkul[idx].dosenmatkul;
            console.log(`role si ${username} adalah ${role}, dengan dosen: ${dosen}, aktif izin: ${aktifizin}`);
        })
        // console.log(obj);
    })
});


// const mongoClient = require("mongodb");
// async function main() { 
//     // const uri = "mongodb+srv://<username>:<password>@<your-cluster-url>/test?retryWrites=true&w=majority";
//     const uri = "mongodb://localhost:27017/";
//     const client = mongoClient.MongoClient(uri);
//     try {
//         // Connect to the MongoDB cluster
//         await client.connect();
//         // Make the appropriate DB calls
//         await client.db('sistemizin').collection('Persons').count(function (err, count) {
//             if (err) throw err;
//             console.log('Total Rows: ' + count);
//         });
//     } catch (e) {
//         console.error(e);
//     } finally {
//         await client.close();
//     }
// }
// main().catch(console.error);