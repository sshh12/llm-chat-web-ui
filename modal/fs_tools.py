import requests
import logging
import base64
import os
import boto3


def upload_image(image):
    import uuid
    import io
    import os

    byte_stream = io.BytesIO()
    image.save(byte_stream, format="PNG")
    image_bytes = byte_stream.getvalue()

    if os.environ.get("IMGUR_CLIENT_ID"):
        url = upload_to_imgur(image_bytes)
    else:
        url = upload_to_s3(image_bytes, f"images/{str(uuid.uuid4())}.png")

    return url


def upload_to_imgur(img_bytes) -> str:

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


def upload_to_s3(file_bytes, file_name) -> str:
    AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
    AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
    AWS_BUCKET_NAME = os.environ["AWS_BUCKET_NAME"]

    session = boto3.Session(
        aws_access_key_id=AWS_ACCESS_KEY_ID, aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )

    s3 = session.resource("s3")
    s3.Bucket(AWS_BUCKET_NAME).put_object(Key=file_name, Body=file_bytes)
    logging.info(f"Uploaded {file_name} to S3")

    return f"https://{AWS_BUCKET_NAME}.s3.amazonaws.com/{file_name}"
