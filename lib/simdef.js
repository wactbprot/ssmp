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
        "Definition": [
          [
            {
              "TaskName": "Sim-wait"
            },
            {
              "TaskName": "Sim-wait"
            },
            {
              "TaskName": "Sim-wait"
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
        "Definition": [
           [
            {
              "TaskName": "Sim-wait"
            },
            {
              "TaskName": "Sim-wait"
            },
            {
              "TaskName": "Sim-wait"
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
    "Recipes": [
      {
        "Conditions": [
          {
            "ExchangePath": "sim_on.Value",
            "Methode": "eq",
              "Value": true
          }
        ],
        "Definition": [
          [
            {
              "TaskName": "Sim-wait"

            },{
              "TaskName": "Sim-wait"
            }
          ],
          [
            {
              "TaskName": "Sim-wait"
            },
            {
              "TaskName": "Sim-wait"
            }
          ]
        ],
        "RecipeClass": "test_init",
        "ShortDescr": "Test the recipe replacement\n"
      }
    ]
  }
}