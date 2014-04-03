```
              
 ___ ___ _____ ___ 
|_ -|_ -|     | . |
|___|___|_|_|_|  _|
              |_|  
```

## usage

```
ssmp [port]
```

## formatted logging
```
./ssmp 8001 | ../node_modules/bunyan/bin/bunyan -l info
```

## example mp

```
curl -X POST -H content-type:application/json -d  '{"_id":"test-mp",
"yamp":{"Standard":"SE3"}}' http://localhost:8000/mp/test-mp
```