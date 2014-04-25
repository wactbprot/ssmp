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
./ssmp [options] | ../node_modules/bunyan/bin/bunyan -l info
```
Run ```ssmp -h``` for help



### post a mp definition


```
curl -X POST -H content-type:application/json -d  '{"_id":"se3-mp",\
	"BelongsTo":"SE3"}' http://localhost:8000/se3-mp
```
or use csmp

...



### prepare a container

In order to prepare a container to run the tasks 
(given in the containers recipe) one have to fetch
the task objects. This is done by sending the string 
```load```
to the container which is intented to be loaded:

```
 curl -X PUT -d 'load' http://localhost:8001/mpdef/ctrl/0
```
During this process 
```
 curl http://localhost:8001/mpdef/ctrl/0
```
returns a
```
 loading
```
Afterwards 
```
 curl http://localhost:8001/mpdef/ctrl/0
```
returns
```
 loaded
```

### stop a container

```
 curl -X PUT -d 'false' http://localhost:8001/mpdef/ctrl/0
```  