# TOC
   - [utils](#utils)
     - [#cmd_to_array(cmdstr)](#utils-cmd_to_arraycmdstr)
     - [#replace_in_with(task, token, value)](#utils-replace_in_withtask-token-value)
<a name=""></a>
 
<a name="utils"></a>
# utils
<a name="utils-cmd_to_arraycmdstr"></a>
## #cmd_to_array(cmdstr)
should return an array with the given string.

```js
var l   = "load",
    r   = "run";
assert.equal(l, utils.cmd_to_array(l)[0]);
assert.equal(r, utils.cmd_to_array(r)[0]);
assert.equal(1, utils.cmd_to_array(r).length);
```

should return an array of length 2.

```js
var l   = "load",
    r   = "run",
    lr  = "load;run";
assert.equal(l, utils.cmd_to_array(lr)[0]);
assert.equal(r, utils.cmd_to_array(lr)[1]);
assert.equal(2, utils.cmd_to_array(lr).length);
```

should return an array of length 3.

```js
var l   = "load",
    r   = "run",
    lrr  = "load;2:run";
assert.equal(l, utils.cmd_to_array(lrr)[0]);
assert.equal(r, utils.cmd_to_array(lrr)[1]);
assert.equal(r, utils.cmd_to_array(lrr)[2]);
assert.equal(3, utils.cmd_to_array(lrr).length);
```

<a name="utils-replace_in_withtask-token-value"></a>
## #replace_in_with(task, token, value)
should return replaced task (can be any object.

```js
var task   = {a:"_gg",
              b:"ff",
              c:[1,2,3]},
    token= "_gg",
    val_1 = "replaced",
    val_2 = ["a", "b"];
assert.equal(val_1, utils.replace_in_with(task, token, val_1).a);
assert.equal("b", utils.replace_in_with(task, token, val_2).a[1]);
assert.equal(3, utils.replace_in_with(task, token, val_2).c[2]);
```

