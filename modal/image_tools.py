def upload_to_imgur(img_bytes) -> str:
    import requests
    import logging
    import base64
    import os

    IMGUR_CLIENT_ID = os.environ["IMGUR_CLIENT_ID"]

    resp = requests.post(
        "https://api.imgur.com/3/image",
        headers={"Authorization": f"Client-ID {IMGUR_CLIENT_ID}"},
        data={
            "image": base64.b64encode(img_bytes),
            "type": "base64",
            "name": "img",
            "title": "img",
        },
    ).json()
    logging.info("Imgur upload " + repr(resp))
    return resp["data"]["link"]
