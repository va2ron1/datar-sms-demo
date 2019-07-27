const http = require('http');
const express = require('express');
const session = require('express-session');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(session({secret: 'secret-cat'}));
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
				message ='Successfully submited';
			} else if (req.session.action === "2") {
				await axios
			      .get(
			        "https://api.datar.online/v1/data/?auth_key=NzdlYWRjOTEtZjAzNi00ODQzLWJmMjYtNTkwMmI4ODkwODlj" +
			          "&search=" +
			          req.body.Body
			      )
			      .then(response => {
					message = response.data.data[0].data;
			      })
			      .catch(e => {
				console.log(e)
			      	message = "Nothing has been found with your search.";
			      });

			    req.session.action = undefined;

				twiml.message(message);
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


http.createServer(app).listen(1337, () => {
  console.log('Express server listening on port 1337');
});

