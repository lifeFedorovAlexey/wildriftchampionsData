import { apiRequire, origin } from './config.mjs';

export function storageClient(config) {
  const { S3Client } = apiRequire('@aws-sdk/client-s3');
  return new S3Client({ endpoint: config.storage.endpoint, region: config.storage.region, forcePathStyle: true,
    credentials: { accessKeyId: config.storage.accessKey, secretAccessKey: config.storage.secretKey } });
}

export async function storageStatus(config) {
  const { HeadBucketCommand } = apiRequire('@aws-sdk/client-s3');
  const client = storageClient(config);
  try {
    await client.send(new HeadBucketCommand({ Bucket: 'wildrift-dev' }), { abortSignal: AbortSignal.timeout(3000) });
    return { ok: true, url: origin('storage'), host: 'kolvrt', bucket: config.storage.bucket };
  } catch { return { ok: false, url: origin('storage') }; }
  finally { client.destroy(); }
}

export async function setupStorage(config) {
  const { HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand, PutBucketCorsCommand } = apiRequire('@aws-sdk/client-s3');
  const client = storageClient(config);
  try {
    try { await client.send(new HeadBucketCommand({ Bucket: 'wildrift-dev' })); }
    catch (error) {
      if (error.$metadata?.httpStatusCode !== 404) throw error;
      await client.send(new CreateBucketCommand({ Bucket: 'wildrift-dev' }));
    }
    await client.send(new PutBucketPolicyCommand({ Bucket: 'wildrift-dev', Policy: JSON.stringify({
      Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: '*', Action: ['s3:GetObject'], Resource: ['arn:aws:s3:::wildrift-dev/*'] }],
    }) }));
    await client.send(new PutBucketCorsCommand({ Bucket: 'wildrift-dev', CORSConfiguration: { CORSRules: [{
      AllowedOrigins: [origin('ui')], AllowedMethods: ['GET', 'HEAD', 'POST', 'PUT'], AllowedHeaders: ['*'], ExposeHeaders: ['ETag'], MaxAgeSeconds: 300,
    }] } }));
  } finally { client.destroy(); }
}
