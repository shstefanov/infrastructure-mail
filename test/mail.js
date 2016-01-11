var assert = require("assert");

describe("infrastructure-mail", function(){
  var engine = require("../engine");
  var Mailer = require("../Mailer");
  var nodemailer = require("nodemailer");

  var nodemailer_mockup = {
    createTransport: function(){
      this.options = [].slice.call(arguments);
      return {
        calls: [],
        sendMail: function(data, cb){
          this.calls.push(data); cb(data);
        }
      }
    }
  };

  var env = {
    helpers: require("infrastructure/lib/helpers"),
    engines:{},
    config: {
      accounts: {
        mail: {
          service: "gmail",
          auth: {
            user: "user@example.com",
            pass: "secret password",
          }
        }
      },
      rootDir: process.cwd(),
    }
  };

  it("Creates the engine", function(next){
    engine.call(env, function(err){
      assert.equal(err, null);
      assert.equal(env.engines.nodemailer === nodemailer, true );
      env.engines.nodemailer = nodemailer_mockup;
      next();
    });
  });

  it("Instance account option", function(next){
    var TestMailer = Mailer.extend("TestMailer", { account: { user: 1, password: 2 } });
    var mailer = new TestMailer(env);
    assert.deepEqual(env.engines.nodemailer.options, [{ user: 1, password: 2 }, {}]);
    next();
  });

  it("Instance account option (resolved from config)", function(next){
    var TestMailer = Mailer.extend("TestMailer", { account: "accounts.mail" });
    var mailer = new TestMailer(env);
    assert.deepEqual(env.engines.nodemailer.options, [{
      service: "gmail",
      auth: {
        user: "user@example.com",
        pass: "secret password",
      }
    }, {}]);
    next();
  });

  it("Instance defaults option", function(next){
    var TestMailer = Mailer.extend("TestMailer", { defaults: { from: 1, text: 2 } });
    var mailer = new TestMailer(env);
    assert.deepEqual(env.engines.nodemailer.options, [undefined, { from: 1, text: 2 } ]);
    next();
  });

  it("Instance defaults option (resolved from config)", function(next){
    var TestMailer = Mailer.extend("TestMailer", { defaults: { from: 4, text: 5 } });
    var mailer = new TestMailer(env);
    assert.deepEqual(env.engines.nodemailer.options, [undefined, { from: 4, text: 5 }]);
    next();
  });

  it("Does not compile patterns when no views field is set in mail config", function(next){
    var TestMailer = Mailer.extend("TestMailer", { TEST: "fixture.mustache" });
    var mailer = new TestMailer(env);
    assert.equal(mailer.TEST, "fixture.mustache");
    next();
  });

  it("compiles mail template when mail:views option is set in config", function(next){
    env.config.mail = { views: "test", cache: false };
    var TestMailer = Mailer.extend("TestMailer", { TEST: "fixture.mustache" });
    var mailer = new TestMailer(env);
    assert.equal(typeof mailer.TEST, "function");
    next();
  });

  it("Compiles html from template", function(next){
    env.config.mail = { views: "test", cache: false };
    var TestMailer = Mailer.extend("TestMailer", { TEMPLATE: "fixture.mustache" });
    var mailer = new TestMailer(env);
    mailer.TEMPLATE({product: 23}, {to: "me"}, function(data){
      assert.deepEqual(data, { to: 'me', html: '<p><span>product: 23</span></p>' });
      next();
    });
  });

  it("With default subject", function(next){
    env.config.mail = { views: "test", cache: false };
    var TestMailer = Mailer.extend("TestMailer", { 
      subject: "My awesome subject is: {{awesome}}",
      TEMPLATE: "fixture.mustache" 
    });
    var mailer = new TestMailer(env);
    mailer.TEMPLATE({ awesome: 25, product: 24 }, { to: "me" }, function(data){
      assert.deepEqual(data, { 
        to: 'me',
        subject: "My awesome subject is: 25",
        html: '<p><span>product: 24</span></p>' });
      next();
    });
  });

  it("With inline subject template", function(next){
    env.config.mail = { views: "test", cache: false };
    var TestMailer = Mailer.extend("TestMailer", {
      TEMPLATE: "fixture.mustache | My inine subject is: {{awesome}}" 
    });
    var mailer = new TestMailer(env);
    mailer.TEMPLATE({ awesome: 31, product: 19 }, { to: "me" }, function(data){
      assert.deepEqual(data, { 
        to: 'me',
        subject: "My inine subject is: 31",
        html: '<p><span>product: 19</span></p>' });
      next();
    });
  });

});