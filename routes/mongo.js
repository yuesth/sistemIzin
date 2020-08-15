const mongoClient = require('mongodb').MongoClient;
// const uri = "mongodb+srv://yuesth:*********@sistemizin.x6cwd.mongodb.net/sistemizin?retryWrites=true&w=majority"
const uri = "mongodb://localhost:27017/"
// const client = mongoClient.connect(uri,{useUnifiedTopology:true});


module.exports.mongoClient = mongoClient;
module.exports.uri = uri;
