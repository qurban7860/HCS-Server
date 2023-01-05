require("dotenv").config();
const fs = require('fs');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./appsrc/modules/user/routes/users-routes');
const assetsRoutes = require('./appsrc/modules/asset/routes/assets-routes')
const HttpError = require('./global/models/http-error');

const app = express();

const apiPath = `/api/${ process.env.API_VERSION }`;

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

mongoose.set('useNewUrlParser', true);
//mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);

mongoose
  .connect(
    `mongodb://localhost:27017/${ process.env.MONGODB_NAME }`
  )
  .then(() => {
    app.listen(process.env.PORT || 5000);
  })
  .catch(err => {
    console.log(err);
  });

  /*
mongoose
  .connect(
    `mongodb+srv://academind:ORlnOPLKvIH9M9hP@cluster0-ntrwp.mongodb.net/mern?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(process.env.PORT || 5000);
  })
  .catch(err => {
    console.log(err);
  });
  */