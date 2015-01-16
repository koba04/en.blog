'use strict';


module.exports = {
  log: {
    level: 'debug',
    file: 'morpheus.log',
  },
  'repositoryStrategy': {
    type: 'file-system-repository-strategy'
  },
  debug: true, //useful for seeing some logs in the browser console
  permalinkStructure:'/:year/:month/:day/:title/', //you can also use /:title/ or '/:year/:month/:title/'
  postPerPage: 3, // number of posts per page
  siteUrl: 'http://localhost:3000', // the url of your website
  useSSL: false, // if true it redirects all incoming requests to the https url
  siteTitle: 'koba04 blog(en)',
  theme: 'koba04', // currently used theme
  siteDescription: 'my english version blog. about programming',
  port: 3000,
  ip: '127.0.0.1',
  authors: {
    'koba04': {
      meta: ':)'
    }
  },
  googleAnalytics : '', //your google analytics tracking code
  disqusComments : 'koba04-english-blog' //your disqus shortname
};
