Design Decisions:
    All .js files were kept in public/js/ save for the server.js for acccessibility
Installing:
    Navigate to isnide a4-data folder
    run npm install to install dependencies
    create folder called "a4" in base directory, this will be the db folder.
Running:
    run mongo daemon with "mongod --dbpath=a4".
    run "node database-initializer.js" to initialize tester objects.
    run "node server.js" to start server.
    open up "http://localhost:3000" on browser
    Test away!

Extra Notes:
    The database initializer gives a MongoExpireSessionError upon running.This doesn't impact the program at all, but I couldn't find how to fix it.
