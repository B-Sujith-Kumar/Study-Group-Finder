
function isEmpty(value) {
    return !value || value.trim() === '';
}

function userCredentialsAreValid(email, password) {
    return (email && email.includes('@') && password && password.trim().length >= 6);
}

function userDetailsAreValid(email, password, name, phnumber) {
    return ( userCredentialsAreValid(email, password) && !isEmpty(name) && !isEmpty(phnumber) );
}

module.exports = userDetailsAreValid;