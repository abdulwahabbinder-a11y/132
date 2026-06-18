"""S3 output storage for serverless Lambda (API and worker use separate /tmp)."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from urllib.parse import urlparse

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


def output_bucket() -> str | None:
    bucket = os.environ.get("OUTPUT_BUCKET", "").strip()
    return bucket or None


def _s3_client():
    return boto3.client("s3", region_name=os.environ.get("AWS_REGION", "us-east-1"))


def publish_output_file(local_path: Path, object_key: str) -> str:
    """Upload rendered video to S3 when OUTPUT_BUCKET is set; else keep local path."""
    bucket = output_bucket()
    if not bucket or not local_path.is_file():
        return str(local_path)

    client = _s3_client()
    client.upload_file(
        str(local_path),
        bucket,
        object_key,
        ExtraArgs={"ContentType": "video/mp4"},
    )
    uri = f"s3://{bucket}/{object_key}"
    logger.info("Uploaded output to %s", uri)
    return uri


def parse_s3_uri(uri: str) -> tuple[str, str] | None:
    if not uri.startswith("s3://"):
        return None
    parsed = urlparse(uri)
    bucket = parsed.netloc
    key = parsed.path.lstrip("/")
    if not bucket or not key:
        return None
    return bucket, key


def presigned_download_url(s3_uri: str, expires_in: int = 3600) -> str | None:
    parsed = parse_s3_uri(s3_uri)
    if not parsed:
        return None
    bucket, key = parsed
    try:
        return _s3_client().generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_in,
        )
    except ClientError:
        logger.exception("Failed to presign s3://%s/%s", bucket, key)
        return None
