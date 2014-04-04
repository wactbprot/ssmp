[
    {
        "Conditions": [
            {
                "ReadFrom": "token_1",
                "Methode": "LT",
                "Params": [
                    "value_1",
                    0.0001
                ]
            },
            {
                "ReadFrom": "token_1",
                "Methode": "GT",
                "Params": [
                    "value_1",
                    1e-11
                ]
            }
        ],
        "Recipe": [
            [
                "MP_wait_2s"
            ],
            [
                "MP_wait_2s",
                "MP_wait_2s"
            ],
            [
                "MP_wait_2s"
            ]
        ],
        "RecipeClass": "choose",
        "ShortDescr": "Warten\n"
    }
]