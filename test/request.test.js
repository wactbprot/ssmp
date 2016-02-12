var net    = require("../lib/net")
  , conf   = require("../lib/conf")
  , assert = require("assert")
  , rqst   =  require("../lib/request");

describe('request()', function(){
  it('should request the db ', function(done){

    var pretask = { TaskName: 'Common-wait',
                    Replace: { '@waittime': 10000 },
                    Id: [],
                    MpName: 'Check',
                    Standard: '' }
      , N       = 20;

    net.task(JSON.stringify(pretask), function(err,con){
      for(var i = 0; i < N +1; i++){
        (function(j){
          rqst.exec(con, pretask, JSON.stringify(pretask), function (err, task){
            assert.equal(err, null);
            assert.equal(task.TaskName, 'Common-wait');
            if(j == N){
              done()
            }
          });
        })(i)
      }
    });
  });
});
