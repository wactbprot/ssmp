

<!-- Start ./lib/load.js -->

## all(mp, no)

Erstellt das Rezept aus der Definition

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Number** *no* Nummer des Containers (--> was eigentlich zum path zusammengefasste werden sollte

## distribute_def(mp, no, def, cb)

Bearbeitet die expandierte Definition und veranlasst
den Datenbankabruf der einzelnen Tasks

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Number** *no* Nummer des Containers
* **Array** *def* expandiertes Definitionsobjekt
* **Function** *cb* callback

## insert(mp, def, calibobjs, cb)

Fügt expandierte bzw. über Customer erweiterte Definitionen
in Gesamtablauf

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Array** *def* noch nicht expandiertes Definitionsobjekt
* **Object** *calibobjs* geladene Calibrierungen
* **Function** *cb* callback

## expand_task()

Expandiert wie folgt:

## ExpandSeq
```
{
  "TaskName": [
    "A",
    "B",
    "C"
  ],
  "Replace": {
    "@a": 1
  },
  "ExpandSeq": {
    "@b": [
      1,
      2,
      3
    ]
  }
}
```
wird zu
```
[
  [
    {
      "TaskName": "A",
      "Replace": {
        "@a": 1,
        "@b": 1
      },
      "Id": []
    }
  ],
  [
    {
      "TaskName": "B",
      "Replace": {
        "@a": 1,
        "@b": 2
      },
      "Id": []
    }
  ],
  [
    {
      "TaskName": "C",
      "Replace": {
        "@a": 1,
        "@b": 3
      },
      "Id": []
    }
  ]
]
```
## ExpandPar
```
{
  "TaskName": [
    "A",
    "B",
    "C"
  ],
  "Replace": {
    "@a": 1
  },
  "ExpandPar": {
    "@b": [
      1,
      2,
      3
    ]
  }
}
```
wird zu
```
[
  [
    {
      "TaskName": "A",
      "Replace": {
        "@a": 1,
        "@b": 1
      },
      "Id": []
    },
    {
      "TaskName": "B",
      "Replace": {
        "@a": 1,
        "@b": 2
      },
      "Id": []
    },
    {
      "TaskName": "C",
      "Replace": {
        "@a": 1,
        "@b": 3
      },
      "Id": []
    }
  ]
]
```
## ExpandByName
```
{
  "TaskName": [
    "A",
    "B",
    "C"
  ],
  "Replace": {
    "@a": 1
  },
  "ExpandByName": {
    "@b": [
      1,
      2,
      3
    ]
  }
}
```
wird zu
```
[
  [
    {
      "TaskName": "A",
      "Replace": {
        "@a": 1,
        "@b": 1
      },
      "Id": []
    }
  ],
  [
    {
      "TaskName": "B",
      "Replace": {
        "@a": 1,
        "@b": 1
      },
      "Id": []
    }
  ],
  [
    {
      "TaskName": "C",
      "Replace": {
        "@a": 1,
        "@b": 1
      },
      "Id": []
    }
  ],
  [
    {
      "TaskName": "A",
      "Replace": {
        "@a": 1,
        "@b": 2
      },
      "Id": []
    }
  ],
  [
    {
      "TaskName": "B",
      "Replace": {
        "@a": 1,
        "@b": 2
      },
      "Id": []
    }
  ],
  [
    {
      "TaskName": "C",
      "Replace": {
        "@a": 1,
        "@b": 2
      },
      "Id": []
    }
  ],
  [
    {
      "TaskName": "A",
      "Replace": {
        "@a": 1,
        "@b": 3
      },
      "Id": []
    }
  ],
  [
    {
      "TaskName": "B",
      "Replace": {
        "@a": 1,
        "@b": 3
      },
      "Id": []
    }
  ],
  [
    {
      "TaskName": "C",
      "Replace": {
        "@a": 1,
        "@b": 3
      },
      "Id": []
    }
  ]
]
```

<!-- End ./lib/load.js -->

