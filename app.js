const express = require('express');

const csrf = require('csurf');

const expressSession = require('express-session');

const createSessionConfig = require('./config/session');

const path = require('path');

const db = require('./data/database');

const addCsrfTokenMiddleware = require('./middlewares/csrf-token')

const errorHandlerMiddleware = require('./middlewares/error-handler');

const checkAuthStatusMiddleware = require('./middlewares/check-auth');

const authRoutes = require('./routes/auth-routes');

const groupsRoutes = require('./routes/groups-routes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use('/groups/assets', express.static('group-data'));
app.use(express.urlencoded({ extended: false }));

const sessionConfig = createSessionConfig();

app.use(expressSession(sessionConfig));

app.use(csrf());

app.use(addCsrfTokenMiddleware);

app.use(checkAuthStatusMiddleware.checkAuthStatus);

app.use(authRoutes);

app.use(groupsRoutes);

app.use(errorHandlerMiddleware);

db.connectToDatabase()
.then(function() {
    app.listen(3000);
})
.catch(function(error) {
    console.log("Failed to connect to the database");
    console.log(error);}
)