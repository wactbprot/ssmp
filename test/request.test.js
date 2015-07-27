var net    = require("../lib/net")
  , deflt  = require("../lib/default")
  , assert = require("assert")
  , rqst =  require("../lib/request")



describe('request()', function(){

  it('should request the db ', function(done){

    var pretask = { TaskName: 'Common-wait',
                    Replace: { '@waittime': 10000 },
                    Id: [],
                    MpName: 'Check',
                    Standard: '' }
      , strdata = JSON.stringify(pretask)
      , con     = net.task(strdata)
      , N       = 20;
    for(var i = 0; i < N +1; i++){
      (function(j){
        rqst.exec(con, pretask, strdata, function (err, task){
          assert.equal(err,null);
          if(j == N){
            done()
          }
        });
      })(i)
    }
  });
});
