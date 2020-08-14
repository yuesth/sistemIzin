const fb = require('firebase');
// const fbStorage = require('firebase/storage');
var firebaseConfig = {
    apiKey: "AIzaSyBmEryBWpUMUBpX68KZc0CnaJ_PpSAiyK0",
    authDomain: "sistemizin.firebaseapp.com",
    databaseURL: "https://sistemizin.firebaseio.com",
    projectId: "sistemizin",
    storageBucket: "sistemizin.appspot.com",
    messagingSenderId: "598556197863",
    appId: "1:598556197863:web:aabae943b55a0fcda5b342"
}
var defaultProject = fb.initializeApp(firebaseConfig);
// var storageProject = fbStorage.initializeApp(firebaseConfig);
module.exports.configFb = defaultProject;

