exports.definition = {
    "name": "Test Phone",
    "description": "My test phone",
    "URL": null,
    "public": false,
    "streams": {
        "location": {
            "description": "SO location",
            "type": "sensor",
            "channels": {
                "latitude": {
                    "type": "String"
                },
                "longitude": {
                    "type": "String"
                }
            }
        },
        "test": {
            type: "sensor",
            channels: {
                "testnumeric": {
                    type: "Number"
                },
                "testtext": {
                    type: "String"
                },
                "location": {
                    type: "String"
                }
            }
        }
    },
    "customFields": {
        "testsuite": true,
        "hashnumber": "xxxxxyyyyyzzzzzzzzzz",
        "phone_details": {
            model: "some model",
            os: "android",
            api: "19"
        }
    },
    "actions": [
        {
            "name": "notify",
            "description": "Create a notification"
        },
    ],
    "properties": []
};