const express = require('express');
const projectRouter = express.Router();
const {Projects} = require('./models');

projectRouter.route('/')
  .get((req, res) => {

    Projects
      .find()
      .exec()
      .then(projects => res.json({projects}))
      .catch(
        err => {
          console.error(err);
          res.status(500).json({message: 'Internal Server Error'});
        });
  })
  .post((req,res) => {

    const requiredProjectFields = ['projectName', 'tasks'];
    const requiredTaskFields = ['taskName', 'total', 'log'];

    for (let i=0; i<requiredProjectFields.length; i++) {
      const field = requiredProjectFields[i];
      if (!(field in req.body)) {
        const message = `Missing \`${field}\` in request body`
        console.error(message);
        return res.status(400).send(message);
      }
    }

    for (let i=0; i<req.body.tasks.length; i++) {
      for (let j=0; j<requiredTaskFields.length; j++) {
        const field = requiredTaskFields[j];
        if (!(field in req.body.tasks[i])) {
          const message = `Missing \`${field}\` in request body`
          console.error(message);
          return res.status(400).send(message);
        }
      }
  }

  Projects
    .create({
      'projectName': req.body.projectName,
      'tasks': req.body.tasks
    })
    .then(project => res.status(201).json(project))
    .catch(err => {
        console.error(err);
        res.status(500).json({message: 'Internal server error'});
    });
});
    
projectRouter.route('/:projectId')
  .get((req, res) => {

    Projects
      .findById(req.params.projectId)
      .exec()
      .then(projects => res.json({projects}))
      .catch(err => {
          console.error(err);
          res.status(404).json({message: 'Project Not Found'});
        });
  })
  .post((req, res) => {

    const toUpdate = {'tasks' : req.body};
    const requiredTaskFields = ['taskName', 'total', 'log'];

    for (let i=0; i<req.body.tasks.length; i++) {
      for (let j=0; j<requiredTaskFields.length; j++) {
        const field = requiredTaskFields[j];
        if (!(field in req.body.tasks[i])) {
          const message = `Missing \`${field}\` in request body`
          console.error(message);
          return res.status(400).send(message);
        }
      }
    }

   	Projects
      .findByIdAndUpdate(req.params.projectId, {'$push': toUpdate})
   		.then(project => res.status(201).json(project))
   		.catch(err => {
   				console.error(err);
   				res.status(404).json({message: 'Project Not Found'});
   		});
   })
   .put((req, res) => {

     if (!((req.params.projectId && req.body._id) && (req.params.projectId === req.body._id))) {
       const message = (
         `Request path id (${req.params.projectId}) and request body id ` +
         `(${req.body._id}) must match`);
       console.error(message);
       res.status(400).json({message: message});
     }

     if (! ('projectName' in req.body && req.body['projectName'])) {
       return res.status(400).json({message: `Must specify value for projectName`});
     }

     const toUpdate = {
       'projectName': req.body.projectName
     }

     Projects
       .findByIdAndUpdate(req.params.projectId, {$set: toUpdate})
       .exec()
       .then(project => res.status(204).end())
       .catch(err => res.status(500).json({message: 'Internal server error'}));
   })
   .delete((req, res) => {
     Projects
       .findByIdAndRemove(req.params.projectId)
       .exec()
       .then(project => res.status(204).end())
       .catch(err => res.status(404).json({message: 'Not Found'}));
   });


module.exports = projectRouter;
