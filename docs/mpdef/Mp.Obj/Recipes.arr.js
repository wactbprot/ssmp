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
                "Mp_wait_long"
            ],
            [
                "Mp_wait_long",
                "Mp_wait_long"
            ],
            [
                "Mp_wait_long"
            ]
        ],
        "RecipeClass": "choose",
        "ShortDescr": "Warten\n"
    }
]