function checkAuthStatus(req, res, next) {
    const uid = req.session.uid;

    if(!uid) {
        return next();
    }

    res.locals.uid = uid;
    res.locals.isAuth = true;
    next();
}

function returnUid(req, res, next) {
    const uid = req.session.uid;

    return uid;
}

module.exports = {
    checkAuthStatus: checkAuthStatus,
    returnUid: returnUid
};