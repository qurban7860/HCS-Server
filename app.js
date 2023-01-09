
const fs = require('fs');
const path = require('path');

const express = require('express');

const bodyParser = require('body-parser');
//const mongoose = require('mongoose');

const mongoose = require('./appsrc/modules/db/dbConnection');

require("dotenv").config();


// const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./appsrc/modules/user/routes/users-routes');
const assetsRoutes = require('./appsrc/modules/asset/routes/assets-routes')
const HttpError = require('./appsrc/modules/config/models/http-error');

const app = express();

const apiPath = process.env.API_ROOT;

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

  next();
});

// app.use('/api/1.0.0/places', placesRoutes);
app.use(`${ apiPath }/users`, usersRoutes);
app.use(`${ apiPath }/assets`, assetsRoutes);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, err => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' });
});

/*
// warning fixes
mongoose.set('useNewUrlParser', true);
//mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);

console.log('MONGODB_HOST: '+ process.env.MONGODB_HOST);
console.log('MONGODB_PORT: '+ process.env.MONGODB_PORT);
console.log('MONGODB_NAME: '+ process.env.MONGODB_NAME);

let dburl = `mongodb://${ process.env.MONGODB_HOST }:${ process.env.MONGODB_PORT }/${ process.env.MONGODB_NAME }`
console.log('dburl: '+ dburl);

mongoose
  .connect(dburl)  
  .then(() => {
    app.listen({port: process.env.PORT || 3001}, () => {
      console.log(`Listening at  http://${process.env.HOST_NAME}:${process.env.PORT}/`)
    })

  })
  .catch(err => {
    console.log(err);
  });
  */

  app.listen({port: process.env.PORT || 3001}, () => {
    console.log(`Listening at  http://${process.env.HOST_NAME}:${process.env.PORT}/`)
  })