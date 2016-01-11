var Class = require("infrastructure/lib/Class");
var _     = require("underscore");
var fs    = require("fs");
var path  = require("path");

module.exports = Class.extend("Mailer", {

  constructor: function(env, structure_name, target_name){
    this.env   = env;
    var config = env.config;
    var nodemailer = env.engines.nodemailer;
    var account = this.account, defaults = this.defaults;

    if(typeof account  === "string") account  = env.helpers.resolve( env.config, account  );
    if(typeof defaults === "string") defaults = env.helpers.resolve( env.config, defaults );

    this.transport = nodemailer.createTransport(account, defaults || {});
    if(config.mail && config.mail.views){

      var cache = {}, mustache = require("mustache");
      
      if(this.subject && typeof this.subject === "string"){
        (function(subject_text, self){
          self.subject = function(data, cb){
            data = _.extend({}, data, {config: self.env.config});
            return mustache.render(subject_text, data); 
          }
        })(this.subject, this);
      }

      var compiler = config.mail.cache ? function(path, options, cb){ 
        cb(null, mustache.render(cache[path] || (cache[path] = fs.readFileSync(path, "utf8")), options));
      } : function(path, options, cb){
        fs.readFile(path, "utf8", function(err, body){
          if(err) throw err;
          cb(null, mustache.render(body, options));          
        })
      }
      for(var key in this){
        var val = this[key], subject;
        if(typeof val === "string"){
          if(val.indexOf("|") > 0){
            var parts = val.split("|").map(function(p){return p.trim();});
            val = parts[0];
            (function(subject_template, self){
              subject = function(data, cb){
                data = _.extend({}, data, {config: self.env.config});
                return mustache.render(subject_template, data);
              }
            })(parts[1], this);
          }
          var file_path = path.join(config.rootDir, config.mail.views, val);
          if(fs.existsSync( file_path )){
            (function(key, file_path, subject_template, self){
              if(subject_template){
                self[key] = function(data, options, cb){
                  data = _.extend({}, data, {config: self.env.config});
                  if(!cb) { cb=options, options={}; }
                  compiler(file_path, data, function(err, html){
                    if(err) return cb(err);
                    options.subject = subject_template(data);
                    options.html = html;
                    self.send(options, cb);
                  });
                }; 
              }
              else{
                self[key] = function(data, options, cb){
                  data = _.extend({}, data, {config: self.env.config});
                  if(!cb) { cb=options, options={}; }
                  compiler(file_path, data, function(err, html){
                    if(err) return cb(err);
                    options.html = html;
                    self.send(options, cb);
                  });
                };                
              }
            })(key, file_path, subject || this.subject, this);
          }          
        }
      }
    }
  },
  
  send: function(options, cb){
    this.transport.sendMail(options, function(err, info){
      if(err) console.log("ERROR :::", err);
      if(err) return cb(err);
      cb(null, true);
    });
  }
  
});
