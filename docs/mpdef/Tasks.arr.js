[
    {
        "Action": "yamp_worker_wait",
        "Comment": "Verzögert den Programmablauf um10 sec",
        "TaskName": "CE3_wait_10",
        "Value": {
            "WaitTime": 10000
        }
    },
    {
        "Action": "/bin/sleep",
        "Comment": "Notiert die relative Zeit unter Calibration.Measurement.Values.Time",
        "DocPath": "Calibration_Measurement_Values_Time",
        "PostProcessing": [
            "var _currDate = new Date(),",
            "_t =  _currDate.getTime().toString(),",
            "Result = [_.vlRes('rmt',''+_t,'ms')];"
        ],
        "TaskName": "CE3_time_exec",
        "Value": 0.1
    },
    {
        "Action": "/usr/bin/Rscript",
        "Comment": "Berechnet die Korrekturfaktoren und schreibt nach Result",
        "TaskName": "CE3_analyse",
        "Value": [
            "/usr/local/src/map/_attachments/map.R",
            "/usr/local/src/map/_attachments",
            "/usr/local/src/map/_attachments/scripts/analyse_TkorrFM3-CE3_YAMP.R"
        ]
    },
    {
        "Action": "yamp_worker_clearHtml",
        "ClearId": "corr_vals",
        "Comment": "Löscht die Tabellen (damit aktualisiert werden können)",
        "TaskName": "CE3_clean_tables"
    },
    {
        "Action": "yamp_worker_getShow",
        "AppendTo": "corr_vals",
        "Comment": "Liefert Tabellen aus den angegebenen Bereichen",
        "ShowName": "get_table",
        "TaskName": "CE3_get_tables",
        "UrlParams": {
            "DocPath": "Calibration_Result_Values_Temperature",
            "Type": [
                "agilentCorrCh101",
                "agilentCorrCh102",
                "agilentCorrCh103",
                "agilentCorrCh104",
                "agilentCorrCh105",
                "agilentCorrCh106",
                "agilentCorrCh107",
                "agilentCorrCh108",
                "agilentCorrCh109",
                "agilentCorrCh110"
            ]
        }
    }
]