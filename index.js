var express = require('express')
var app = express()
var cors = require('cors')
var bodyParser = require('body-parser')

// ENV Config
require('dotenv').config()

// PayPal Config
var paypal = require('paypal-rest-sdk')

paypal.configure({
  mode: 'sandbox',
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
})

app.use(cors())

// Body Parser Config...
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// set the view engine to ejs
app.set('view engine', 'ejs')

// use res.render to load up an ejs view file

// index page
app.get('/', function (req, res) {
  res.render('pages/index')
})

app.post('/pay', function (req, res) {
  const data = req.body

  const create_payment_json = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: 'http://localhost:8080/success',
      cancel_url: 'http://localhost:8080/cancel',
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: 'RedHat',
              sku: '001',
              price: `${req.body.amount}`,
              currency: `${req.body.cType}`,
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: `${req.body.cType}`,
          total: `${req.body.amount}`,
        },
        description: 'This is a payment for purchasing a Hat',
      },
    ],
  }

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === 'approval_url') {
          res.redirect(payment.links[i].href)
        }
      }
    }
  })

  app.get('/success', (req, res) => {
    const payerId = req.query.PayerID
    const paymentId = req.query.paymentId

    const execute_payment_json = {
      payer_id: payerId,
      transactions: [
        {
          amount: {
            currency: `${data.cType}`,
            total: `${data.amount}`,
          },
        },
      ],
    }

    paypal.payment.execute(paymentId, execute_payment_json, function (
      error,
      payment,
    ) {
      if (error) {
        console.log(error.response)
        throw error
      } else {
        console.log(JSON.stringify(payment))
        res.send('Success')
      }
    })
  })

  app.get('/cancel', (req, res) => res.send('Cancelled'))
})

app.listen(8080)
console.log('Server is listening on port 8080')
