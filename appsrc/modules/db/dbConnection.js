'use strict'

require("dotenv").config();

var mongoose = require('mongoose');

//const dbUri = process.env.dbUri || "mongodb://127.0.0.1/mytestdb";

console.log('MONGODB_HOST_TYPE: ' + process.env.MONGODB_HOST_TYPE);

console.log('MONGODB_HOST: ' + process.env.MONGODB_HOST);
console.log('MONGODB_PORT: ' + process.env.MONGODB_PORT);
console.log('MONGODB_NAME: ' + process.env.MONGODB_NAME);

let dburl = `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_NAME}`

if (process.env.MONGODB_HOST_TYPE && process.env.MONGODB_HOST_TYPE == "mongocloud"){
    dburl = `mongodb+srv://${ process.env.MONGODB_USERNAME }:${ process.env.MONGODB_PASSWD }@${ process.env.MONGODB_HOST }/${ process.env.MONGODB_NAME }?retryWrites=true&w=majority`;
}

//console.log('dburl: ' + dburl);

const mongooseOptions = {
    
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
};


mongoose.connect(dburl, mongooseOptions, function (err) {

    if (err) {
        console.log('error in db connection');
        process.exit(1);
    } else {
        console.log('database is connected ........');
    }
})
mongoose.set('useFindAndModify', false);

exports.mongoose = mongoose;
