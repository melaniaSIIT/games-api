const ObjectID = require('mongodb').ObjectID;
const rp = require('request-promise-native');
const mockGames = require('../../config/games.json');


module.exports = function(app, db) {
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Auth-Token");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    next();
  });

	/****** GAME ******/
	// GET
	app.get('/games/:id', (req, res) => {
		const id = req.params.id;
		try {
	    	const details = { '_id': new ObjectID(id) };
	    	db.collection('games').findOne(details, (err, item) => {
		      if (err) {
		        res.send({'error':'An error has occurred'});
		      } else {
		        res.send(item);
		      }
		    });
	    } catch (error) {
	    	res.status(400);
	    	res.json({'error' : 'Invalid game ID'});
	    }
	});

	// DELETE
	app.delete('/games/:id', (req, res) => {
		const id = req.params.id;
	  const details = { '_id': new ObjectID(id) };
		db.collection('games').remove(details, (err, item) => {
	      if (err) {
	        res.send({'error':'An error has occurred'});
	      } else {
	        res.send('Game ' + id + ' deleted!');
	      }
	    });
	});

	// CREATE
	app.post('/games', (req, res) => {
		const authToken = req.get('x-auth-token');
		if (req.body && req.body._id) {
			res.status(400);
			res.json({'error': 'You should not provide an _id for a new game, it will be automatically generated on Server Side'});
			return;
			
		}
		db.collection('games').insert(req.body, (err, result) => {
			if (err) { 
				console.log(err);
				res.send({ 'error': 'An error has occurred' }); 
			} else {
				res.send(result.ops[0]);
			}
		});
	});
	
	// UPDATE
	app.put('/games/:id', (req, res) => {
		const id = req.params.id;
		let details;
		if (req.body && req.body._id) {
			res.status(400);
			res.json({'error': 'You should not update _id property on game object'});
			return;
			
		}
		try {
			details = { '_id': new ObjectID(id) };
			// need to validate movie id
			db.collection('games').update(details, { $set : req.body}, (err, response) => {
				if (err) {
						res.status(500);
						res.send({'message':'An error has occurred'});
				} else {
						if (response.result.nModified == 0) {
							res.status(400);
							res.json({'message': 'Nothing to update'})
						} else {
							res.status(200);
							res.json(req.body);
						}
				} 
			});
		} catch(e) {
			res.status(400)
			return res.json({'message':'Invalid movie id'});
		}
	});

	/****** GAMES ******/
	// GET Games
	app.get('/games', (req, res) => {
		const projection = {
			_id:true,
			title: true,
			imageUrl:true,
			description: true
		}
		db.collection('games').find({}, projection).toArray(function(err, items) {
			if (err) {
				res.send({'error':'An error has occurred'});
			} else {
				res.send(items);
			}
		});
	});
	
	app.get('/regenerate-games', (req, res) => {
		const promises = [];
		db.collection('games').remove({}).then(() => {
				mockGames.forEach((gameDetails) => {
						const p = new Promise((resolve, reject) =>{
								db.collection('games').insert(gameDetails, (err, result) => {
									if (err) {
										reject();
									} else {
										resolve();
									}
								});
						});
						promises.push(p);
				});
		}).catch ((e) => {
				console.log(e);
		});
		Promise.all(promises).then(()=>{
			res.send("You have some brand new DB data")
		}).catch((e) => {
			res.status(500);
			res.send("Somethinf went wrong");
		})
	});
};