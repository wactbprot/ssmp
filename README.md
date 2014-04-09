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

## start with formatted logging
```
./ssmp 8001 | ../node_modules/bunyan/bin/bunyan -l info
```

### post a mp definition


```
curl -X POST -H content-type:application/json -d  '{"_id":"se3-mp",\
	"BelongsTo":"SE3"}' http://localhost:8000/se3-mp/mp
```
