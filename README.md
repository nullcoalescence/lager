# lager
 http logging server

## Installation
(this guide assumes you are installing this on a linux server on your local network, like a raspberry pi or something. You should have a webserver installed, like nginx. You can also run it locally if you'd like.
```
$ git clone https://github.com/bendotbike/lager.git /var/apps/lager
$ cd /var/apps/lager
$ npm install
```

Next you should setup a reverse proxy to run this on your machine's webserver. Set your your .env file if you'd like to specify port and log file directories. Otherwise lager will use defaults.

## Run
```
$ npm install pm2@latest -g
$ pm2 start /var/apps/lager/index.js --name "lager"
```

