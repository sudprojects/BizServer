const express = require ('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');

const db  = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'test',
    database : 'bizdb'
  }
});

db.select('*').from('users').then(data =>{
	//console.log(data);
});

//console.log(db.select('*').from('users'));

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req,res) =>{

	res.send('this is working');
})

app.post('/signin', (req, res) =>{

const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json('incorrect form submission');
  }
  db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db.select('*').from('users')
          .where('email', '=', email)
          .then(user => {
            res.json(user[0])
          })
          .catch(err => res.status(400).json('unable to get user'))
      } else {
        res.status(400).json('wrong credentials')
      }
    })
    .catch(err => res.status(400).json('wrong credentials'))
	
})

app.post('/register', (req, res) => {
	const { email, name, password } = req.body;

	const hash = bcrypt.hashSync(password);
	db.transaction(trx => {
		trx.insert({

			hash:hash,
			email:email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
			.returning('*')
			.insert({
				email: loginEmail[0],
				name: name,
				joined: new Date()
			})
			.then(user => {
     			res.json(user[0])
			})
			})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err => res.status(400).json('Unable to register'))
})

app.put('/extra', (req, res) =>{
	const { id } = req.body;
	db('users').where('id', '=', id)
  .increment('score', 1)
  .returning('score')
  .then(score => {
  	res.json(score[0])
  })
  .catch(err => res.status(400).json('Unable to get score'))
  })

app.post('/addOrders', (req, res) =>{
	const { product_name, number_of_units, total_price, notes, user_id } = req.body;
	db.insert({
		product_name: product_name,
		number_of_units: number_of_units,
		total_price: total_price,
		notes: notes,
		user_id: user_id, 
		order_date: new Date()
	})
	.into('orders')
	.returning('*')
	.then(order => {
		res.json(order[0])
	})
})

app.post('/orderCount', (req, res) =>{
	const { user_id } = req.body;
	db('orders').count('*').where('user_id', '=', user_id )
	.returning('*')
	.then(count => {
		res.json(count[0])
	})
})

app.post('/searchOrders', (req, res) =>{
	const { user_id } = req.body;
	db('orders').where('user_id', '=', user_id )
	.returning('*')
	.then(orders => {
		res.json(orders)
	})
})

app.post('/addProduct', (req,res)=>{

const {product_name, cost_to_company, notes, user_id} = req.body;

db.insert({

	product_name: product_name,
	cost_to_company: cost_to_company,
	notes: notes,
	user_id: user_id
})
.into('products')
.returning('*')
.then(product => {res.json(product[0]) })


})

app.post('/productList', (req, res) =>{
	const { user_id } = req.body;
	db('products').where('user_id', '=', user_id )
	.returning('*')
	.then(products => {
		res.json(products)
	})
})

app.listen(process.env.PORT || 3000, ()=>{


	console.log(`app is running on port ${process.env.PORT}`);
})

