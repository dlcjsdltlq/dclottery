const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');
const model = require('./models')
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', './views');
app.set('view engine', 'ejs');

app.use('/static', express.static(__dirname + '/public'));
app.use('/', routes);
app.use(cors());

model.initializeRecentWinnerDB();
app.listen(3000, () => {
    console.log('App started on port 3000');
});

module.exports = {
    app
}