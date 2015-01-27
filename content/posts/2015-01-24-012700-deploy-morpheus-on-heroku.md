---
type: post
author: koba04
email: koba0004@gmail.com
tags: morpheus,heroku
slug: deploy-morpheus-on-heroku
title: Deploy Morpheus on heroku
description: How to deploy Morpheus on heroku.
---

### Work on local

Currently, Morpheus isn't published to npm yet.

https://github.com/vesparny/morpheus/issues/14

You need to set up it in reference to [README](https://github.com/vesparny/morpheus)

```
% mkdir morpheus-sample && cd morpheus-sample
% git init
% git remote add morpheus -m master https://github.com/vesparny/morpheus.git
% git pull -s recursive -X theirs morpheus master
% npm install
% gulp install
% gulp watch
```
Therefore, you can access your blog at http://localhost:3000/ .


### Create Application on Heroku

You create an application on Heroku for you blog.

![create application](/content/images/posts/deploy-morpheus-on-heroku/create-app.png)


### Heroku Config Variables

Set `NODE\_ENV` as `production`.

![heroku config](/content/images/posts/deploy-morpheus-on-heroku/heroku-config.png)


### Setting production.json

Set URL, IP and port.

```json
module.exports = {
  siteUrl: 'http://{YOUR_APP_NAME}.herokuapp.com',
  ip: '0.0.0.0',
  port: process.env.PORT
};
```

### Build

```sh
% gulp build --env=production
[01:08:52] Using gulpfile ~/work/github/morpheus-sample/gulpfile.js
[01:08:52] Starting 'clean'...
[01:08:52] Finished 'clean' after 7.47 ms
[01:08:52] Starting 'build'...
[01:08:52] Starting 'styles'...
[01:08:53] gulp-ruby-sass: directory
[01:08:53] gulp-ruby-sass: overwrite main.css
[01:08:53] Finished 'styles' after 1.53 s
[01:08:53] Starting 'browserify'...
[01:09:05] Finished 'browserify' after 12 s
[01:09:05] Starting 'replace'...
[01:09:05] Finished 'replace' after 56 ms
[01:09:05] Starting 'server'...
[01:09:05] Finished 'server' after 142 ms
[01:09:05] Starting 'watchers'...
[01:09:05] Finished 'watchers' after 33 ms
[01:09:05] Finished 'build' after 14 s
[gulp] [nodemon] v1.3.2
[gulp] [nodemon] to restart at any time, enter `rs`
[gulp] [nodemon] watching: *.*
[gulp] [nodemon] starting `node server.js`
[2015-01-23T16:09:13.427Z]  INFO: app/morpheus/64856 on koba04.local: creating express application
[2015-01-23T16:09:13.592Z]  INFO: app/morpheus/64856 on koba04.local: Worker 64856 is running morpheus@0.0.1-alpha1 in production mode on port NaN
```

### Deploy

```
% git add .
% git commit -m 'first commit'
% heroku login
Enter your Heroku credentials.
Email: xxxxx
Password (typing will be hidden):
Authentication successful.
% heroku git:remote -a morpheus-sample
Git remote heroku added
% git push heroku master
Counting objects: 2160, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (659/659), done.
Writing objects: 100% (2160/2160), 1.06 MiB | 404.00 KiB/s, done.
Total 2160 (delta 1304), reused 2160 (delta 1304)
remote: Compressing source files... done.
:
remote: -----> Discovering process types
remote:        Procfile declares types -> web
remote:
remote: -----> Compressing... done, 10.4MB
remote: -----> Launching... done, v4
remote:        https://morpheus-sample.herokuapp.com/ deployed to Heroku
remote:
remote: Verifying deploy... done.
To https://git.heroku.com/morpheus-sample.git
 * [new branch]      master -> master
```

