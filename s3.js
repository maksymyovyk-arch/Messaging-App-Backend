if (process.env.NODE_ENV !== "production") require("dotenv").config();
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const Bucket = process.env.BUCKET_NAME;

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

async function uploadAvatar(Key, Body, ContentType) {
  return s3.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body,
      ContentType,
    })
  );
}

async function getAvatar(Key) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket,
      Key,
    })
  );
}

async function deleteAvatar(Key) {
  return s3.send(
    new DeleteObjectCommand({
      Bucket,
      Key,
    })
  );
}

async function checkAvatarExists(Key) {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket,
        Key,
      })
    );

    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  uploadAvatar,
  getAvatar,
  deleteAvatar,
  checkAvatarExists,
};
