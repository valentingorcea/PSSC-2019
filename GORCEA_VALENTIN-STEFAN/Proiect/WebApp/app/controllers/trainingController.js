'use strict';

const express = require('express');
const HttpError = require('../util/httpError');
const log = require('../middlewares/logService');
var Training = require('../models/trainingModel');
const { check, validationResult } = require('express-validator');

const trainingRouter = express.Router();


const router = function (trainingRepository) {
   
    // get all trainings
    trainingRouter.get('/', async (req, res, next) => {
        try {
            const trainings = await trainingRepository.getTrainings(req.authenticatedUser.userName);

            const result = { 
                user : req.authenticatedUser.userName,
                trainings : trainings
            }; 

            res.setHeader('Status', 200);
            log.debug(result);
            res.send(result);
        } catch (err) {
            log.error(JSON.stringify(err));
            return next(new HttpError(500, `GET / training error ${err}.`));
        }
    });

    // create a training
    trainingRouter.post('/new',  [
        check('topic').exists().withMessage('topic must be non-empty'),
        check('description').exists().withMessage('description must be non-empty'),
        check('trainerId').exists().withMessage('trainerId must be non-empty'),
        check('currentAttendees').exists().withMessage('currentAttendees must be non-empty'),
        check('location').exists().withMessage('location must be non-empty'),
        check('duration').exists().withMessage('duration must be non-empty')
      ], async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                let errorMessage = ``;
                errors.array().forEach(error => {
                    errorMessage += error.msg + ` \n`;
                })
                throw new HttpError(412, `${errorMessage}`);
            }
            let training = new Training(null, req.body.topic, req.body.description, req.body.date, req.body.trainerId, req.body.seats, req.body.currentAttendees, req.body.location, req.body.duration);
            const result = await trainingRepository.createTraining(training, req.authenticatedUser);
    
            res.setHeader('Status', 200);
            res.send(result);
    
        } catch (err) {
            log.error(JSON.stringify(err));
            return next(new HttpError(500, `POST join-training error ${err}.`));
        }
    });

    // join a training
    trainingRouter.post('/:trainingId', async (req, res, next) => {
        try {
            let training = new Training(req.params.trainingId);
            const result = await trainingRepository.joinTraining(training.id, req.authenticatedUser.userName, true);
    
            res.setHeader('Status', 200);
            res.send(result);
    
        } catch (err) {
            log.error(JSON.stringify(err));
            return next(new HttpError(500, `POST join-training error ${err}.`));
        }
    });

     // give up on a training
     trainingRouter.put('/leave/:trainingId', async (req, res, next) => {
        try {
             let training = new Training(req.params.trainingId);
             const result = await trainingRepository.cancelJoinTraining(training.id, req.authenticatedUser.userName);

            res.setHeader('Status', 200);
            res.send(result);
        } catch (err) {
            log.error(JSON.stringify(err));
            return next(new HttpError(500, `DELETE join-training error ${err}.`));
        }
    });

    // cancel a training
    trainingRouter.delete('/:trainingId', async (req, res, next) => {
        try {
             let training = new Training(req.params.trainingId);
             const result = await trainingRepository.deleteTraining(training.id, req.authenticatedUser.userName);
            if(result === -1){
                res.setHeader('Status', 200);
                res.send([]);
            }else{
                res.setHeader('Status', 200);
                res.send(result);
            }
          
        } catch (err) {
            log.error(JSON.stringify(err));
            return next(new HttpError(500, `DELETE join-training error ${err}.`));
        }
    });

   

    return trainingRouter;
};

module.exports = router;