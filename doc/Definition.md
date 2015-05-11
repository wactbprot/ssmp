## Definition

Die Abläufe der einzelnen _container_ sind in der MP-Definition unter dem Pfad
```Mp.Container[n].Definition[S][P]``` mit _TaskName_ und
individuellen Ersetzungsanweisungen _Replace_ und _Use_
angegebenen. (```S``` und ```P``` stehen wie oben beschrieben für sequentieller
bzw. paralleler Schritt.) Bsp.:

```javascript
{
"_id": "mpid",
    "Mp": {
        "Container": [
            {
               "Element": ["Documents"],
               "Description": "periodically reads out all FM3/CE3 pressure devices",
               "Ctrl": "load;mon",
               "Definition":
    S --------> [
      P -------->  [
                       {
                           "TaskName": "FM3_1T-read_out",
                           "Replace": {
                               "@exchpath": "FM3_1T_pressure",
                               "@token": "mon",
                               "@repeat": 10,
                               "@waittime": 500
                           }
                       },
                       {
                           "TaskName": "Combi_CE3-read_out",
                    "Use": {
                               "Values": "thermovac1"
                           },
                "Replace": {
                               "@exchpath": "Combi_CE3_thermovac1_pressure",
                               "@token": "mon",
                               "@repeat": 10,
                               "@waittime": 1000
                           }
                       }
```

Aus diesen Beschreibungen werden dann von __ssmp__ die konkreten
Abläufe erstellt. 

Es gibt einige Zeichenketten die als Ersetzungen in den Ablaufdefinitionen immer
zur Verfüging stehen wie z.B. das aktuelle Jahr über ```@year``` oder die
aktuell ausgewählten KD-ids über ```@cdids```. (s. das
[dbmp README](https://github.com/wactbprot/dbmp))
