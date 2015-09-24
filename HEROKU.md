#Deploy on Heroku

* Create app `heroku apps:create`
* Mongo Addon `heroku addons:create mongolab:sandbox`
* Get Mongo URI `heroku config:get MONGOLAB_URI`
* Set DATABASE_URL env var `heroku config:set DATABASE_URL={uri}`
* Deploy `git push heroku master`
* Open `heroku open`