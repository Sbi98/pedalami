var express = require('express');
var app = express.Router();
app.use(express.json());
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = require('mongodb').ObjectId;
const UserSchema = Schema.UserSchema;

// Schema
const TeamSchema = new Schema({
  admin_uid: { type: String, required: true },
  name: { type: String, required: true },
  members: { type: Array, required: true }, // At least the admin
  active_events: { type: Array, required: false }, // IDs of active events
  event_requests: { type: Array, required: false }, // To better define once requests are defined
});

// Model
const Team = mongoose.model('Team', TeamSchema);
const User = mongoose.model('User', UserSchema);

// POST /create
app.post('/create', (req, res) => {
  console.log('Received create POST request:');
  console.log(req.body);
  if (req.body.name) {
    newTeam = new Team();
    newTeam.admin_uid = req.body.admin_uid;
    newTeam.name = req.body.name;
    newTeam.members = [req.body.admin_uid];
    const admin = User.findOne({ uid: req.body.admin_uid }, (error, admin) => {
      if (error) {
        console.log('Error while searching for the user specified as admin!\n'+error);
        res.status(500).send('Error while creating the team!\nError while searching for the user specified as admin');
      }
      if (!admin) {
        console.log('Cannot find the user specified as admin!\n');
        res.status(500).send('Error while creating the team: the team admin specified does not exist!');
      } 
      else {
        //newTeam.members.push(req.body.admin_uid);
        newTeam.save((error, team) => {
          if (error || !team) {
            console.log('Error while saving the team!\n'+error);
            res.status(400).send('Error while creating the team!');
          } else {
            console.log("Team with id: "+team._id+" added successfully");
            res.status(200).json({
              team_id: team._id
            });
          }
        }
        );
      }
    });
  } else {
    console.log('Error: Missing parameters.');
    res.status(400).send('Error: Missing parameters.');
  }
});


// GET /search?name=start_of_name
app.get('/search', (req, res) => {
  const to_search = req.query.name;
  console.log('Received search GET request with param name='+to_search);
  if (to_search) {
    //Team.find({ name: {$regex: to_search} }, 'team_id name', (error, teams) => { //returns only team_id and name fields
    Team.find({ name: {$regex: to_search} }, (error, teams) => {
      if (error) {
        console.log('Error finding the teams.\n'+error);
        res.status(500).send('Error finding the teams!');
      } else {
        res.status(200).send(teams);
      }
    });
  } else {
    console.log('Error: Missing parameters.');
    res.status(400).send('Error: Missing parameters.');
  }
});


// POST /join
app.post('/join', (req, res) => {
  console.log('Received join POST request:');
  console.log(req.body);
  if (req.body.team_id && req.body.uid) {
    Promise.all([
      User.findOne({ uid: req.body.uid }),
      Team.findOne({ _id: req.body.team_id })
    ]).then(([user, team]) => {
      console.log(team);
      console.log(user);
      if (team.members.includes(req.body.uid)) {
        console.log('Error: User already in team.');
        res.status(500).send('Error: User already in team.');
      } else {
        if (user.teams == null) {
          user.teams = [];
        }
        user.teams.push(req.body.team_id);
        team.members.push(req.body.uid);
        Promise.all([
          team.save(),
          user.save()
        ])
        .then(([user, team]) => {
          if (user != null && team != null) {
            console.log('The user has been added to the team.');
            res.status(200).send('The user has been added to the team.');
          }
        })
        .catch((error2) => {
          console.log('Error while joining the team\n'+error2);
          res.status(500).send('Error while joining the team');
        });
      }
    }).catch((error) => {
      console.log('Error finding the user or the team.\n'+error);
      res.status(500).send('Error finding the user or the team!');
    });
    
  }
  else {
    console.log('Error: Missing parameters.');
    res.status(400).send('Error: Missing parameters.');
  }
});


/*
// POST /join
app.post('/join', (req, res) => {
  console.log('Received join POST request:');
  console.log(req.body);
  if (req.body.team_id && req.body.uid) {
    const user = User.findOne({ uid: req.body.uid }, (error) => {
      if (error) {
        console.log('Error finding the user.\n'+error);
        res.status(500).send('Error finding the user!');
      }
    });
    Team.findOne({ _id: req.body.team_id }, (error, team) => {
      if (error) {
        console.log('Error finding the team.\n'+error);
        res.status(500).send('Error finding the team!');
      } else {
        if (!team) {
          console.log('Team to join not found');
          res.status(500).send('Team to join not found');
        }
        else {
          if (team.members.includes(req.body.uid)) {
            console.log('Error: User already in team.');
            console.log(team);
            console.log(team.members);
            res.status(400).send('Error: User already in team.');
          } else {
            if (user.teams == null) {
              user.teams = [];
            }
            user.teams.push(req.body.team_id);
            team.members.push(req.body.uid);
            team.save((error2) => {
              if (error2) {
                console.log('Error adding the user in the team.\n'+error2);
                res.status(500).send('Error adding the user in the team!');
              } else {
                //TO FIX ASAP! Race condition and bad stuff can happen... Use transactions
                user.save((error3) => {
                  if (error3) {
                    console.log('Error adding the team in the user.\n'+error3);
                    res.status(500).send('Error adding the team in the user!');
                  } else {
                    console.log('The user has been added to the team.');
                    res.status(200).send('The user has been added to the team.');
                  }
                })
              }
            })
          }
        }
      }
    })
  }
  else {
    console.log('Error: Missing parameters.');
    res.status(400).send('Error: Missing parameters.');
  }
});
*/



module.exports = app;