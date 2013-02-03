How to run a server locally
=====

First you have to install:
* nginx: http://nginx.org/en/download.html
* Node.js: http://nodejs.org/
* MongoDB: http://www.mongodb.org/downloads

Note:
* In the default settings, you need to create a folder for mongo at C:\data\db, before starting the bin\mongodb.exe (in Windows)
* When you run nginx in Windows it'll just open a command prompt and close, but it's working. Open "http://localhost/" in your browser to confirm

Start up nginx and mongodb.

Copy (don't move, copy) the contents from the /site/ dir to the html folder in nginx.

The lastest commit has the game engine configured to connect to localhost, so you shouldn't have to change anything regarding the server ip, but if for some reason in the future this changes, you have to edit IPs in the /site/js/main.out.js file to point to the correct IP address.

Now start up the registration server in the /regserver/regserver.node.js file, just run "node" from the command line with that file as the argument.

Start the game server in the /server/server.out.node.js

Note that the server needs the folder "site" in the parent directory of it. So when you had copied the site files to nginx, make sure you didn't delete them from their original location.

You only need the registration server during the registration process, it will create the needed database structures for you. Now go to http://localhost/play.html in your browser and create an account.

Everything should be up and running. Open multiple browser windows and login into other accounts to test multiplayer features.
