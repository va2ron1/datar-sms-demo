let express = require('express');
let session = require('express-session');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const bodyParser = require('body-parser');
const axios = require('axios');

// Load environment variables
require('dotenv').config();

let app = express();

// Express Session initializer with sequelize store
app.use(session({
	secret: process.env.SESSION_SECRET,
	cookie: { maxAge: 60 * 60 * 1000 },
	resave: false,
	saveUninitialized: true,
}))

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/sms', async (req, res) => {

	if (req.body.Body) {
		const twiml = new MessagingResponse();
		let message = undefined;

		if (req.body.Body.match(/^([1-2]){1}$/gi)) {
			if (req.body.Body === "1") {
				req.session.action = "1";
				message ='Please reply with your data.';
			} else if (req.body.Body === "2") {
				req.session.action = "2";
				message ='What do you want to search?';
			}
		} else if (req.session.action) {
			if (req.session.action === "1") {
				await axios
				.post("https://api.datar.online/v1/data/?auth_key=" + process.env.DATAR_API_KEY, {
					data: req.body.Body
				})
				.then(response => {
					message = response.data.message;
				})
				.catch(e => {
					message = "Nothing has been found with your search.";
				});

				req.session.destroy();

				twiml.message(message);
				res.writeHead(200, {'Content-Type': 'text/xml'});
				return res.end(twiml.toString());
			} else if (req.session.action === "2") {
				await axios
				.get(
					"https://api.datar.online/v1/data/?auth_key=" +
					process.env.DATAR_API_KEY +
					"&search=" +
					req.body.Body
				)
				.then(response => {
					let length = 3;
					if (response.data.data.length < 3) {
						length = response.data.data.length;
					}
					for (let i = (length - 1); i >= 0; i--) {
						twiml.message(response.data.data[i].data);
					}
				})
				.catch(e => {
					twiml.message("Nothing has been found with your search.");
				});

				req.session.destroy();

				res.writeHead(200, {'Content-Type': 'text/xml'});
				return res.end(twiml.toString());
			}
		}

		if (!message) {
			message = 'Welcome to DATAR.\n\n1. Submit Data\n2. Search Data';
		}
		twiml.message(message);
		res.writeHead(200, {'Content-Type': 'text/xml'});
		return res.end(twiml.toString());

	} else {
		res.end();
	}
});

let port = process.env.PORT || 1337
app.listen(port, function () {
	console.log('DATAR SMS Demo running at port', port, '!');
});
