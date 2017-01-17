const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the should syntax available throughout
// this module
const should = chai.should();

const {PomTracker} = require('../models');
const {app, runServer, closeServer} = require('../server');


chai.use(chaiHttp);

const generateParent = () => {
  const parents = ["Node Capstone", "Goals", "Chores"];
  return parents[Math.floor(Math.random() * parents.length)];
}

const generateTaskData = () => {
  return {
    name: faker.lorem.word(),
    parent: generateParent(),
    total: Math.floor(Math.random()*20)
  }
}

const seedTaskData = () => {
  const seedData = [];

  for (let i = 0; i < 10; i++) {
    seedData.push(generateTaskData());
  }
  return PomTracker.insertMany(seedData);
}


// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
/*function seedRestaurantData() {
  console.info('seeding blog post data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateRestaurantData());
  }
  // this will return a promise
  return Restaurant.insertMany(seedData);
}

// used to generate data to put in db
function generateBoroughName() {
  const boroughs = [
    'Manhattan', 'Queens', 'Brooklyn', 'Bronx', 'Staten Island'];
  return boroughs[Math.floor(Math.random() * boroughs.length)];
}

// used to generate data to put in db
function gnerateCuisineType() {
  const cuisines = ['Italian', 'Thai', 'Colombian'];
  return cuisines[Math.floor(Math.random() * cuisines.length)];
}

// used to generate data to put in db
function generateGrade() {
  const grades = ['A', 'B', 'C', 'D', 'F'];
  const grade = grades[Math.floor(Math.random() * grades.length)];
  return {
    date: faker.date.past(),
    grade: grade
  }
}

// generate an object represnting a restaurant.
// can be used to generate seed data for db
// or request.body data
function generateRestaurantData() {
  return {
    name: faker.company.companyName(),
    borough: generateBoroughName(),
    cuisine: gnerateCuisineType(),
    address: {
      building: faker.address.streetAddress(),
      street: faker.address.streetName(),
      zipcode: faker.address.zipCode()
    },
    grades: [generateGrade(), generateGrade(), generateGrade()]
  }
}*/


// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure  ata from one test does not stick
// around for next one
//
// we have this function return a promise because
// mongoose operations are asynchronous. we can either
// call a `done` callback or return a promise in our
// `before`, `beforeEach` etc. functions.
// https://mochajs.org/#asynchronous-hooks
function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err));
  });
}

describe('PomTracker API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedRestaurantData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer();
  });

  beforeEach(function() {
    return seedTaskData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  })

  // note the use of nested `describe` blocks.
  // this allows us to make clearer, more discrete tests that focus
  // on proving something small
  describe('GET endpoint', function() {

    it('should return all existing tasks', function() {
      // strategy:
      //    1. get back all restaurants returned by by GET request to `/restaurants`
      //    2. prove res has right status, data type
      //    3. prove the number of restaurants we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
        .get('/tasks')
        .then(function(_res) {
          // so subsequent .then blocks can access resp obj.
          res = _res;
          res.should.have.status(200);
          // otherwise our db seeding didn't work
          res.body.tasks.should.have.length.of.at.least(1);
          return PomTracker.count();
        })
        .then(function(count) {
          res.body.tasks.should.have.length.of(count);
        });
    });


    /*it('should return restaurants with right fields', function() {
      // Strategy: Get back all restaurants, and ensure they have expected keys

      let resRestaurant;
      return chai.request(app)
        .get('/restaurants')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.restaurants.should.be.a('array');
          res.body.restaurants.should.have.length.of.at.least(1);

          res.body.restaurants.forEach(function(restaurant) {
            restaurant.should.be.a('object');
            restaurant.should.include.keys(
              'id', 'name', 'cuisine', 'borough', 'grade', 'address');
          });
          resRestaurant = res.body.restaurants[0];
          return Restaurant.findById(resRestaurant.id);
        })
        .then(function(restaurant) {

          resRestaurant.id.should.equal(restaurant.id);
          resRestaurant.name.should.equal(restaurant.name);
          resRestaurant.cuisine.should.equal(restaurant.cuisine);
          resRestaurant.borough.should.equal(restaurant.borough);
          resRestaurant.address.should.contain(restaurant.address.building);

          resRestaurant.grade.should.equal(restaurant.grade);
        });
    });*/
  });

  describe('POST endpoint', function() {

    it('should add a new task', function() {

      const newTask = generateTaskData();


      return chai.request(app)
        .post('/tasks')
        .send(newTask)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'id', 'name', 'parent', 'total');
          res.body.name.should.equal(newTask.name);
          res.body.id.should.not.be.null;
          res.body.parent.should.equal(newTask.parent);
          res.body.total.should.equal(newTask.total);

          return PomTracker.findById(res.body.id);
        })
        .then(function(task) {
          task.name.should.equal(newTask.name);
          task.parent.should.equal(newTask.parent);
          task.total.should.equal(newTask.total);
        });
    });
  });

  describe('PUT endpoint', function() {
    it('should update a task', function() {
      const updateData = {
        total: 25
      }

      PomTracker
        .findOne()
        .then(function(task) {
          updateData.id = task.id;

          return chai.request(app)
            .put(`/tasks/${task.id}`)
            .send(updateData);
        })
        .then(function(res) {
          res.should.have.status(204);

          return PomTracker.findById(updateData.id);
        })
        .then(function(task) {
          task.total.should.equal(updateData.total);
        });

      });
  });

  describe('DELETE endpoint', function() {

    it('delete a restaurant by id', function() {

      let task;

      return PomTracker
        .findOne()
        .exec()
        .then(function(_task) {
          console.log(_task);

          task = _task;
          return chai.request(app).delete(`/tasks/${task.id}`);
        })
        .then(function(res) {
          console.log("hello");
          res.should.have.status(204);
          return PomTracker.findById(task.id);
        })
        .then(function(_task) {
          should.not.exist(_task);
        });
    });
  });
});
