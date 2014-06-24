module.exports = {
  "Mp": {
    "Name": "sim-ssmp",
    "Description": "A mp simulation",
    "Exchange": {
      "sim_on": {
        "Value": true
      },
      "server_info": {
           "Stime": 0,
           "Rtime": 0
       }
    },
    "Container": [
      {
        "Element": {
          "ctrl_client": {
            "Name": {
              "type": "text",
              "required": true
            },
            "Atime": {
              "type": "integer"
            }
          }
        },
        "Ctrl": "unformed",
        "NoOfRepeats": 1,
        "Recipe": [
          [
            {
              "TaskName": "Mp-wait",
              "Replace": {
                "_waittime": "1000"
              }
            },
            {
              "TaskName": "Mp-wait",
              "Replace": {
                "_waittime": "2000"
              }
            },
            {
              "TaskName": "Mp-wait",
              "Replace": {
                "_waittime": "3000"
              }
            }
          ]
        ],
        "Title": "Container 1"
      },
      {
        "Element": {
          "ctrl_client": {
            "Name": {
              "type": "text",
              "required": true
            },
            "Atime": {
              "type": "integer"
            }
          }
        },
        "Ctrl": "unformed",
        "NoOfRepeats": 1,
        "Recipe": [
           [
            {
              "TaskName": "Mp-wait",
              "Replace": {
                "_waittime": "1000"
              }
            },
            {
              "TaskName": "Mp-wait",
              "Replace": {
                "_waittime": "2000"
              }
            },
            {
              "TaskName": "Mp-wait",
              "Replace": {
                "_waittime": "3000"
              }
            }
           ]
        ],
        "Title": "Container 2"
      }
    ],
    "Date": [
      {
        "Type": "created",
        "Value": "2014-04-04"
      }
    ],
    "Defaults": {
      "_waittime": 1000
    },
    "Recipes": [
      {
        "Conditions": [
          {
            "ExchangePath": "sim_on.Value",
            "Methode": "eq",
              "Value": true
          }
        ],
        "Recipe": [
          [
            {
              "TaskName": "Mp-wait",
              "Replace": {
                "_waittime": "1000"
              }
            },{
              "TaskName": "Mp-wait",
              "Replace": {
                "_waittime": "2000"
              }
            }
          ],
          [
            {
              "TaskName": "Mp-wait",
              "Replace": {
                "_waittime": "3000"
              }
            },
            {
              "TaskName": "Mp-wait",
              "Replace": {
                "_waittime": "4000"
              }
            }
          ]
        ],
        "RecipeClass": "range_init",
        "ShortDescr": "Sets the Range depending on pfill\n"
      }
    ],
    "Tasks": [
      {
        "Action": "wait",
        "Comment": "_waitfor  _waittime ms",
        "TaskName": "wait",
        "Value": {
          "WaitTime": "_waittime"
        }
      }
    ]
  }
}